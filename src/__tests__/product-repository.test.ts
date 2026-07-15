import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import {
  LocalJsonProductRepository,
  ProductConflictError,
} from "@/lib/server/product-repository";
import { productCreateSchema } from "@/lib/server/product-validation";

describe("dépôt local des annonces", () => {
  let testDirectory: string;
  let storePath: string;

  beforeEach(async () => {
    testDirectory = await mkdtemp(join(tmpdir(), "linventaire-products-"));
    storePath = join(testDirectory, "products.json");
  });

  afterEach(async () => {
    await rm(testDirectory, { force: true, recursive: true });
  });

  it("enregistre une annonce complète et la relit après réouverture", async () => {
    const input = productCreateSchema.parse({
      name: "Vase test du dépôt local",
      slug: "vase-test-depot-local",
      reference: "TEST-LOCAL-001",
      categorySlug: "ceramique",
      subcategory: "Vases",
      shortDescription: "Une annonce créée pour vérifier le stockage local.",
      description:
        "Cette description suffisamment longue permet de valider le parcours complet de création.",
      price: 125,
      quantity: 1,
      status: "AVAILABLE",
      condition: "GOOD",
    });
    const repository = new LocalJsonProductRepository(storePath);

    const created = await repository.create(input);
    const reopenedRepository = new LocalJsonProductRepository(storePath);
    const persistedProducts = await reopenedRepository.list();
    const storedFile = JSON.parse(await readFile(storePath, "utf8")) as {
      version: number;
    };

    expect(created).toMatchObject({
      slug: "vase-test-depot-local",
      reference: "TEST-LOCAL-001",
      categoryName: "Céramique",
      published: true,
    });
    expect(persistedProducts).toHaveLength(1);
    expect(persistedProducts[0]).toEqual(created);
    expect(storedFile.version).toBe(1);
  });

  it("refuse un doublon de slug et de référence sans écraser le fichier", async () => {
    const input = productCreateSchema.parse({
      name: "Revue test du dépôt local",
      slug: "revue-test-depot-local",
      reference: "TEST-LOCAL-002",
      categorySlug: "revues-auto-moto",
      subcategory: "Revues automobiles",
      shortDescription: "Une annonce de revue utilisée pour tester les doublons.",
      description:
        "Cette description suffisamment longue permet de vérifier la détection des conflits.",
      price: 32,
      quantity: 1,
      status: "AVAILABLE",
      condition: "VERY_GOOD",
    });
    const repository = new LocalJsonProductRepository(storePath);

    await repository.create(input);

    await expect(repository.create(input)).rejects.toBeInstanceOf(
      ProductConflictError,
    );
    await expect(repository.list()).resolves.toHaveLength(1);
  });
});
