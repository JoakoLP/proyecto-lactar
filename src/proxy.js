import { NextResponse } from "next/server";
import { canAccessApi, canAccessRoute } from "@/utils/permissions";
import { SESSION_COOKIE_NAME, verifySessionToken } from "@/utils/session";

const PUBLIC_PATHS = ["/login"];
const PUBLIC_API_PREFIXES = ["/api/auth", "/api/health"];

function isPublicApi(pathname) {
  return PUBLIC_API_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );
}

export async function proxy(request) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith("/_next/") || pathname === "/favicon.ico") {
    return NextResponse.next();
  }

  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  const session = await verifySessionToken(token);

  // Protección centralizada para todos los endpoints /api/* (salvo auth y health)
  if (pathname.startsWith("/api/")) {
    if (isPublicApi(pathname)) {
      return NextResponse.next();
    }

    if (!session) {
      return NextResponse.json(
        {
          success: false,
          error: "Debés iniciar sesión para acceder a este recurso.",
          details: null,
        },
        { status: 401 }
      );
    }

    if (!canAccessApi(session.rol, pathname)) {
      return NextResponse.json(
        {
          success: false,
          error: "No tenés permisos suficientes para acceder a este recurso.",
          details: null,
        },
        { status: 403 }
      );
    }

    return NextResponse.next();
  }

  const isPublic = PUBLIC_PATHS.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`)
  );

  if (!session) {
    if (isPublic) {
      return NextResponse.next();
    }
    const loginUrl = new URL("/login", request.url);
    if (pathname !== "/") {
      loginUrl.searchParams.set("redirect", pathname);
    }
    return NextResponse.redirect(loginUrl);
  }

  if (isPublic) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  if (!canAccessRoute(session.rol, pathname)) {
    const homeUrl = new URL("/", request.url);
    homeUrl.searchParams.set("acceso", "denegado");
    return NextResponse.redirect(homeUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
