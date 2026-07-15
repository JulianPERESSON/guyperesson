import { z } from "zod";
import { type NextRequest } from "next/server";
import { jsonError, noStoreJson } from "@/lib/server/http";
import { listPublishedProducts } from "@/lib/server/product-repository";

const querySchema = z.object({
  categorySlug: z
    .enum(["ceramique", "revues-auto-moto", "cartes-postales"])
    .optional(),
  status: z
    .enum(["AVAILABLE", "RESERVED", "SOLD", "UNAVAILABLE", "COMING_SOON"])
    .optional(),
  q: z.string().trim().max(120).optional(),
  limit: z.coerce.number().int().min(1).max(200).default(200),
});

function normalizeSearchValue(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("fr-FR");
}

export async function GET(request: NextRequest) {
  const parsedQuery = querySchema.safeParse({
    categorySlug: request.nextUrl.searchParams.get("categorySlug") || undefined,
    status: request.nextUrl.searchParams.get("status") || undefined,
    q: request.nextUrl.searchParams.get("q") || undefined,
    limit: request.nextUrl.searchParams.get("limit") || undefined,
  });
  if (!parsedQuery.success) {
    return jsonError(
      400,
      "INVALID_QUERY",
      "Les filtres du catalogue sont invalides.",
      parsedQuery.error.issues.map((issue) => ({
        field: issue.path.join("."),
        message: issue.message,
      })),
    );
  }

  try {
    let products = await listPublishedProducts();
    const { categorySlug, status, q, limit } = parsedQuery.data;
    if (categorySlug) {
      products = products.filter((product) => product.categorySlug === categorySlug);
    }
    if (status) {
      products = products.filter((product) => product.status === status);
    }
    if (q) {
      const search = normalizeSearchValue(q);
      products = products.filter((product) =>
        normalizeSearchValue(
          [
            product.name,
            product.reference,
            product.shortDescription,
            product.subcategory,
            product.city,
            product.country,
          ]
            .filter(Boolean)
            .join(" "),
        ).includes(search),
      );
    }

    const total = products.length;
    const limitedProducts = products.slice(0, limit);
    return noStoreJson({
      products: limitedProducts,
      count: limitedProducts.length,
      total,
    });
  } catch (error) {
    console.error("Public product listing failed", {
      errorType: error instanceof Error ? error.name : "UnknownError",
    });
    return jsonError(
      500,
      "PRODUCT_STORE_ERROR",
      "Le catalogue est momentanément indisponible.",
    );
  }
}
