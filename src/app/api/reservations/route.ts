import { type NextRequest } from "next/server";
import { demoProducts } from "@/data/products";
import {
  formatValidationError,
  isSameOriginRequest,
  jsonError,
  noStoreJson,
  readJsonBody,
} from "@/lib/server/http";
import {
  checkRateLimit,
  rateLimitHeaders,
} from "@/lib/server/rate-limit";
import { reservationSchema } from "@/lib/server/validation";

export async function POST(request: NextRequest) {
  const rateLimit = checkRateLimit(request, {
    keyPrefix: "reservations",
    limit: 5,
    windowMs: 10 * 60 * 1_000,
  });

  if (!rateLimit.allowed) {
    const response = jsonError(
      429,
      "RATE_LIMITED",
      "Trop de demandes ont été envoyées. Réessayez dans quelques minutes.",
    );
    Object.entries(rateLimitHeaders(rateLimit)).forEach(([name, value]) =>
      response.headers.set(name, value),
    );
    return response;
  }

  if (!isSameOriginRequest(request)) {
    return jsonError(403, "INVALID_ORIGIN", "Origine de la requête refusée.");
  }

  const body = await readJsonBody(request);
  if (!body.ok) return body.response;

  if (
    typeof body.value === "object" &&
    body.value !== null &&
    "website" in body.value &&
    body.value.website
  ) {
    return noStoreJson(
      { success: true, requestId: globalThis.crypto.randomUUID() },
      { status: 202 },
    );
  }

  const parsed = reservationSchema.safeParse(body.value);
  if (!parsed.success) {
    return jsonError(
      422,
      "VALIDATION_ERROR",
      "Vérifiez les informations saisies.",
      formatValidationError(parsed.error),
    );
  }

  const product = demoProducts.find(
    (candidate) => candidate.id === parsed.data.productId,
  );
  if (!product || product.reference !== parsed.data.reference) {
    return jsonError(404, "PRODUCT_NOT_FOUND", "Cet objet est introuvable.");
  }
  if (
    !product.reservable ||
    !product.published ||
    product.status !== "AVAILABLE" ||
    product.quantity < 1
  ) {
    return jsonError(
      409,
      "PRODUCT_NOT_RESERVABLE",
      "Cet objet ne peut pas être réservé actuellement.",
    );
  }

  // The database implementation must atomically re-check product availability
  // before changing its status. This demo acknowledgement does not reserve stock.
  const response = noStoreJson(
    {
      success: true,
      reservationId: globalThis.crypto.randomUUID(),
      status: "PENDING",
      productId: parsed.data.productId,
      stockHeld: false,
      mode: "demo",
    },
    { status: 202 },
  );
  Object.entries(rateLimitHeaders(rateLimit)).forEach(([name, value]) =>
    response.headers.set(name, value),
  );
  return response;
}
