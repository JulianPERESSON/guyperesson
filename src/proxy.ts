import { NextResponse, type NextRequest } from "next/server";
import {
  hasRole,
  SESSION_COOKIE_NAME,
  verifySessionToken,
} from "@/lib/server/session";

export async function proxy(request: NextRequest) {
  const session = await verifySessionToken(
    request.cookies.get(SESSION_COOKIE_NAME)?.value,
  );

  if (hasRole(session, "ADMIN")) return NextResponse.next();

  if (request.nextUrl.pathname.startsWith("/api/admin")) {
    return NextResponse.json(
      {
        error: {
          code: session ? "FORBIDDEN" : "UNAUTHENTICATED",
          message: session
            ? "Accès réservé à l’administration."
            : "Vous devez vous connecter.",
        },
      },
      {
        status: session ? 403 : 401,
        headers: { "Cache-Control": "no-store" },
      },
    );
  }

  const loginUrl = new URL("/connexion", request.url);
  loginUrl.searchParams.set(
    "callbackUrl",
    `${request.nextUrl.pathname}${request.nextUrl.search}`,
  );
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*"],
};
