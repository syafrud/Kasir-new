import { getToken } from "next-auth/jwt";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function middleware(req: NextRequest) {
  const token = await getToken({ req });
  const path = req.nextUrl.pathname;

  const publicPaths = ["/login", "/api"];

  const roleBasedPaths: Record<string, string[]> = {
    "/admin": ["ADMIN"],
    "/dashboard": ["ADMIN", "PETUGAS"],
  };

  const isAppRoute =
    path.split("/").length > 1 &&
    !publicPaths.some((publicPath) => path.startsWith(publicPath));

  if (isAppRoute && !token) {
    return NextResponse.redirect(
      new URL(`/login?callbackUrl=${encodeURIComponent(path)}`, req.url)
    );
  }

  if (token && path === "/login") {
    return NextResponse.redirect(new URL("/", req.url));
  }

  if (token && roleBasedPaths[path]) {
    const allowedRoles = roleBasedPaths[path];
    const userRole = (token as { role: string }).role; // Type assertion
    if (!allowedRoles.includes(userRole)) {
      return NextResponse.redirect(new URL("/", req.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
