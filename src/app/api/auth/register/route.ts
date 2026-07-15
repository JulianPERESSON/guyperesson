import { NextResponse, type NextRequest } from "next/server";
import {
  formatValidationError,
  isSameOriginRequest,
  jsonError,
  readJsonBody,
} from "@/lib/server/http";
import {
  checkRateLimit,
  rateLimitHeaders,
} from "@/lib/server/rate-limit";
import { isSessionConfigured, setSessionCookie } from "@/lib/server/session";
import { registerSchema } from "@/lib/server/validation";

function demoRegistrationIsEnabled() {
  return (
    process.env.NODE_ENV !== "production" &&
    process.env.DEMO_AUTH_ENABLED === "true" &&
    process.env.DEMO_REGISTRATION_ENABLED === "true"
  );
}

export async function POST(request: NextRequest) {
  const rateLimit = checkRateLimit(request, {
    keyPrefix: "auth:register",
    limit: 3,
    windowMs: 60 * 60 * 1_000,
  });

  if (!rateLimit.allowed) {
    const response = jsonError(
      429,
      "RATE_LIMITED",
      "Trop de créations de compte. Réessayez plus tard.",
    );
    Object.entries(rateLimitHeaders(rateLimit)).forEach(([name, value]) =>
      response.headers.set(name, value),
    );
    return response;
  }

  if (!isSameOriginRequest(request)) {
    return jsonError(403, "INVALID_ORIGIN", "Origine de la requête refusée.");
  }

  if (!demoRegistrationIsEnabled()) {
    return jsonError(
      503,
      "REGISTRATION_NOT_CONFIGURED",
      "La création de compte sera disponible avec la base de données d’authentification.",
    );
  }

  if (!isSessionConfigured()) {
    return jsonError(
      503,
      "SESSION_NOT_CONFIGURED",
      "La signature des sessions n’est pas configurée.",
    );
  }

  const body = await readJsonBody(request);
  if (!body.ok) return body.response;

  const parsed = registerSchema.safeParse(body.value);
  if (!parsed.success) {
    return jsonError(
      422,
      "VALIDATION_ERROR",
      "Vérifiez les informations saisies.",
      formatValidationError(parsed.error),
    );
  }

  const response = NextResponse.json(
    {
      user: {
        email: parsed.data.email,
        name: `${parsed.data.firstName} ${parsed.data.lastName}`,
        role: "USER",
      },
      mode: "demo",
      persisted: false,
    },
    { status: 201, headers: { "Cache-Control": "no-store" } },
  );

  try {
    await setSessionCookie(response, {
      userId: `demo-${globalThis.crypto.randomUUID()}`,
      email: parsed.data.email,
      name: `${parsed.data.firstName} ${parsed.data.lastName}`,
      role: "USER",
    });
  } catch {
    return jsonError(
      503,
      "SESSION_NOT_CONFIGURED",
      "Impossible d’ouvrir une session pour le moment.",
    );
  }

  Object.entries(rateLimitHeaders(rateLimit)).forEach(([name, value]) =>
    response.headers.set(name, value),
  );
  return response;
}
