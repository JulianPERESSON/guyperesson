import { describe, expect, it } from "vitest";

import {
  normalizeSearchTerm,
  searchCatalog,
  type CatalogItem,
} from "@/lib/domain/catalog";

const products = [
  {
    id: "cpa-lyon",
    name: "Lyon — Gare des Brotteaux",
    reference: "CPA-LYO-1908",
    description: "Carte postale ancienne représentant la gare.",
    categorySlug: "cartes-postales",
    categoryName: "Cartes postales",
    subcategory: "Gares",
    subcategorySlug: "gares",
    collectionSlugs: ["cartes-ferroviaires"],
    period: "1900 à 1914",
    estimatedYear: 1908,
    country: "France",
    region: "Auvergne-Rhône-Alpes",
    city: "Lyon",
    publisher: "Éditions Lumière",
    keywords: ["train", "architecture"],
    price: 18,
    quantity: 1,
    status: "AVAILABLE",
    condition: "VERY_GOOD",
    rarity: "RARE",
    written: false,
    circulated: false,
    stampPresent: false,
    monochrome: true,
    published: true,
    createdAt: "2026-07-10T10:00:00.000Z",
  },
  {
    id: "cpa-marseille",
    name: "Marseille — Le Vieux-Port",
    reference: "CPA-MRS-1912",
    description: "Vue animée du port de Marseille.",
    categorySlug: "cartes-postales",
    subcategory: "Villes",
    subcategorySlug: "villes",
    collectionSlugs: ["cartes-postales-anciennes-marseille"],
    period: "1900 à 1914",
    estimatedYear: 1912,
    country: "France",
    city: "Marseille",
    price: 32,
    quantity: 0,
    status: "SOLD",
    condition: "GOOD",
    rarity: "UNCOMMON",
    written: true,
    circulated: true,
    stampPresent: true,
    monochrome: true,
    published: true,
    createdAt: "2026-06-01T10:00:00.000Z",
  },
  {
    id: "cer-vallauris",
    name: "Vase signé de Vallauris",
    reference: "CER-VAL-1956",
    shortDescription: "Grès émaillé bleu nuit.",
    categorySlug: "ceramique",
    categoryName: "Céramique",
    subcategory: "Vases",
    subcategorySlug: "vases",
    collectionSlugs: ["ceramiques-vallauris-annees-1950"],
    period: "1940 à 1960",
    estimatedYear: 1956,
    country: "France",
    city: "Vallauris",
    manufacturer: "Atelier des Cyclades",
    material: "Grès",
    color: "Bleu",
    price: 145,
    quantity: 1,
    status: "AVAILABLE",
    condition: "EXCELLENT",
    rarity: "VERY_RARE",
    signature: true,
    published: true,
    createdAt: "2026-07-12T10:00:00.000Z",
  },
  {
    id: "rev-citroen",
    name: "L'Automobile — essai Citroën DS",
    reference: "REV-AUTO-1968-42",
    description: "Essai routier et dossier technique Citroën.",
    categorySlug: "revues-auto-moto",
    categoryName: "Revues auto et moto",
    subcategory: "Essais automobiles",
    subcategorySlug: "essais-automobiles",
    collectionSlugs: ["revues-automobiles-citroen"],
    period: "Années 1960",
    estimatedYear: 1968,
    country: "France",
    brand: "Citroën",
    model: "DS",
    publisher: "Presse technique",
    issueNumber: "42",
    language: "Français",
    price: 24,
    quantity: 1,
    status: "RESERVED",
    condition: "GOOD",
    rarity: "UNCOMMON",
    published: true,
    createdAt: "2026-07-03T10:00:00.000Z",
  },
] satisfies readonly CatalogItem[];

describe("moteur de catalogue", () => {
  it("normalise les accents, apostrophes et signes de ponctuation", () => {
    expect(normalizeSearchTerm("  L’Automobile — CITROËN  ")).toBe("l automobile citroen");
  });

  it("recherche sur les champs métier avec tous les termes", () => {
    expect(searchCatalog(products, { query: "citroen 1968" }).map(({ id }) => id)).toEqual([
      "rev-citroen",
    ]);
    expect(searchCatalog(products, { query: "ceramique grès vallauris" }).map(({ id }) => id)).toEqual([
      "cer-vallauris",
    ]);
  });

  it("combine catégorie, période, géographie, attributs et plage de prix", () => {
    const result = searchCatalog(products, {
      category: "cartes-postales",
      period: "1900 a 1914",
      city: "lyon",
      minPrice: 5,
      maxPrice: 30,
      written: false,
      circulated: false,
      monochrome: true,
      availableOnly: true,
    });

    expect(result.map(({ id }) => id)).toEqual(["cpa-lyon"]);
  });

  it("filtre une collection et trie sans modifier la source", () => {
    const originalIds = products.map(({ id }) => id);
    const result = searchCatalog(products, {
      category: "cartes-postales",
      sort: "price-desc",
    });

    expect(result.map(({ id }) => id)).toEqual(["cpa-marseille", "cpa-lyon"]);
    expect(products.map(({ id }) => id)).toEqual(originalIds);
    expect(searchCatalog(products, { collection: "cartes-ferroviaires" })[0]?.id).toBe("cpa-lyon");
  });
});
