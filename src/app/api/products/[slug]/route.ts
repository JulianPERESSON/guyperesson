import { type NextRequest } from "next/server";
import { jsonError, noStoreJson } from "@/lib/server/http";
import { getProductBySlug } from "@/lib/server/product-repository";
import { slugifyProductValue } from "@/lib/server/product-validation";

type ProductRouteContext = {
  params: Promise<{ slug: string }>;
};

export async function GET(
  _request: NextRequest,
  { params }: ProductRouteContext,
) {
  const { slug: rawSlug } = await params;
  const slug = slugifyProductValue(rawSlug);
  if (!slug || slug !== rawSlug.toLowerCase()) {
    return jsonError(400, "INVALID_SLUG", "Le slug du produit est invalide.");
  }

  try {
    const product = await getProductBySlug(slug);
    if (!product) {
      return jsonError(404, "PRODUCT_NOT_FOUND", "Ce produit est introuvable.");
    }
    return noStoreJson({ product });
  } catch (error) {
    console.error("Public product detail failed", {
      errorType: error instanceof Error ? error.name : "UnknownError",
    });
    return jsonError(
      500,
      "PRODUCT_STORE_ERROR",
      "Le catalogue est momentanément indisponible.",
    );
  }
}
