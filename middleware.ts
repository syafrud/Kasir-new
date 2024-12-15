import { getToken } from "next-auth/jwt";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function middleware(req: NextRequest) {
  const token = await getToken({ req });
  const path = req.nextUrl.pathname;

  // Daftar route publik (tidak membutuhkan autentikasi)
  const publicPaths = ["/login", "/api"];

  // Daftar route dengan pembatasan role
  const roleBasedPaths: Record<string, string[]> = {
    "/admin": ["ADMIN"], // Hanya bisa diakses oleh role ADMIN
    "/dashboard": ["ADMIN", "PETUGAS"], // Bisa diakses oleh ADMIN dan PETUGAS
  };

  // Apakah path saat ini adalah bagian dari app tetapi bukan publik
  const isAppRoute =
    path.split("/").length > 1 &&
    !publicPaths.some((publicPath) => path.startsWith(publicPath));

  // Jika route membutuhkan autentikasi dan token tidak ada, redirect ke login
  if (isAppRoute && !token) {
    return NextResponse.redirect(
      new URL(`/login?callbackUrl=${encodeURIComponent(path)}`, req.url)
    );
  }

  // Jika user sudah login dan berada di halaman login, redirect ke home
  if (token && path === "/login") {
    return NextResponse.redirect(new URL("/", req.url));
  }

  // Cek pembatasan role untuk path tertentu
  if (token && roleBasedPaths[path]) {
    const allowedRoles = roleBasedPaths[path];
    if (!allowedRoles.includes(token.role)) {
      // Jika role tidak diizinkan, redirect ke halaman error atau home
      return NextResponse.redirect(new URL("/", req.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
