import { NextResponse, type NextRequest } from "next/server";

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const pref = request.cookies.get("lang")?.value === "ar" ? "ar" : "en";
  return NextResponse.redirect(new URL(`/${pref}${pathname === "/" ? "" : pathname}${request.nextUrl.search}`, request.url));
}

export const config = {
  // Everything that isn't already localized, a static file or Next internals
  matcher: ["/((?!en|ar|_next|favicon.ico|.*\\..*).*)"],
};
