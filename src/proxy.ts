import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const publicPaths = ["/", "/sign-in", "/sign-up", "/api/auth"];
const protectedPrefixes = ["/admin", "/teacher", "/student", "/parent"];

function matchesPath(pathname: string, path: string) {
  return pathname === path || pathname.startsWith(`${path}/`);
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const sessionToken =
    request.cookies.get("next-auth.session-token") ||
    request.cookies.get("__Secure-next-auth.session-token");

  const isPublicPath = publicPaths.some((path) => matchesPath(pathname, path));

  if (sessionToken && isPublicPath) {
    return NextResponse.redirect(new URL("/admin", request.url));
  }

  const isProtectedPath = protectedPrefixes.some((path) =>
    matchesPath(pathname, path)
  );

  if (!sessionToken && isProtectedPath) {
    return NextResponse.redirect(new URL("/sign-in", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
