import { compare } from "bcryptjs";
import { NextResponse, type NextRequest } from "next/server";
import {
  isSessionConfigured,
  setSessionCookie,
  type SessionUser,
  type UserRole,
} from "@/lib/server/session";
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
import { loginSchema } from "@/lib/server/validation";

type DemoAccount = {
  userId: string;
  email: string;
  name: string;
  passwordHash: string;
  role: UserRole;
};

function demoAuthIsEnabled() {
  return (
    process.env.NODE_ENV !== "production" &&
    process.env.DEMO_AUTH_ENABLED === "true"
  );
}

function configuredDemoAccounts(): DemoAccount[] {
  const candidates = [
    {
      userId: "demo-admin",
      email: process.env.DEMO_ADMIN_EMAIL,
      name: process.env.DEMO_ADMIN_NAME || "Administration démo",
      passwordHash: process.env.DEMO_ADMIN_PASSWORD_HASH,
      role: "ADMIN" as const,
    },
    {
      userId: "demo-user",
      email: process.env.DEMO_USER_EMAIL,
      name: process.env.DEMO_USER_NAME || "Compte démo",
      passwordHash: process.env.DEMO_USER_PASSWORD_HASH,
      role: "USER" as const,
    },
  ];

  return candidates.flatMap((candidate) =>
    candidate.email && candidate.passwordHash
      ? [
          {
            ...candidate,
            email: candidate.email.trim().toLowerCase(),
            passwordHash: candidate.passwordHash.trim(),
          },
        ]
      : [],
  );
}

export async function POST(request: NextRequest) {
  const rateLimit = checkRateLimit(request, {
    keyPrefix: "auth:login",
    limit: 5,
    windowMs: 15 * 60 * 1_000,
  });

  if (!rateLimit.allowed) {
    const response = jsonError(
      429,
      "RATE_LIMITED",
      "Trop de tentatives. Réessayez dans quelques minutes.",
    );
    Object.entries(rateLimitHeaders(rateLimit)).forEach(([name, value]) =>
      response.headers.set(name, value),
    );
    return response;
  }

  if (!isSameOriginRequest(request)) {
    return jsonError(403, "INVALID_ORIGIN", "Origine de la requête refusée.");
  }

  if (!demoAuthIsEnabled()) {
    return jsonError(
      503,
      "AUTH_NOT_CONFIGURED",
      "La connexion sera disponible lorsque le fournisseur d’authentification sera configuré.",
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

  const parsed = loginSchema.safeParse(body.value);
  if (!parsed.success) {
    return jsonError(
      422,
      "VALIDATION_ERROR",
      "Vérifiez les informations saisies.",
      formatValidationError(parsed.error),
    );
  }

  const account = configuredDemoAccounts().find(
    (candidate) => candidate.email === parsed.data.email,
  );

  let passwordMatches = false;
  if (account) {
    try {
      passwordMatches = await compare(parsed.data.password, account.passwordHash);
    } catch {
      passwordMatches = false;
    }
  }

  if (!account || !passwordMatches) {
    return jsonError(
      401,
      "INVALID_CREDENTIALS",
      "Adresse e-mail ou mot de passe incorrect.",
    );
  }

  const user: SessionUser = {
    userId: account.userId,
    email: account.email,
    name: account.name,
    role: account.role,
  };
  const response = NextResponse.json(
    { user: { email: user.email, name: user.name, role: user.role }, mode: "demo" },
    { headers: { "Cache-Control": "no-store" } },
  );

  try {
    await setSessionCookie(response, user);
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
