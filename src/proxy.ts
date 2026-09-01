import { NextResponse, type NextRequest } from "next/server";
import { createSupabaseMiddlewareClient } from "@/lib/supabase/middleware-client";
import { canAccessArea, getAdminAreaForPath, getDefaultAdminPath, isAdminRole } from "@/utils/adminAccess";

export async function proxy(request: NextRequest) {
  const { supabase, response } = createSupabaseMiddlewareClient(request);

  const internalRoutes = ["/borrow"];
  const adminRoutes = ["/admin"];
  const authOnlyRoutes = ["/auth/reset-password"];

  const pathname = request.nextUrl.pathname;
  const isAuthOnlyRoute = authOnlyRoutes.some((route) => pathname.startsWith(route));
  const isInternalRoute = internalRoutes.some((route) => pathname.startsWith(route));
  const isAdminRoute = adminRoutes.some((route) => pathname.startsWith(route));

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  if (error) {
    response.cookies.delete("sb-plzkphbuwfokfcopwlxv-auth-token");
  }

  let userRole = user?.app_metadata?.role as string | undefined;

  if (user) {
    const { data: userRow } = await supabase
      .from("Users")
      .select("role")
      .eq("id", user.id)
      .maybeSingle();

    if (userRow?.role) {
      userRole = userRow.role;
    }
  }

  if (!user && isAuthOnlyRoute) {
    return NextResponse.rewrite(new URL("/404", request.url));
  }

  if (!user && (isInternalRoute || isAuthOnlyRoute || isAdminRoute)) {
    return NextResponse.redirect(new URL("/auth/login", request.url));
  }

  if (user && isAdminRoute) {
    if (!isAdminRole(userRole)) {
      return NextResponse.rewrite(new URL("/404", request.url));
    }

    const area = getAdminAreaForPath(pathname);
    if (!canAccessArea(userRole, area)) {
      // Bare "/admin" specifically is a common landing spot after login; send
      // roles that can't see the dashboard to whatever they *can* see instead
      // of a dead-end 404. Any other disallowed area still 404s.
      if (pathname === "/admin") {
        return NextResponse.redirect(new URL(getDefaultAdminPath(userRole), request.url));
      }
      return NextResponse.rewrite(new URL("/404", request.url));
    }
  }

  const authEntryPaths = ["/auth", "/auth/login", "/auth/register"];
  if (user && authEntryPaths.includes(pathname)) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return response;
}

export const config = {
  matcher: [
    "/admin",
    "/admin/:path*",
    "/borrow/:path*",
    "/auth/reset-password/:path*",
    "/auth",
    "/auth/login",
    "/auth/register",
    "/",
  ],
};
