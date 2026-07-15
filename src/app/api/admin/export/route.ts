import { type NextRequest } from "next/server";
import { demoProducts } from "@/data/products";
import { authorizeAdmin } from "@/lib/server/admin";
import { serializeCsv } from "@/lib/server/csv";

const HEADERS = [
  "id",
  "name",
  "slug",
  "reference",
  "categorySlug",
  "subcategory",
  "collectionSlugs",
  "price",
  "previousPrice",
  "quantity",
  "status",
  "condition",
  "rarity",
  "period",
  "estimatedYear",
  "country",
  "region",
  "city",
  "manufacturer",
  "artist",
  "publisher",
  "brand",
  "model",
  "issueNumber",
  "shippingPrice",
  "shippingDelayDays",
  "published",
  "featured",
  "rareItem",
] as const;

export async function GET(request: NextRequest) {
  const authorization = await authorizeAdmin(request);
  if (!authorization.authorized) return authorization.response;

  const rows = demoProducts.map((product) => [
    product.id,
    product.name,
    product.slug,
    product.reference,
    product.categorySlug,
    product.subcategory,
    product.collectionSlugs.join("|"),
    product.price.toFixed(2),
    product.previousPrice?.toFixed(2) ?? "",
    product.quantity,
    product.status,
    product.condition,
    product.rarity,
    product.period,
    product.estimatedYear ?? "",
    product.country,
    product.region ?? "",
    product.city ?? "",
    product.manufacturer ?? "",
    product.artist ?? "",
    product.publisher ?? "",
    product.brand ?? "",
    product.model ?? "",
    product.issueNumber ?? "",
    product.shippingPrice.toFixed(2),
    product.shippingDelayDays,
    product.published,
    product.featured,
    product.rareItem,
  ]);
  const csv = `\uFEFF${serializeCsv(HEADERS, rows)}`;
  const date = new Date().toISOString().slice(0, 10);

  return new Response(csv, {
    headers: {
      "Cache-Control": "private, no-store",
      "Content-Disposition": `attachment; filename="produits-${date}.csv"`,
      "Content-Type": "text/csv; charset=utf-8",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
