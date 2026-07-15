import "dotenv/config";

import { PrismaPg } from "@prisma/adapter-pg";
import { hash } from "bcryptjs";

import { collections } from "../src/data/collections";
import { categories } from "../src/data/categories";
import { products } from "../src/data/products";
import { PrismaClient } from "../src/generated/prisma/client";

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error(
    "DATABASE_URL est obligatoire pour exécuter les données de démonstration.",
  );
}

const adapter = new PrismaPg({ connectionString: databaseUrl });
const prisma = new PrismaClient({ adapter });

async function seedCategories(): Promise<{
  mainCategoryIdBySlug: Map<string, string>;
  subcategoryIdByKey: Map<string, string>;
}> {
  const mainCategoryIdBySlug = new Map<string, string>();
  const subcategoryIdByKey = new Map<string, string>();

  for (const [categoryPosition, category] of categories.entries()) {
    const mainCategory = await prisma.category.upsert({
      where: { slug: category.slug },
      create: {
        id: category.id,
        name: category.name,
        slug: category.slug,
        description: category.description,
        image: category.image,
        position: categoryPosition,
        active: true,
      },
      update: {
        name: category.name,
        description: category.description,
        image: category.image,
        position: categoryPosition,
        active: true,
        parentId: null,
      },
    });

    mainCategoryIdBySlug.set(category.slug, mainCategory.id);

    for (const [subcategoryPosition, subcategory] of category.subcategories.entries()) {
      const childCategory = await prisma.category.upsert({
        where: { slug: `${category.slug}-${subcategory.slug}` },
        create: {
          id: subcategory.id,
          name: subcategory.name,
          slug: `${category.slug}-${subcategory.slug}`,
          description: subcategory.description,
          position: subcategoryPosition,
          active: true,
          parentId: mainCategory.id,
        },
        update: {
          name: subcategory.name,
          description: subcategory.description,
          position: subcategoryPosition,
          active: true,
          parentId: mainCategory.id,
        },
      });

      subcategoryIdByKey.set(
        `${category.slug}:${subcategory.slug}`,
        childCategory.id,
      );
    }
  }

  return { mainCategoryIdBySlug, subcategoryIdByKey };
}

async function seedCollections(
  mainCategoryIdBySlug: ReadonlyMap<string, string>,
): Promise<Map<string, string>> {
  const collectionIdBySlug = new Map<string, string>();

  for (const collection of collections) {
    const categoryId = mainCategoryIdBySlug.get(collection.categorySlug);

    if (!categoryId) {
      throw new Error(
        `Catégorie introuvable pour la collection « ${collection.name} ».`,
      );
    }

    const collectionRow = await prisma.collection.upsert({
      where: { slug: collection.slug },
      create: {
        id: collection.id,
        name: collection.name,
        slug: collection.slug,
        description: collection.description,
        coverImage: collection.coverImage,
        categoryId,
        subcategory: collection.subcategory,
        startDate: collection.startDate
          ? new Date(collection.startDate)
          : null,
        endDate: collection.endDate ? new Date(collection.endDate) : null,
        period: collection.period,
        artist: collection.artist,
        manufacturer: collection.manufacturer,
        publisher: collection.publisher,
        brand: collection.brand,
        theme: collection.theme,
        country: collection.country,
        region: collection.region,
        featured: collection.featured,
        published: true,
      },
      update: {
        name: collection.name,
        description: collection.description,
        coverImage: collection.coverImage,
        categoryId,
        subcategory: collection.subcategory,
        startDate: collection.startDate
          ? new Date(collection.startDate)
          : null,
        endDate: collection.endDate ? new Date(collection.endDate) : null,
        period: collection.period,
        artist: collection.artist,
        manufacturer: collection.manufacturer,
        publisher: collection.publisher,
        brand: collection.brand,
        theme: collection.theme,
        country: collection.country,
        region: collection.region,
        featured: collection.featured,
        published: true,
      },
    });

    collectionIdBySlug.set(collection.slug, collectionRow.id);
  }

  return collectionIdBySlug;
}

async function seedProducts(
  mainCategoryIdBySlug: ReadonlyMap<string, string>,
  subcategoryIdByKey: ReadonlyMap<string, string>,
  collectionIdBySlug: ReadonlyMap<string, string>,
): Promise<void> {
  for (const product of products) {
    const categoryId =
      subcategoryIdByKey.get(
        `${product.categorySlug}:${product.subcategorySlug}`,
      ) ?? mainCategoryIdBySlug.get(product.categorySlug);

    if (!categoryId) {
      throw new Error(`Catégorie introuvable pour « ${product.name} ».`);
    }

    const productData = {
      name: product.name,
      slug: product.slug,
      reference: product.reference,
      shortDescription: product.shortDescription,
      description: product.description,
      price: product.price,
      previousPrice: product.previousPrice ?? null,
      quantity: product.quantity,
      status: product.status,
      condition: product.condition,
      rarity: product.rarity,
      exactDate: product.exactDate ? new Date(product.exactDate) : null,
      estimatedYear: product.estimatedYear ?? null,
      period: product.period,
      country: product.country,
      region: product.region ?? null,
      city: product.city ?? null,
      manufacturer: product.manufacturer ?? null,
      artist: product.artist ?? null,
      author: product.author ?? null,
      publisher: product.publisher ?? null,
      brand: product.brand ?? null,
      model: product.model ?? null,
      issueNumber: product.issueNumber ?? null,
      dimensions: product.dimensions,
      weight: product.weightGrams ?? null,
      material: product.material ?? null,
      color: product.color,
      language: product.language ?? null,
      signature: product.signature ?? null,
      numbered: product.numbered ?? null,
      serialNumber: product.serialNumber ?? null,
      written: product.written ?? null,
      circulated: product.circulated ?? null,
      stampPresent: product.stampPresent ?? null,
      monochrome: product.monochrome ?? null,
      provenance: product.provenance,
      history: product.history,
      defects: product.defects,
      restoration: product.restoration,
      conservation: product.conservation,
      keywords: [...product.keywords],
      shippingPrice: product.shippingPrice,
      shippingDelay: product.shippingDelayDays,
      featured: product.featured,
      rareItem: product.rareItem,
      newArrival: product.newArrival,
      reservable: product.reservable,
      offerEnabled: product.offerEnabled,
      isUnique: product.isUnique,
      published: product.published,
      seoTitle: product.name,
      seoDescription: product.shortDescription,
      categoryId,
    };

    const productRow = await prisma.product.upsert({
      where: { reference: product.reference },
      create: {
        id: product.id,
        ...productData,
        createdAt: new Date(product.createdAt),
        updatedAt: new Date(product.updatedAt),
      },
      update: productData,
    });

    for (const image of product.images) {
      await prisma.productImage.upsert({
        where: { id: image.id },
        create: {
          id: image.id,
          productId: productRow.id,
          imageUrl: image.url,
          altText: image.alt,
          position: image.position,
          isMain: image.isMain,
        },
        update: {
          productId: productRow.id,
          imageUrl: image.url,
          altText: image.alt,
          position: image.position,
          isMain: image.isMain,
        },
      });
    }

    const desiredCollectionIds = product.collectionSlugs.flatMap((slug) => {
      const collectionId = collectionIdBySlug.get(slug);
      return collectionId ? [collectionId] : [];
    });

    await prisma.productCollection.deleteMany({
      where: {
        productId: productRow.id,
        collectionId: { notIn: desiredCollectionIds },
      },
    });

    for (const [position, collectionId] of desiredCollectionIds.entries()) {
      await prisma.productCollection.upsert({
        where: {
          productId_collectionId: {
            productId: productRow.id,
            collectionId,
          },
        },
        create: {
          productId: productRow.id,
          collectionId,
          position,
        },
        update: { position },
      });
    }
  }
}

async function seedPromotionAndPages(): Promise<void> {
  await prisma.promotionCode.upsert({
    where: { code: "BIENVENUE10" },
    create: {
      code: "BIENVENUE10",
      type: "PERCENTAGE",
      value: 10,
      minimumAmount: 50,
      active: true,
    },
    update: {
      type: "PERCENTAGE",
      value: 10,
      minimumAmount: 50,
      active: true,
    },
  });

  const pages = [
    {
      key: "home.hero",
      title: "Bannière d'accueil",
      slug: null,
      content: {
        eyebrow: "Objets choisis, histoires préservées",
        heading: "Des collections qui traversent le temps",
        body: "Céramiques, revues mécaniques et cartes postales documentées avec soin.",
      },
    },
    {
      key: "about",
      title: "À propos",
      slug: "a-propos",
      content: {
        heading: "La passion de transmettre",
        body: "Chaque objet est examiné, décrit et photographié avec la même exigence.",
      },
    },
    {
      key: "legal.shipping-returns",
      title: "Livraison et retours",
      slug: "livraison-et-retours",
      content: {
        heading: "Emballage soigné et suivi",
        body: "Les pièces sont protégées selon leur nature et expédiées avec suivi.",
      },
    },
  ] as const;

  for (const page of pages) {
    await prisma.pageContent.upsert({
      where: { key: page.key },
      create: {
        ...page,
        status: "PUBLISHED",
        publishedAt: new Date(),
      },
      update: {
        title: page.title,
        slug: page.slug,
        content: page.content,
        status: "PUBLISHED",
        publishedAt: new Date(),
      },
    });
  }
}

async function seedOptionalAdmin(): Promise<void> {
  const email = process.env.SEED_ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.SEED_ADMIN_PASSWORD;

  if (!email || !password) {
    process.stdout.write(
      "Compte administrateur ignoré : définir SEED_ADMIN_EMAIL et SEED_ADMIN_PASSWORD pour le créer.\n",
    );
    return;
  }

  if (password.length < 12) {
    throw new Error("SEED_ADMIN_PASSWORD doit contenir au moins 12 caractères.");
  }

  const passwordHash = await hash(password, 12);

  await prisma.user.upsert({
    where: { email },
    create: {
      firstName: process.env.SEED_ADMIN_FIRST_NAME?.trim() || "Administrateur",
      lastName: process.env.SEED_ADMIN_LAST_NAME?.trim() || "Démo",
      email,
      passwordHash,
      role: "ADMIN",
      emailVerified: new Date(),
    },
    update: {
      firstName: process.env.SEED_ADMIN_FIRST_NAME?.trim() || "Administrateur",
      lastName: process.env.SEED_ADMIN_LAST_NAME?.trim() || "Démo",
      passwordHash,
      role: "ADMIN",
      emailVerified: new Date(),
    },
  });

  process.stdout.write(`Compte administrateur prêt : ${email}\n`);
}

async function main(): Promise<void> {
  const { mainCategoryIdBySlug, subcategoryIdByKey } =
    await seedCategories();
  const collectionIdBySlug = await seedCollections(mainCategoryIdBySlug);

  await seedProducts(
    mainCategoryIdBySlug,
    subcategoryIdByKey,
    collectionIdBySlug,
  );
  await seedPromotionAndPages();
  await seedOptionalAdmin();

  process.stdout.write(
    `Données prêtes : ${categories.length} catégories principales, ${collections.length} collections et ${products.length} objets.\n`,
  );
}

main()
  .catch((error: unknown) => {
    console.error("Échec de l'initialisation des données :", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
