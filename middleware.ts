import { getToken } from "next-auth/jwt";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function middleware(req: NextRequest) {
  const token = await getToken({ req });
  const path = req.nextUrl.pathname;

  const publicPaths = ["/login", "/api"];

  const roleBasedPaths: Record<string, string[]> = {
    "/dashboard": ["ADMIN"],
    "/barcode": ["ADMIN"],
    "/kategori-produk": ["ADMIN"],
    "/laporan": ["ADMIN"],
    "/pelanggan": ["ADMIN"],
    "/penjualan": ["ADMIN"],
    "/produk": ["ADMIN"],
    "/stock-history": ["ADMIN"],
    "/users": ["ADMIN"],
    "/pos": ["ADMIN", "PETUGAS"],
  };

  const isAppRoute =
    path.split("/").length > 1 &&
    !publicPaths.some((publicPath) => path.startsWith(publicPath));

  // Redirect unauthenticated users to login
  if (isAppRoute && !token) {
    return NextResponse.redirect(
      new URL(`/login?callbackUrl=${encodeURIComponent(path)}`, req.url)
    );
  }

  // Redirect authenticated users from login page to their role-specific page
  if (token && path === "/login") {
    const userRole = (token as { role: string }).role;
    const redirectPath = userRole === "ADMIN" ? "/dashboard" : "/pos";
    return NextResponse.redirect(new URL(redirectPath, req.url));
  }

  // Redirect authenticated users from root to their role-specific page
  if (token && path === "/") {
    const userRole = (token as { role: string }).role;
    const redirectPath = userRole === "ADMIN" ? "/dashboard" : "/pos";
    return NextResponse.redirect(new URL(redirectPath, req.url));
  }

  // Check role-based access
  if (token) {
    const matchedPath = Object.keys(roleBasedPaths).find((routePath) =>
      path.startsWith(routePath)
    );

    if (matchedPath) {
      const allowedRoles = roleBasedPaths[matchedPath];
      const userRole = (token as { role: string }).role;

      if (!allowedRoles.includes(userRole)) {
        const redirectPath = userRole === "ADMIN" ? "/dashboard" : "/pos";
        return NextResponse.redirect(new URL(redirectPath, req.url));
      }
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
