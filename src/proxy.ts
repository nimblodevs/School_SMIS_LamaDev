import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import {
  allowedRolesForPath,
  homePathForRole,
  isUserRole,
} from "@/lib/routeAccess";

const publicPaths = ["/", "/sign-in", "/sign-up"];

function matchesPath(pathname: string, path: string) {
  return pathname === path || pathname.startsWith(`${path}/`);
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  });
  const role = isUserRole(token?.role) ? token.role : null;

  const isPublicPath = publicPaths.some((path) => matchesPath(pathname, path));
  const allowedRoles = allowedRolesForPath(pathname);

  if (token && role && isPublicPath) {
    return NextResponse.redirect(new URL(homePathForRole(role), request.url));
  }

  if (allowedRoles && (!token || !role)) {
    return NextResponse.redirect(new URL("/sign-in", request.url));
  }

  if (allowedRoles && role && !allowedRoles.includes(role)) {
    return NextResponse.redirect(new URL(homePathForRole(role), request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!api/auth|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
