import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import type { NextRequest, NextResponse } from "next/server";

export const SESSION_COOKIE_NAME = "linventaire_session";

const SESSION_ISSUER = "linventaire";
const SESSION_AUDIENCE = "linventaire-web";
const DEFAULT_SESSION_MAX_AGE = 60 * 60 * 8;
const MIN_SECRET_LENGTH = 32;
const DEV_SECRET_SYMBOL = Symbol.for("linventaire.dev-session-secret");

export type UserRole = "USER" | "ADMIN";

export type Session = {
  userId: string;
  email: string;
  name: string;
  role: UserRole;
  expiresAt: number;
};

export type SessionUser = Omit<Session, "expiresAt">;

type SessionClaims = {
  email?: unknown;
  name?: unknown;
  role?: unknown;
};

type GlobalWithDevSecret = typeof globalThis & {
  [DEV_SECRET_SYMBOL]?: Uint8Array;
};

function isDemoAuthEnabled() {
  return (
    process.env.NODE_ENV !== "production" &&
    process.env.DEMO_AUTH_ENABLED === "true"
  );
}

function getSessionMaxAge() {
  const configured = Number(process.env.AUTH_SESSION_MAX_AGE_SECONDS);

  if (!Number.isFinite(configured)) return DEFAULT_SESSION_MAX_AGE;

  return Math.min(Math.max(Math.trunc(configured), 5 * 60), 60 * 60 * 24 * 7);
}

function getDevelopmentSecret() {
  const globalStore = globalThis as GlobalWithDevSecret;

  if (!globalStore[DEV_SECRET_SYMBOL]) {
    const secret = new Uint8Array(MIN_SECRET_LENGTH);
    globalThis.crypto.getRandomValues(secret);
    globalStore[DEV_SECRET_SYMBOL] = secret;
  }

  return globalStore[DEV_SECRET_SYMBOL];
}

function getSigningSecret(): Uint8Array | null {
  const configuredSecret = process.env.AUTH_SECRET?.trim();

  if (configuredSecret && configuredSecret.length >= MIN_SECRET_LENGTH) {
    return new TextEncoder().encode(configuredSecret);
  }

  // The fallback is random, process-local, and only available when the demo is
  // explicitly enabled. Restarts invalidate sessions; production always fails closed.
  if (isDemoAuthEnabled()) return getDevelopmentSecret();

  return null;
}

function isRole(value: unknown): value is UserRole {
  return value === "USER" || value === "ADMIN";
}

export function isSessionConfigured() {
  return getSigningSecret() !== null;
}

export async function signSession(user: SessionUser) {
  const secret = getSigningSecret();

  if (!secret) {
    throw new Error(
      "Session signing is not configured. Set AUTH_SECRET to at least 32 characters.",
    );
  }

  return new SignJWT({
    email: user.email,
    name: user.name,
    role: user.role,
  })
    .setProtectedHeader({ alg: "HS256", typ: "JWT" })
    .setSubject(user.userId)
    .setIssuer(SESSION_ISSUER)
    .setAudience(SESSION_AUDIENCE)
    .setIssuedAt()
    .setExpirationTime(`${getSessionMaxAge()}s`)
    .sign(secret);
}

export async function verifySessionToken(token: string | undefined | null) {
  if (!token) return null;

  const secret = getSigningSecret();
  if (!secret) return null;

  try {
    const { payload } = await jwtVerify<SessionClaims>(token, secret, {
      algorithms: ["HS256"],
      issuer: SESSION_ISSUER,
      audience: SESSION_AUDIENCE,
    });

    if (
      typeof payload.sub !== "string" ||
      typeof payload.email !== "string" ||
      typeof payload.name !== "string" ||
      !isRole(payload.role) ||
      typeof payload.exp !== "number"
    ) {
      return null;
    }

    return {
      userId: payload.sub,
      email: payload.email,
      name: payload.name,
      role: payload.role,
      expiresAt: payload.exp,
    } satisfies Session;
  } catch {
    return null;
  }
}

export async function getSession() {
  const cookieStore = await cookies();
  return verifySessionToken(cookieStore.get(SESSION_COOKIE_NAME)?.value);
}

export async function getRequestSession(request: NextRequest) {
  return verifySessionToken(request.cookies.get(SESSION_COOKIE_NAME)?.value);
}

export function hasRole(
  session: Session | null,
  ...allowedRoles: readonly UserRole[]
) {
  return session !== null && allowedRoles.includes(session.role);
}

export async function setSessionCookie(
  response: NextResponse,
  user: SessionUser,
) {
  const token = await signSession(user);

  response.cookies.set({
    name: SESSION_COOKIE_NAME,
    value: token,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: getSessionMaxAge(),
  });
}

export function clearSessionCookie(response: NextResponse) {
  response.cookies.set({
    name: SESSION_COOKIE_NAME,
    value: "",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
}
