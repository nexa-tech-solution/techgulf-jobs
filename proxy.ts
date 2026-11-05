import { NextResponse, type NextRequest } from "next/server";

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const pref = request.cookies.get("lang")?.value === "ar" ? "ar" : "en";
  const target = new URL(`/${pref}${pathname === "/" ? "" : pathname}${request.nextUrl.search}`, request.url);
  // "/" stays temporary. Other paths are permanent for search engines, but must not be cached
  // by browsers, because the target depends on the visitor's language cookie.
  if (pathname === "/") return NextResponse.redirect(target, 307);
  return NextResponse.redirect(target, { status: 308, headers: { "Cache-Control": "no-store" } });
}

export const config = {
  // Everything that isn't already localized, a static file or Next internals
  matcher: ["/((?!en|ar|_next|favicon.ico|.*\\..*).*)"],
};
