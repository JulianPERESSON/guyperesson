import { z } from "zod";
import { categories } from "@/data/categories";

const MAIN_CATEGORY_SLUGS = [
  "ceramique",
  "revues-auto-moto",
  "cartes-postales",
] as const;
const PRODUCT_STATUSES = [
  "AVAILABLE",
  "RESERVED",
  "SOLD",
  "UNAVAILABLE",
  "COMING_SOON",
] as const;
const PRODUCT_CONDITIONS = [
  "MINT",
  "EXCELLENT",
  "VERY_GOOD",
  "GOOD",
  "FAIR",
  "POOR",
] as const;
const PRODUCT_RARITIES = [
  "COMMON",
  "UNCOMMON",
  "RARE",
  "VERY_RARE",
  "EXCEPTIONAL",
] as const;

const slugSchema = z
  .string()
  .min(1)
  .max(160)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Utilisez un slug en minuscules séparé par des tirets.");
const optionalText = (maximum: number) =>
  z.preprocess(
    (value) => (typeof value === "string" && value.trim() === "" ? undefined : value),
    z.string().trim().max(maximum).optional(),
  );
const requiredMoney = z.preprocess(
  parseNumber,
  z.number().finite().positive().max(1_000_000),
);
const optionalMoney = z.preprocess(
  parseOptionalNumber,
  z.number().finite().nonnegative().max(1_000_000).optional(),
);
const requiredInteger = z.preprocess(
  parseNumber,
  z.number().int().nonnegative().max(100_000),
);
const optionalInteger = (minimum: number, maximum: number) =>
  z.preprocess(
    parseOptionalNumber,
    z.number().int().min(minimum).max(maximum).optional(),
  );
const booleanWithDefault = (defaultValue: boolean) =>
  z.preprocess(parseBoolean, z.boolean()).default(defaultValue);

function parseNumber(value: unknown) {
  if (typeof value !== "string") return value;
  const normalized = value.trim().replace(",", ".");
  return normalized === "" ? undefined : Number(normalized);
}

function parseOptionalNumber(value: unknown) {
  if (value === null || value === "") return undefined;
  return parseNumber(value);
}

function parseBoolean(value: unknown) {
  if (value === "true" || value === "on" || value === 1) return true;
  if (value === "false" || value === "off" || value === 0) return false;
  return value;
}

export function slugifyProductValue(value: string) {
  return value
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/['’]/g, "-")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-")
    .slice(0, 160);
}

function parseSlug(value: unknown) {
  if (typeof value !== "string" || value.trim() === "") return undefined;
  return slugifyProductValue(value);
}

function parseStringList(value: unknown) {
  if (typeof value === "string") {
    return value
      .split(/[,;\n]/)
      .map((item) => item.trim())
      .filter(Boolean);
  }
  return value;
}

function isSafeImageUrl(value: string) {
  if (value.startsWith("/") && !value.startsWith("//") && !value.includes("\\")) {
    return true;
  }

  try {
    return new URL(value).protocol === "https:";
  } catch {
    return false;
  }
}

const safeImageUrlSchema = z
  .string()
  .trim()
  .min(1)
  .max(2_048)
  .refine(isSafeImageUrl, "Utilisez un chemin local ou une URL HTTPS.");
const imageInputSchema = z
  .object({
    url: safeImageUrlSchema,
    alt: z.string().trim().min(1).max(300),
    isMain: z.boolean().optional(),
  })
  .strict();

export const productCreateSchema = z
  .object({
    name: z.string().trim().min(3).max(200),
    slug: z.preprocess(parseSlug, slugSchema.optional()),
    reference: z
      .string()
      .trim()
      .toUpperCase()
      .min(2)
      .max(64)
      .regex(
        /^[A-Z0-9][A-Z0-9._/-]*$/,
        "La référence accepte uniquement lettres, chiffres, point, tiret, barre oblique et soulignement.",
      ),
    categorySlug: z.enum(MAIN_CATEGORY_SLUGS),
    subcategory: z.string().trim().min(1).max(120),
    subcategorySlug: z.preprocess(parseSlug, slugSchema.optional()),
    collectionSlugs: z
      .preprocess(parseStringList, z.array(slugSchema).max(30))
      .default([]),
    shortDescription: z.string().trim().min(10).max(500),
    description: z.string().trim().min(20).max(20_000),
    price: requiredMoney,
    previousPrice: optionalMoney,
    quantity: requiredInteger.default(1),
    status: z.enum(PRODUCT_STATUSES).default("AVAILABLE"),
    condition: z.enum(PRODUCT_CONDITIONS).default("GOOD"),
    rarity: z.enum(PRODUCT_RARITIES).default("COMMON"),
    exactDate: z
      .string()
      .trim()
      .regex(/^\d{4}-\d{2}-\d{2}$/, "Utilisez une date au format AAAA-MM-JJ.")
      .optional(),
    estimatedYear: optionalInteger(1000, new Date().getFullYear() + 2),
    period: optionalText(100),
    country: optionalText(100),
    region: optionalText(120),
    city: optionalText(120),
    manufacturer: optionalText(160),
    artist: optionalText(160),
    author: optionalText(160),
    publisher: optionalText(160),
    brand: optionalText(160),
    model: optionalText(160),
    issueNumber: optionalText(80),
    dimensions: optionalText(200),
    weightGrams: optionalInteger(0, 1_000_000),
    material: optionalText(160),
    color: optionalText(160),
    language: optionalText(80),
    signature: z.preprocess(parseBoolean, z.boolean().optional()),
    numbered: z.preprocess(parseBoolean, z.boolean().optional()),
    serialNumber: optionalText(120),
    written: z.preprocess(parseBoolean, z.boolean().optional()),
    circulated: z.preprocess(parseBoolean, z.boolean().optional()),
    stampPresent: z.preprocess(parseBoolean, z.boolean().optional()),
    monochrome: z.preprocess(parseBoolean, z.boolean().optional()),
    provenance: optionalText(5_000),
    history: optionalText(10_000),
    defects: optionalText(5_000),
    restoration: optionalText(5_000),
    conservation: optionalText(5_000),
    keywords: z
      .preprocess(
        parseStringList,
        z.array(z.string().trim().min(1).max(80)).max(40),
      )
      .default([]),
    images: z.array(imageInputSchema).max(12).default([]),
    image: z.preprocess(
      (value) => (value === "" ? undefined : value),
      safeImageUrlSchema.optional(),
    ),
    imageAlt: optionalText(300),
    shippingPrice: z.preprocess(
      parseOptionalNumber,
      z.number().finite().nonnegative().max(10_000).default(0),
    ),
    shippingDelayDays: z.preprocess(
      parseOptionalNumber,
      z.number().int().min(0).max(365).default(2),
    ),
    featured: booleanWithDefault(false),
    rareItem: booleanWithDefault(false),
    published: booleanWithDefault(true),
    newArrival: booleanWithDefault(true),
    reservable: booleanWithDefault(true),
    offerEnabled: booleanWithDefault(false),
    isUnique: booleanWithDefault(true),
  })
  .strict()
  .superRefine((product, context) => {
    if (product.previousPrice !== undefined && product.previousPrice <= product.price) {
      context.addIssue({
        code: "custom",
        path: ["previousPrice"],
        message: "L’ancien prix doit être supérieur au prix actuel.",
      });
    }
    if (product.isUnique && product.quantity > 1) {
      context.addIssue({
        code: "custom",
        path: ["quantity"],
        message: "Un objet unique ne peut avoir qu’un exemplaire.",
      });
    }
    if (product.status === "AVAILABLE" && product.quantity < 1) {
      context.addIssue({
        code: "custom",
        path: ["quantity"],
        message: "Un objet disponible doit avoir au moins un exemplaire.",
      });
    }
    if (product.status === "SOLD" && product.quantity !== 0) {
      context.addIssue({
        code: "custom",
        path: ["quantity"],
        message: "Un objet vendu doit avoir une quantité égale à zéro.",
      });
    }
    if (product.images.filter((image) => image.isMain).length > 1) {
      context.addIssue({
        code: "custom",
        path: ["images"],
        message: "Une seule image principale est autorisée.",
      });
    }
  })
  .transform((product) => {
    const category = categories.find(
      (candidate) => candidate.slug === product.categorySlug,
    );

    if (!category) {
      throw new Error("Catégorie de catalogue inconnue.");
    }

    return {
      ...product,
      slug: product.slug || slugifyProductValue(product.name),
      subcategorySlug:
        product.subcategorySlug || slugifyProductValue(product.subcategory),
      categoryId: category.id,
      categoryName: category.name,
      period: product.period || "Date inconnue",
      country: product.country || "France",
      dimensions: product.dimensions || "Non renseignées",
      color: product.color || "Non renseignée",
      provenance: product.provenance || "Non renseignée.",
      history: product.history || "Non renseigné.",
      defects: product.defects || "Aucun défaut signalé.",
      restoration: product.restoration || "Aucune restauration signalée.",
      conservation: product.conservation || "Conditions usuelles de conservation.",
    };
  });

const storedProductImageSchema = imageInputSchema.extend({
  id: z.string().min(1).max(200),
  position: z.number().int().min(0).max(100),
  isMain: z.boolean(),
});

export const storedProductSchema = z
  .object({
    id: z.string().min(1).max(200),
    name: z.string().min(1).max(200),
    slug: slugSchema,
    reference: z.string().min(1).max(64),
    categoryId: z.string().min(1).max(100),
    categorySlug: z.enum(MAIN_CATEGORY_SLUGS),
    categoryName: z.string().min(1).max(120),
    subcategory: z.string().min(1).max(120),
    subcategorySlug: slugSchema,
    collectionSlugs: z.array(slugSchema).max(30),
    shortDescription: z.string().min(1).max(500),
    description: z.string().min(1).max(20_000),
    price: z.number().finite().positive(),
    previousPrice: z.number().finite().nonnegative().optional(),
    quantity: z.number().int().nonnegative(),
    status: z.enum(PRODUCT_STATUSES),
    condition: z.enum(PRODUCT_CONDITIONS),
    rarity: z.enum(PRODUCT_RARITIES),
    exactDate: z.string().optional(),
    estimatedYear: z.number().int().optional(),
    period: z.string().max(100),
    country: z.string().max(100),
    region: z.string().max(120).optional(),
    city: z.string().max(120).optional(),
    manufacturer: z.string().max(160).optional(),
    artist: z.string().max(160).optional(),
    author: z.string().max(160).optional(),
    publisher: z.string().max(160).optional(),
    brand: z.string().max(160).optional(),
    model: z.string().max(160).optional(),
    issueNumber: z.string().max(80).optional(),
    dimensions: z.string().max(200),
    weightGrams: z.number().int().nonnegative().optional(),
    material: z.string().max(160).optional(),
    color: z.string().max(160),
    language: z.string().max(80).optional(),
    signature: z.boolean().optional(),
    numbered: z.boolean().optional(),
    serialNumber: z.string().max(120).optional(),
    written: z.boolean().optional(),
    circulated: z.boolean().optional(),
    stampPresent: z.boolean().optional(),
    monochrome: z.boolean().optional(),
    provenance: z.string().max(5_000),
    history: z.string().max(10_000),
    defects: z.string().max(5_000),
    restoration: z.string().max(5_000),
    conservation: z.string().max(5_000),
    keywords: z.array(z.string().max(80)).max(40),
    images: z.array(storedProductImageSchema).max(12),
    image: safeImageUrlSchema,
    imageAlt: z.string().min(1).max(300),
    shippingPrice: z.number().finite().nonnegative(),
    shippingDelayDays: z.number().int().min(0).max(365),
    featured: z.boolean(),
    rareItem: z.boolean(),
    published: z.boolean(),
    newArrival: z.boolean(),
    reservable: z.boolean(),
    offerEnabled: z.boolean(),
    isUnique: z.boolean(),
    createdAt: z.string().datetime(),
    updatedAt: z.string().datetime(),
  })
  .strict();

export type ProductCreateInput = z.output<typeof productCreateSchema>;
