import { describe, expect, it } from "vitest";

import {
  AdminAuthorizationError,
  assertAdmin,
  authorizeAdmin,
  type AppSession,
} from "@/lib/domain/authorization";

const now = new Date("2026-07-15T12:00:00.000Z");
const adminSession: AppSession = {
  user: { id: "admin-001", email: "admin@example.test", role: "ADMIN" },
  expiresAt: new Date("2026-07-16T12:00:00.000Z"),
};

describe("autorisation de l'administration", () => {
  it("autorise uniquement une session administrateur encore valide", () => {
    expect(authorizeAdmin(adminSession, now)).toEqual({
      allowed: true,
      user: adminSession.user,
    });
    expect(assertAdmin(adminSession, now)).toEqual(adminSession.user);
  });

  it("distingue absence de session, expiration et rôle insuffisant", () => {
    expect(authorizeAdmin(null, now)).toEqual({ allowed: false, reason: "UNAUTHENTICATED" });
    expect(
      authorizeAdmin({ ...adminSession, expiresAt: new Date("2026-07-15T11:59:59.000Z") }, now),
    ).toEqual({ allowed: false, reason: "EXPIRED" });
    expect(
      authorizeAdmin({ ...adminSession, user: { ...adminSession.user, role: "USER" } }, now),
    ).toEqual({ allowed: false, reason: "FORBIDDEN" });
  });

  it("fait échouer explicitement une garde d'administration", () => {
    expect(() => assertAdmin(null, now)).toThrowError(AdminAuthorizationError);
    expect(() =>
      assertAdmin(
        { ...adminSession, user: { ...adminSession.user, role: "USER" } },
        now,
      ),
    ).toThrowError(expect.objectContaining({ reason: "FORBIDDEN" }));
  });
});
