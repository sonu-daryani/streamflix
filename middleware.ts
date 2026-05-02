import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { CMS_SESSION_COOKIE, isCmsSessionValid } from "@/lib/cmsAuth";

export async function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  if (!pathname.startsWith("/cms")) return NextResponse.next();
  if (pathname.startsWith("/cms/login")) return NextResponse.next();

  const token = request.cookies.get(CMS_SESSION_COOKIE)?.value;
  if (await isCmsSessionValid(token)) return NextResponse.next();

  const loginUrl = new URL("/cms/login", request.url);
  const nextPath = `${pathname}${search}`;
  loginUrl.searchParams.set("next", nextPath);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ["/cms/:path*"],
};
