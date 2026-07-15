export type MainCategorySlug =
  | "ceramique"
  | "revues-auto-moto"
  | "cartes-postales";

export type ProductStatus =
  | "AVAILABLE"
  | "RESERVED"
  | "SOLD"
  | "UNAVAILABLE"
  | "COMING_SOON";

export type ProductCondition =
  | "MINT"
  | "EXCELLENT"
  | "VERY_GOOD"
  | "GOOD"
  | "FAIR"
  | "POOR";

export type ProductRarity =
  | "COMMON"
  | "UNCOMMON"
  | "RARE"
  | "VERY_RARE"
  | "EXCEPTIONAL";

export interface CatalogSubcategory {
  readonly id: string;
  readonly name: string;
  readonly slug: string;
  readonly description: string;
}

export interface CatalogCategory {
  readonly id: string;
  readonly name: string;
  readonly shortName: string;
  readonly slug: MainCategorySlug;
  readonly description: string;
  readonly image: string;
  readonly eyebrow: string;
  readonly subcategories: readonly CatalogSubcategory[];
  readonly periods: readonly string[];
  readonly filters: readonly string[];
}

export interface CatalogCollection {
  readonly id: string;
  readonly name: string;
  readonly slug: string;
  readonly description: string;
  readonly coverImage: string;
  readonly categoryId: string;
  readonly categorySlug: MainCategorySlug;
  readonly subcategory?: string;
  readonly period: string;
  readonly startDate?: string;
  readonly endDate?: string;
  readonly country?: string;
  readonly region?: string;
  readonly artist?: string;
  readonly manufacturer?: string;
  readonly publisher?: string;
  readonly brand?: string;
  readonly theme?: string;
  readonly featured: boolean;
  readonly productIds: readonly string[];
}

export interface ProductImage {
  readonly id: string;
  readonly url: string;
  readonly alt: string;
  readonly position: number;
  readonly isMain: boolean;
}

export interface CatalogProduct {
  readonly id: string;
  readonly name: string;
  readonly slug: string;
  readonly reference: string;
  readonly categoryId: string;
  readonly categorySlug: MainCategorySlug;
  readonly categoryName: string;
  readonly subcategory: string;
  readonly subcategorySlug: string;
  readonly collectionSlugs: readonly string[];
  readonly shortDescription: string;
  readonly description: string;
  /** Prix public en euros, TVA comprise. */
  readonly price: number;
  readonly previousPrice?: number;
  readonly quantity: number;
  readonly status: ProductStatus;
  readonly condition: ProductCondition;
  readonly rarity: ProductRarity;
  readonly exactDate?: string;
  readonly estimatedYear?: number;
  readonly period: string;
  readonly country: string;
  readonly region?: string;
  readonly city?: string;
  readonly manufacturer?: string;
  readonly artist?: string;
  readonly author?: string;
  readonly publisher?: string;
  readonly brand?: string;
  readonly model?: string;
  readonly issueNumber?: string;
  readonly dimensions: string;
  readonly weightGrams?: number;
  readonly material?: string;
  readonly color: string;
  readonly language?: string;
  readonly signature?: boolean;
  readonly numbered?: boolean;
  readonly serialNumber?: string;
  readonly written?: boolean;
  readonly circulated?: boolean;
  readonly stampPresent?: boolean;
  readonly monochrome?: boolean;
  readonly provenance: string;
  readonly history: string;
  readonly defects: string;
  readonly restoration: string;
  readonly conservation: string;
  readonly keywords: readonly string[];
  readonly images: readonly ProductImage[];
  readonly image: string;
  readonly imageAlt: string;
  readonly shippingPrice: number;
  readonly shippingDelayDays: number;
  readonly featured: boolean;
  readonly rareItem: boolean;
  readonly published: boolean;
  readonly newArrival: boolean;
  readonly reservable: boolean;
  readonly offerEnabled: boolean;
  readonly isUnique: boolean;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export type Product = CatalogProduct;
export type Collection = CatalogCollection;
export type Category = CatalogCategory;

export const productStatusLabels: Readonly<Record<ProductStatus, string>> = {
  AVAILABLE: "Disponible",
  RESERVED: "Réservé",
  SOLD: "Vendu",
  UNAVAILABLE: "Indisponible",
  COMING_SOON: "Bientôt disponible",
};

export const productConditionLabels: Readonly<
  Record<ProductCondition, string>
> = {
  MINT: "État neuf",
  EXCELLENT: "Excellent état",
  VERY_GOOD: "Très bon état",
  GOOD: "Bon état",
  FAIR: "État correct",
  POOR: "État d'usage",
};

export const productRarityLabels: Readonly<Record<ProductRarity, string>> = {
  COMMON: "Courant",
  UNCOMMON: "Peu courant",
  RARE: "Rare",
  VERY_RARE: "Très rare",
  EXCEPTIONAL: "Exceptionnel",
};
