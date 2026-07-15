export type CatalogSort =
  | "relevance"
  | "price-asc"
  | "price-desc"
  | "date-asc"
  | "date-desc"
  | "newest"
  | "alphabetical"
  | "rarity";

/**
 * Forme minimale attendue par le moteur de catalogue.
 * `CatalogProduct` satisfait cette interface sans conversion.
 */
export interface CatalogItem {
  readonly id: string;
  readonly name: string;
  readonly reference?: string;
  readonly shortDescription?: string;
  readonly description?: string;
  readonly categorySlug: string;
  readonly categoryName?: string;
  readonly subcategory?: string;
  readonly subcategorySlug?: string;
  readonly collectionSlugs?: readonly string[];
  readonly period?: string;
  readonly exactDate?: string;
  readonly estimatedYear?: number;
  readonly country?: string;
  readonly region?: string;
  readonly city?: string;
  readonly manufacturer?: string;
  readonly artist?: string;
  readonly author?: string;
  readonly publisher?: string;
  readonly brand?: string;
  readonly model?: string;
  readonly issueNumber?: string;
  readonly material?: string;
  readonly color?: string;
  readonly language?: string;
  readonly keywords?: readonly string[];
  readonly price: number;
  readonly quantity?: number;
  readonly status?: string;
  readonly condition?: string;
  readonly rarity?: string;
  readonly written?: boolean;
  readonly circulated?: boolean;
  readonly stampPresent?: boolean;
  readonly monochrome?: boolean;
  readonly signature?: boolean;
  readonly numbered?: boolean;
  readonly published?: boolean;
  readonly createdAt?: string;
}

export interface CatalogFilters {
  readonly query?: string;
  readonly category?: string;
  readonly subcategory?: string;
  readonly collection?: string;
  readonly period?: string;
  readonly country?: string;
  readonly region?: string;
  readonly city?: string;
  readonly brand?: string;
  readonly manufacturer?: string;
  readonly statuses?: readonly string[];
  readonly conditions?: readonly string[];
  readonly rarities?: readonly string[];
  readonly minPrice?: number;
  readonly maxPrice?: number;
  readonly minYear?: number;
  readonly maxYear?: number;
  readonly written?: boolean;
  readonly circulated?: boolean;
  readonly stampPresent?: boolean;
  readonly monochrome?: boolean;
  readonly signature?: boolean;
  readonly numbered?: boolean;
  readonly availableOnly?: boolean;
  readonly publishedOnly?: boolean;
  readonly sort?: CatalogSort;
}

const rarityRank: Readonly<Record<string, number>> = {
  COMMON: 0,
  UNCOMMON: 1,
  RARE: 2,
  VERY_RARE: 3,
  EXCEPTIONAL: 4,
};

export function normalizeSearchTerm(value: string | number): string {
  return String(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("fr-FR")
    .replace(/[’']/g, " ")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function normalizedEquals(actual: string | undefined, expected: string): boolean {
  return actual !== undefined && normalizeSearchTerm(actual) === normalizeSearchTerm(expected);
}

function includesNormalized(values: readonly string[] | undefined, expected: string): boolean {
  return values?.some((value) => normalizedEquals(value, expected)) ?? false;
}

function searchableText(product: CatalogItem): string {
  const values: Array<string | number | undefined> = [
    product.name,
    product.reference,
    product.shortDescription,
    product.description,
    product.categorySlug,
    product.categoryName,
    product.subcategory,
    product.subcategorySlug,
    product.period,
    product.exactDate,
    product.estimatedYear,
    product.country,
    product.region,
    product.city,
    product.manufacturer,
    product.artist,
    product.author,
    product.publisher,
    product.brand,
    product.model,
    product.issueNumber,
    product.material,
    product.color,
    product.language,
    ...(product.collectionSlugs ?? []),
    ...(product.keywords ?? []),
  ];

  return normalizeSearchTerm(
    values.filter((value): value is string | number => value !== undefined).join(" "),
  );
}

function matchesQuery(product: CatalogItem, query: string | undefined): boolean {
  if (!query?.trim()) return true;

  const haystack = searchableText(product);
  const tokens = normalizeSearchTerm(query).split(" ").filter(Boolean);
  return tokens.every((token) => haystack.includes(token));
}

function matchesBoolean(actual: boolean | undefined, expected: boolean | undefined): boolean {
  return expected === undefined || actual === expected;
}

function dateValue(product: CatalogItem): number | undefined {
  if (product.exactDate) {
    const parsed = Date.parse(product.exactDate);
    if (!Number.isNaN(parsed)) return parsed;
  }
  return product.estimatedYear === undefined
    ? undefined
    : Date.UTC(product.estimatedYear, 0, 1);
}

function compareOptionalNumbers(
  left: number | undefined,
  right: number | undefined,
  direction: "asc" | "desc",
): number {
  if (left === undefined && right === undefined) return 0;
  if (left === undefined) return 1;
  if (right === undefined) return -1;
  return direction === "asc" ? left - right : right - left;
}

function sortProducts<T extends CatalogItem>(products: readonly T[], sort: CatalogSort): T[] {
  const indexed = products.map((product, index) => ({ product, index }));

  indexed.sort((left, right) => {
    let comparison = 0;
    switch (sort) {
      case "price-asc":
        comparison = left.product.price - right.product.price;
        break;
      case "price-desc":
        comparison = right.product.price - left.product.price;
        break;
      case "date-asc":
        comparison = compareOptionalNumbers(dateValue(left.product), dateValue(right.product), "asc");
        break;
      case "date-desc":
        comparison = compareOptionalNumbers(dateValue(left.product), dateValue(right.product), "desc");
        break;
      case "newest":
        comparison = compareOptionalNumbers(
          left.product.createdAt ? Date.parse(left.product.createdAt) : undefined,
          right.product.createdAt ? Date.parse(right.product.createdAt) : undefined,
          "desc",
        );
        break;
      case "alphabetical":
        comparison = left.product.name.localeCompare(right.product.name, "fr", {
          sensitivity: "base",
        });
        break;
      case "rarity":
        comparison =
          (rarityRank[right.product.rarity ?? ""] ?? -1) -
          (rarityRank[left.product.rarity ?? ""] ?? -1);
        break;
      case "relevance":
        comparison = 0;
        break;
    }
    return comparison || left.index - right.index;
  });

  return indexed.map(({ product }) => product);
}

/** Filtre et trie sans modifier le tableau d'origine. */
export function searchCatalog<T extends CatalogItem>(
  products: readonly T[],
  filters: CatalogFilters = {},
): T[] {
  const filtered = products.filter((product) => {
    if (!matchesQuery(product, filters.query)) return false;
    if (filters.category && !normalizedEquals(product.categorySlug, filters.category)) return false;
    if (
      filters.subcategory &&
      !normalizedEquals(product.subcategorySlug ?? product.subcategory, filters.subcategory)
    ) return false;
    if (filters.collection && !includesNormalized(product.collectionSlugs, filters.collection)) return false;
    if (filters.period && !normalizedEquals(product.period, filters.period)) return false;
    if (filters.country && !normalizedEquals(product.country, filters.country)) return false;
    if (filters.region && !normalizedEquals(product.region, filters.region)) return false;
    if (filters.city && !normalizedEquals(product.city, filters.city)) return false;
    if (filters.brand && !normalizedEquals(product.brand, filters.brand)) return false;
    if (filters.manufacturer && !normalizedEquals(product.manufacturer, filters.manufacturer)) return false;
    if (filters.statuses?.length && !filters.statuses.includes(product.status ?? "")) return false;
    if (filters.conditions?.length && !filters.conditions.includes(product.condition ?? "")) return false;
    if (filters.rarities?.length && !filters.rarities.includes(product.rarity ?? "")) return false;
    if (filters.minPrice !== undefined && product.price < filters.minPrice) return false;
    if (filters.maxPrice !== undefined && product.price > filters.maxPrice) return false;
    if (filters.minYear !== undefined && (product.estimatedYear ?? -Infinity) < filters.minYear) return false;
    if (filters.maxYear !== undefined && (product.estimatedYear ?? Infinity) > filters.maxYear) return false;
    if (!matchesBoolean(product.written, filters.written)) return false;
    if (!matchesBoolean(product.circulated, filters.circulated)) return false;
    if (!matchesBoolean(product.stampPresent, filters.stampPresent)) return false;
    if (!matchesBoolean(product.monochrome, filters.monochrome)) return false;
    if (!matchesBoolean(product.signature, filters.signature)) return false;
    if (!matchesBoolean(product.numbered, filters.numbered)) return false;
    if (filters.availableOnly && (product.status !== "AVAILABLE" || (product.quantity ?? 0) <= 0)) return false;
    if (filters.publishedOnly && product.published !== true) return false;
    return true;
  });

  return sortProducts(filtered, filters.sort ?? "relevance");
}
