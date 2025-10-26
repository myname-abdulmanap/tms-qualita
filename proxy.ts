// proxy.ts
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

export default function proxy(req: NextRequest) {
  const hasSession = req.cookies.get("session")?.value;
  if (!hasSession) {
    const url = new URL("/login", req.url);
    url.searchParams.set("next", req.nextUrl.pathname + req.nextUrl.search);
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/devices/:path*",
    "/stores/:path*",
    "/groups/:path*",
    "/users/:path*",
  ],
};
