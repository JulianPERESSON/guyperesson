import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { NextRequest } from "next/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  GET as getAdminProducts,
  POST as createAdminProduct,
} from "@/app/api/admin/products/route";
import { GET as getPublicProducts } from "@/app/api/products/route";
import { GET as getPublicProduct } from "@/app/api/products/[slug]/route";
import {
  SESSION_COOKIE_NAME,
  signSession,
} from "@/lib/server/session";

const origin = "http://localhost:3000";
let temporaryDirectory = "";
let adminCookie = "";

const validProduct = {
  name: "Vase d’essai de l’atelier",
  reference: "TEST-API-001",
  categorySlug: "ceramique",
  subcategory: "Vases",
  shortDescription: "Une pièce de démonstration créée par l’API.",
  description:
    "Cette description documente précisément la pièce utilisée pour vérifier la création d’une annonce.",
  price: 125,
  quantity: 1,
  status: "AVAILABLE",
  condition: "GOOD",
  published: true,
} as const;

function productRequest(body: unknown, cookie = adminCookie) {
  return new NextRequest(`${origin}/api/admin/products`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Origin: origin,
      ...(cookie ? { Cookie: cookie } : {}),
    },
    body: JSON.stringify(body),
  });
}

describe.sequential("API d’administration des produits", () => {
  beforeEach(async () => {
    temporaryDirectory = await mkdtemp(path.join(tmpdir(), "linventaire-products-"));
    vi.stubEnv(
      "AUTH_SECRET",
      `test-only-${"session-signing-material-".repeat(2)}`,
    );
    vi.stubEnv("DEMO_PRODUCT_STORE_ENABLED", "true");
    vi.stubEnv(
      "DEMO_PRODUCT_STORE_PATH",
      path.join(temporaryDirectory, "products.json"),
    );

    const token = await signSession({
      userId: "admin-test",
      email: "admin@example.test",
      name: "Administration test",
      role: "ADMIN",
    });
    adminCookie = `${SESSION_COOKIE_NAME}=${token}`;
  });

  afterEach(async () => {
    vi.unstubAllEnvs();
    await rm(temporaryDirectory, { recursive: true, force: true });
  });

  it("refuse une création sans session administrateur", async () => {
    const response = await createAdminProduct(productRequest(validProduct, ""));
    const body = await response.json();

    expect(response.status).toBe(401);
    expect(body.error.code).toBe("UNAUTHENTICATED");
  });

  it("retourne des erreurs Zod structurées", async () => {
    const response = await createAdminProduct(
      productRequest({ ...validProduct, price: -1, quantity: 2 }),
    );
    const body = await response.json();

    expect(response.status).toBe(422);
    expect(body.error.code).toBe("VALIDATION_ERROR");
    expect(body.error.details).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ field: "price" }),
        expect.objectContaining({ field: "quantity" }),
      ]),
    );
  });

  it("persiste une annonce et la rend disponible dans les API de lecture", async () => {
    const createResponse = await createAdminProduct(productRequest(validProduct));
    const createdBody = await createResponse.json();

    expect(createResponse.status).toBe(201);
    expect(createdBody.meta).toEqual({ persisted: true, storage: "local-demo" });
    expect(createdBody.product).toMatchObject({
      name: validProduct.name,
      reference: validProduct.reference,
      slug: "vase-d-essai-de-l-atelier",
      published: true,
    });

    const storedFile = JSON.parse(
      await readFile(path.join(temporaryDirectory, "products.json"), "utf8"),
    ) as { products: Array<{ reference: string }> };
    expect(storedFile.products).toEqual([
      expect.objectContaining({ reference: validProduct.reference }),
    ]);

    const adminResponse = await getAdminProducts(
      new NextRequest(`${origin}/api/admin/products`, {
        headers: { Cookie: adminCookie },
      }),
    );
    const adminBody = await adminResponse.json();
    expect(adminResponse.status).toBe(200);
    expect(adminBody.products).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ reference: validProduct.reference }),
      ]),
    );

    const publicResponse = await getPublicProducts(
      new NextRequest(`${origin}/api/products?q=atelier`),
    );
    const publicBody = await publicResponse.json();
    expect(publicResponse.status).toBe(200);
    expect(publicBody.products).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ reference: validProduct.reference }),
      ]),
    );

    const detailResponse = await getPublicProduct(
      new NextRequest(
        `${origin}/api/products/${createdBody.product.slug as string}`,
      ),
      { params: Promise.resolve({ slug: createdBody.product.slug as string }) },
    );
    const detailBody = await detailResponse.json();
    expect(detailResponse.status).toBe(200);
    expect(detailBody.product.reference).toBe(validProduct.reference);
  });

  it("refuse une référence ou un slug déjà utilisé", async () => {
    expect((await createAdminProduct(productRequest(validProduct))).status).toBe(201);

    const duplicateResponse = await createAdminProduct(
      productRequest({ ...validProduct, name: "Autre nom" }),
    );
    const duplicateBody = await duplicateResponse.json();

    expect(duplicateResponse.status).toBe(409);
    expect(duplicateBody.error.code).toBe("PRODUCT_CONFLICT");
    expect(duplicateBody.error.details.fields).toContain("reference");
  });
});
