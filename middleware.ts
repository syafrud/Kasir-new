import { getToken } from "next-auth/jwt";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function middleware(req: NextRequest) {
  const token = await getToken({ req });
  const path = req.nextUrl.pathname;

  const publicPaths = ["/login", "/api"];

  // Check if the path is inside the app directory but not in public paths
  const isAppRoute =
    path.split("/").length > 1 &&
    !publicPaths.some((publicPath) => path.startsWith(publicPath));

  // If it's an app route and no token exists, redirect to login
  if (isAppRoute && !token) {
    return NextResponse.redirect(
      new URL(`/login?callbackUrl=${encodeURIComponent(path)}`, req.url)
    );
  }

  // If user is on login/register and already authenticated, redirect to home
  if (token && path === "/login") {
    return NextResponse.redirect(new URL("/", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
