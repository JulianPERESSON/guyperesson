import { type NextRequest } from "next/server";
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
import { contactSchema } from "@/lib/server/validation";

export async function POST(request: NextRequest) {
  const rateLimit = checkRateLimit(request, {
    keyPrefix: "contact",
    limit: 5,
    windowMs: 10 * 60 * 1_000,
  });

  if (!rateLimit.allowed) {
    const response = jsonError(
      429,
      "RATE_LIMITED",
      "Trop de messages ont été envoyés. Réessayez dans quelques minutes.",
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

  const parsed = contactSchema.safeParse(body.value);
  if (!parsed.success) {
    return jsonError(
      422,
      "VALIDATION_ERROR",
      "Vérifiez les informations saisies.",
      formatValidationError(parsed.error),
    );
  }

  // Persistence/email delivery plugs in here; the public response intentionally
  // contains no submitted personal data.
  const response = noStoreJson(
    {
      success: true,
      requestId: globalThis.crypto.randomUUID(),
      status: "RECEIVED",
      mode: "demo",
    },
    { status: 202 },
  );
  Object.entries(rateLimitHeaders(rateLimit)).forEach(([name, value]) =>
    response.headers.set(name, value),
  );
  return response;
}
