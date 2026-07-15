import type { NextRequest } from "next/server";
import { jsonError } from "@/lib/server/http";
import { getRequestSession, hasRole, type Session } from "@/lib/server/session";

type AdminAuthorization =
  | { authorized: true; session: Session }
  | { authorized: false; response: ReturnType<typeof jsonError> };

export async function authorizeAdmin(
  request: NextRequest,
): Promise<AdminAuthorization> {
  const session = await getRequestSession(request);

  if (!session) {
    return {
      authorized: false,
      response: jsonError(401, "UNAUTHENTICATED", "Vous devez vous connecter."),
    };
  }

  if (!hasRole(session, "ADMIN")) {
    return {
      authorized: false,
      response: jsonError(403, "FORBIDDEN", "Accès réservé à l’administration."),
    };
  }

  return { authorized: true, session };
}
