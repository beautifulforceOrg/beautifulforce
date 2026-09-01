import { NextResponse, type NextRequest } from "next/server";

// UX-only fast redirect -- the real security boundary is requireAdmin()/
// requireAdminOrThrow() (lib/admin/auth.ts), called explicitly at the top
// of every admin page/action, which does the actual HMAC verification.
// This just avoids a round trip to a guarded page for the common case of
// no cookie at all; it never trusts the cookie's *contents*.
export function middleware(request: NextRequest) {
  // /admin/enter's whole job is to mint bm_admin_session for the first
  // time (from an already-logged-in customer session) -- it must run
  // even with no admin cookie yet, same as /admin/login.
  if (request.nextUrl.pathname === "/admin/login" || request.nextUrl.pathname === "/admin/enter") {
    return NextResponse.next();
  }

  const hasAdminCookie = request.cookies.has("bm_admin_session");
  if (!hasAdminCookie) {
    return NextResponse.redirect(new URL("/admin/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};
