export type UserRole = "USER" | "ADMIN";

export interface SessionUser {
  readonly id: string;
  readonly email: string;
  readonly role: UserRole;
}

export interface AppSession {
  readonly user: SessionUser;
  readonly expiresAt: Date;
}

export type AdminAuthorization =
  | { readonly allowed: true; readonly user: SessionUser }
  | {
      readonly allowed: false;
      readonly reason: "UNAUTHENTICATED" | "EXPIRED" | "FORBIDDEN";
    };

export class AdminAuthorizationError extends Error {
  override readonly name = "AdminAuthorizationError";

  constructor(readonly reason: "UNAUTHENTICATED" | "EXPIRED" | "FORBIDDEN") {
    super(
      reason === "FORBIDDEN"
        ? "Ce compte ne dispose pas des droits d'administration."
        : "Une authentification administrateur valide est requise.",
    );
  }
}

export function authorizeAdmin(
  session: AppSession | null | undefined,
  now: Date = new Date(),
): AdminAuthorization {
  if (!session) return { allowed: false, reason: "UNAUTHENTICATED" };
  if (!Number.isFinite(session.expiresAt.getTime()) || session.expiresAt.getTime() <= now.getTime()) {
    return { allowed: false, reason: "EXPIRED" };
  }
  if (session.user.role !== "ADMIN") return { allowed: false, reason: "FORBIDDEN" };
  return { allowed: true, user: session.user };
}

export function assertAdmin(
  session: AppSession | null | undefined,
  now: Date = new Date(),
): SessionUser {
  const authorization = authorizeAdmin(session, now);
  if (!authorization.allowed) throw new AdminAuthorizationError(authorization.reason);
  return authorization.user;
}
