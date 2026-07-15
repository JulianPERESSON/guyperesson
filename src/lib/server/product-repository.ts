import {
  mkdir,
  open,
  readFile,
  rename,
  stat,
  unlink,
  type FileHandle,
} from "node:fs/promises";
import path from "node:path";
import { setTimeout as delay } from "node:timers/promises";
import { z } from "zod";
import { demoProducts } from "@/data/products";
import {
  storedProductSchema,
  type ProductCreateInput,
} from "@/lib/server/product-validation";
import type { CatalogProduct } from "@/types/catalog";

const STORE_VERSION = 1;
const MAX_LOCAL_PRODUCTS = 2_000;
const MAX_STORE_BYTES = 20 * 1024 * 1024;
const LOCK_TIMEOUT_MS = 5_000;
const STALE_LOCK_MS = 15_000;
const MUTATION_QUEUES_SYMBOL = Symbol.for("linventaire.product-store-queues");

const storeFileSchema = z
  .object({
    version: z.literal(STORE_VERSION),
    updatedAt: z.string().datetime(),
    products: z.array(storedProductSchema).max(MAX_LOCAL_PRODUCTS),
  })
  .strict();

type StoreFile = z.infer<typeof storeFileSchema>;
type GlobalWithMutationQueues = typeof globalThis & {
  [MUTATION_QUEUES_SYMBOL]?: Map<string, Promise<void>>;
};

const globalMutationStore = globalThis as GlobalWithMutationQueues;
const mutationQueues =
  globalMutationStore[MUTATION_QUEUES_SYMBOL] ??
  (globalMutationStore[MUTATION_QUEUES_SYMBOL] = new Map());

export interface ProductRepository {
  list(): Promise<readonly CatalogProduct[]>;
  create(product: ProductCreateInput): Promise<CatalogProduct>;
}

export class ProductRepositoryUnavailableError extends Error {
  constructor() {
    super(
      "Le stockage local des produits est désactivé en production. Configurez une base de données ou activez explicitement le mode démo.",
    );
    this.name = "ProductRepositoryUnavailableError";
  }
}

export class ProductStoreCorruptedError extends Error {
  constructor() {
    super("Le fichier local des produits est illisible ou invalide.");
    this.name = "ProductStoreCorruptedError";
  }
}

export class ProductStoreBusyError extends Error {
  constructor() {
    super("Le stockage local est occupé. Réessayez dans un instant.");
    this.name = "ProductStoreBusyError";
  }
}

export class ProductConflictError extends Error {
  readonly fields: readonly ("slug" | "reference")[];

  constructor(fields: readonly ("slug" | "reference")[]) {
    super("Un produit possède déjà ce slug ou cette référence.");
    this.name = "ProductConflictError";
    this.fields = fields;
  }
}

function isErrno(error: unknown, code: string): error is NodeJS.ErrnoException {
  return (
    error instanceof Error &&
    "code" in error &&
    (error as NodeJS.ErrnoException).code === code
  );
}

function localStoreIsEnabled() {
  return (
    process.env.NODE_ENV !== "production" ||
    process.env.DEMO_PRODUCT_STORE_ENABLED === "true"
  );
}

export function getLocalProductStorePath() {
  const configuredPath = process.env.DEMO_PRODUCT_STORE_PATH?.trim();

  // Tests receive an isolated absolute path. Runtime files remain strictly
  // scoped to .data so Next's file tracer never follows a dynamic project root.
  if (process.env.NODE_ENV === "test" && configuredPath) return configuredPath;

  const dataDirectory = path.join(
    /* turbopackIgnore: true */ process.cwd(),
    ".data",
  );
  const fileName = configuredPath
    ? path.basename(configuredPath)
    : "admin-products.json";
  return path.join(dataDirectory, fileName);
}

async function queueMutation<T>(filePath: string, operation: () => Promise<T>) {
  const previous = mutationQueues.get(filePath) ?? Promise.resolve();
  let releaseQueue: () => void = () => undefined;
  const queueEntry = new Promise<void>((resolve) => {
    releaseQueue = resolve;
  });
  const queueTail = previous.then(() => queueEntry);
  mutationQueues.set(filePath, queueTail);

  await previous;
  try {
    return await operation();
  } finally {
    releaseQueue();
    if (mutationQueues.get(filePath) === queueTail) mutationQueues.delete(filePath);
  }
}

async function acquireFileLock(filePath: string) {
  const lockPath = `${filePath}.lock`;
  const deadline = Date.now() + LOCK_TIMEOUT_MS;

  while (Date.now() < deadline) {
    let handle: FileHandle | null = null;
    try {
      handle = await open(lockPath, "wx", 0o600);
      await handle.writeFile(`${process.pid}\n${new Date().toISOString()}\n`, "utf8");
      return async () => {
        await handle?.close().catch(() => undefined);
        await unlink(lockPath).catch(() => undefined);
      };
    } catch (error) {
      await handle?.close().catch(() => undefined);
      if (!isErrno(error, "EEXIST")) throw error;

      try {
        const lockInfo = await stat(lockPath);
        if (Date.now() - lockInfo.mtimeMs > STALE_LOCK_MS) {
          await unlink(lockPath).catch(() => undefined);
          continue;
        }
      } catch (lockError) {
        if (!isErrno(lockError, "ENOENT")) throw lockError;
      }

      await delay(35);
    }
  }

  throw new ProductStoreBusyError();
}

async function readStore(filePath: string): Promise<StoreFile> {
  try {
    const fileInfo = await stat(filePath);
    if (fileInfo.size > MAX_STORE_BYTES) throw new ProductStoreCorruptedError();

    const rawStore = await readFile(filePath, "utf8");
    const parsedJson = JSON.parse(rawStore) as unknown;
    const parsedStore = storeFileSchema.safeParse(parsedJson);
    if (!parsedStore.success) throw new ProductStoreCorruptedError();
    return parsedStore.data;
  } catch (error) {
    if (isErrno(error, "ENOENT")) {
      return {
        version: STORE_VERSION,
        updatedAt: new Date(0).toISOString(),
        products: [],
      };
    }
    if (error instanceof ProductStoreCorruptedError) throw error;
    if (error instanceof SyntaxError) throw new ProductStoreCorruptedError();
    throw error;
  }
}

async function writeStore(filePath: string, products: readonly CatalogProduct[]) {
  const directory = path.dirname(filePath);
  await mkdir(directory, { recursive: true, mode: 0o700 });

  const store = storeFileSchema.parse({
    version: STORE_VERSION,
    updatedAt: new Date().toISOString(),
    products,
  });
  const serialized = `${JSON.stringify(store, null, 2)}\n`;
  if (Buffer.byteLength(serialized, "utf8") > MAX_STORE_BYTES) {
    throw new ProductStoreCorruptedError();
  }

  const temporaryPath = path.join(
    directory,
    `.${path.basename(filePath)}.${process.pid}.${globalThis.crypto.randomUUID()}.tmp`,
  );
  let temporaryHandle: FileHandle | null = null;

  try {
    temporaryHandle = await open(temporaryPath, "wx", 0o600);
    await temporaryHandle.writeFile(serialized, "utf8");
    await temporaryHandle.sync();
    await temporaryHandle.close();
    temporaryHandle = null;
    await rename(temporaryPath, filePath);
  } finally {
    await temporaryHandle?.close().catch(() => undefined);
    await unlink(temporaryPath).catch(() => undefined);
  }
}

function buildCatalogProduct(input: ProductCreateInput): CatalogProduct {
  const id = `prod-local-${globalThis.crypto.randomUUID()}`;
  const now = new Date().toISOString();
  const fallbackImage =
    input.image || `/images/demo/${input.categorySlug}-${input.slug}.svg`;
  const sourceImages =
    input.images.length > 0
      ? input.images
      : [
          {
            url: fallbackImage,
            alt: input.imageAlt || `${input.name} — visuel de démonstration`,
            isMain: true,
          },
        ];
  const requestedMainIndex = sourceImages.findIndex((image) => image.isMain);
  const mainIndex = requestedMainIndex >= 0 ? requestedMainIndex : 0;
  const images = sourceImages.map((image, position) => ({
    id: `${id}-img-${position + 1}`,
    url: image.url,
    alt: image.alt,
    position,
    isMain: position === mainIndex,
  }));
  const mainImage = images[mainIndex];

  return {
    id,
    name: input.name,
    slug: input.slug,
    reference: input.reference,
    categoryId: input.categoryId,
    categorySlug: input.categorySlug,
    categoryName: input.categoryName,
    subcategory: input.subcategory,
    subcategorySlug: input.subcategorySlug,
    collectionSlugs: input.collectionSlugs,
    shortDescription: input.shortDescription,
    description: input.description,
    price: input.price,
    previousPrice: input.previousPrice,
    quantity: input.quantity,
    status: input.status,
    condition: input.condition,
    rarity: input.rarity,
    exactDate: input.exactDate,
    estimatedYear: input.estimatedYear,
    period: input.period,
    country: input.country,
    region: input.region,
    city: input.city,
    manufacturer: input.manufacturer,
    artist: input.artist,
    author: input.author,
    publisher: input.publisher,
    brand: input.brand,
    model: input.model,
    issueNumber: input.issueNumber,
    dimensions: input.dimensions,
    weightGrams: input.weightGrams,
    material: input.material,
    color: input.color,
    language: input.language,
    signature: input.signature,
    numbered: input.numbered,
    serialNumber: input.serialNumber,
    written: input.written,
    circulated: input.circulated,
    stampPresent: input.stampPresent,
    monochrome: input.monochrome,
    provenance: input.provenance,
    history: input.history,
    defects: input.defects,
    restoration: input.restoration,
    conservation: input.conservation,
    keywords: input.keywords,
    images,
    image: mainImage.url,
    imageAlt: input.imageAlt || mainImage.alt,
    shippingPrice: input.shippingPrice,
    shippingDelayDays: input.shippingDelayDays,
    featured: input.featured,
    rareItem: input.rareItem,
    published: input.published,
    newArrival: input.newArrival,
    reservable: input.reservable,
    offerEnabled: input.offerEnabled,
    isUnique: input.isUnique,
    createdAt: now,
    updatedAt: now,
  };
}

export class LocalJsonProductRepository implements ProductRepository {
  constructor(private readonly filePath = getLocalProductStorePath()) {}

  async list() {
    if (!localStoreIsEnabled()) return [];
    const store = await readStore(this.filePath);
    return store.products;
  }

  async create(input: ProductCreateInput) {
    if (!localStoreIsEnabled()) throw new ProductRepositoryUnavailableError();

    return queueMutation(this.filePath, async () => {
      await mkdir(path.dirname(this.filePath), { recursive: true, mode: 0o700 });
      const releaseLock = await acquireFileLock(this.filePath);

      try {
        const store = await readStore(this.filePath);
        const candidates = [...demoProducts, ...store.products];
        const conflictFields: Array<"slug" | "reference"> = [];

        if (candidates.some((product) => product.slug === input.slug)) {
          conflictFields.push("slug");
        }
        if (
          candidates.some(
            (product) =>
              product.reference.toLocaleUpperCase("fr-FR") ===
              input.reference.toLocaleUpperCase("fr-FR"),
          )
        ) {
          conflictFields.push("reference");
        }
        if (conflictFields.length > 0) throw new ProductConflictError(conflictFields);
        if (store.products.length >= MAX_LOCAL_PRODUCTS) {
          throw new ProductStoreCorruptedError();
        }

        const product = buildCatalogProduct(input);
        await writeStore(this.filePath, [product, ...store.products]);
        return product;
      } finally {
        await releaseLock();
      }
    });
  }
}

async function listLocalProducts() {
  return new LocalJsonProductRepository().list();
}

function newestFirst(products: readonly CatalogProduct[]) {
  return [...products].sort((left, right) =>
    right.createdAt.localeCompare(left.createdAt),
  );
}

export async function listPublishedProducts(): Promise<readonly CatalogProduct[]> {
  const localProducts = await listLocalProducts();
  return newestFirst(
    [...localProducts, ...demoProducts].filter((product) => product.published),
  );
}

export async function listAdminProducts(): Promise<readonly CatalogProduct[]> {
  const localProducts = await listLocalProducts();
  return newestFirst([...localProducts, ...demoProducts]);
}

export async function getProductBySlug(
  slug: string,
  options: { includeUnpublished?: boolean } = {},
): Promise<CatalogProduct | null> {
  const normalizedSlug = slug.trim().toLowerCase();
  const localProducts = await listLocalProducts();
  const product = [...localProducts, ...demoProducts].find(
    (candidate) => candidate.slug === normalizedSlug,
  );

  if (!product || (!options.includeUnpublished && !product.published)) return null;
  return product;
}

export async function createProduct(input: ProductCreateInput) {
  return new LocalJsonProductRepository().create(input);
}
