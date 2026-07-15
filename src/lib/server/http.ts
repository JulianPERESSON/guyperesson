import { NextResponse, type NextRequest } from "next/server";
import type { ZodError } from "zod";

const DEFAULT_MAX_BODY_BYTES = 64 * 1024;

type JsonReadResult =
  | { ok: true; value: unknown }
  | { ok: false; response: NextResponse };

export function jsonError(
  status: number,
  code: string,
  message: string,
  details?: unknown,
) {
  return NextResponse.json(
    {
      error: {
        code,
        message,
        ...(details === undefined ? {} : { details }),
      },
    },
    {
      status,
      headers: { "Cache-Control": "no-store" },
    },
  );
}

export async function readJsonBody(
  request: NextRequest,
  maxBytes = DEFAULT_MAX_BODY_BYTES,
): Promise<JsonReadResult> {
  const contentType = request.headers.get("content-type")?.toLowerCase() ?? "";

  if (!contentType.includes("application/json")) {
    return {
      ok: false,
      response: jsonError(
        415,
        "UNSUPPORTED_MEDIA_TYPE",
        "Le corps de la requête doit être au format JSON.",
      ),
    };
  }

  const declaredLength = Number(request.headers.get("content-length"));
  if (Number.isFinite(declaredLength) && declaredLength > maxBytes) {
    return {
      ok: false,
      response: jsonError(413, "PAYLOAD_TOO_LARGE", "La requête est trop volumineuse."),
    };
  }

  const rawBody = await request.text();
  if (new TextEncoder().encode(rawBody).byteLength > maxBytes) {
    return {
      ok: false,
      response: jsonError(413, "PAYLOAD_TOO_LARGE", "La requête est trop volumineuse."),
    };
  }

  try {
    return { ok: true, value: JSON.parse(rawBody) as unknown };
  } catch {
    return {
      ok: false,
      response: jsonError(400, "INVALID_JSON", "Le JSON envoyé est invalide."),
    };
  }
}

export function formatValidationError(error: ZodError) {
  return error.issues.map((issue) => ({
    field: issue.path.join("."),
    message: issue.message,
  }));
}

export function isSameOriginRequest(request: NextRequest) {
  const origin = request.headers.get("origin");

  // SameSite cookies remain the primary protection for non-browser clients.
  // When a browser supplies Origin, it must match this deployment.
  if (!origin) return true;

  const allowedOrigins = new Set([request.nextUrl.origin]);
  const configuredSiteUrl = process.env.NEXT_PUBLIC_SITE_URL;

  if (configuredSiteUrl) {
    try {
      allowedOrigins.add(new URL(configuredSiteUrl).origin);
    } catch {
      // A malformed optional URL must not make the application fail to build.
    }
  }

  try {
    return allowedOrigins.has(new URL(origin).origin);
  } catch {
    return false;
  }
}

export function noStoreJson(body: unknown, init?: ResponseInit) {
  const headers = new Headers(init?.headers);
  headers.set("Cache-Control", "no-store");
  return NextResponse.json(body, { ...init, headers });
}
