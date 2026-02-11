import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

function decodeJWT(token: string) {
  try {
    return JSON.parse(
      Buffer.from(token.split(".")[1], "base64").toString()
    );
  } catch {
    return null;
  }
}

export default function proxy(req: NextRequest) {
  const token = req.cookies.get("session")?.value;
  const pathname = req.nextUrl.pathname;
  const isLoginPage = pathname.startsWith("/login");
  const is403Page = pathname.startsWith("/403");
  const isReceiptPage = pathname.startsWith("/receipt");

  // 1. Not logged in → redirect to login (except login, 403 & receipt pages)
  if (!token && !isLoginPage && !is403Page && !isReceiptPage) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  // 2. Already logged in but trying to access /login → redirect to dashboard
  if (token && isLoginPage) {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  // 3. Check permissions for protected pages
  if (token && !isLoginPage && !is403Page) {
    const payload = decodeJWT(token);
    
    if (!payload) {
      // Invalid token → redirect to login
      const response = NextResponse.redirect(new URL("/login", req.url));
      response.cookies.delete("session"); // Clear invalid token
      return response;
    }

    const perms: string[] = payload.permissions || [];
    
    // 👇 PENTING: Check apakah user adalah Vendor (Super Admin)
    const isVendor = payload.clientId === null && payload.merchantId === null;
    
    console.log("🔐 Middleware check:", {
      pathname,
      isVendor,
      clientId: payload.clientId,
      merchantId: payload.merchantId,
      permissions: perms
    });

    // CLIENTS PAGE - HANYA VENDOR (clientId & merchantId harus null)
    if (pathname.startsWith("/clients")) {
      // Cek permission DAN cek apakah Vendor
      if (!perms.includes("client:read") || !isVendor) {
        console.log("❌ Access denied to /clients");
        return NextResponse.redirect(new URL("/403", req.url));
      }
      console.log("✅ Access granted to /clients");
    }

    // USERS PAGE - Vendor and Client Admin can access
    if (pathname.startsWith("/users")) {
      if (!perms.includes("user:read")) {
        return NextResponse.redirect(new URL("/403", req.url));
      }
    }

    // MERCHANTS PAGE - Vendor and Client Admin can access
    if (pathname.startsWith("/merchants")) {
      if (!perms.includes("merchant:read")) {
        return NextResponse.redirect(new URL("/403", req.url));
      }
    }

    // DEVICES PAGE - All authenticated users
    if (pathname.startsWith("/devices")) {
      if (!perms.includes("device:read")) {
        return NextResponse.redirect(new URL("/403", req.url));
      }
    }

    // TRANSACTIONS PAGE - All authenticated users
    if (pathname.startsWith("/transactions")) {
      if (!perms.includes("transaction:read")) {
        return NextResponse.redirect(new URL("/403", req.url));
      }
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|receipt).*)",
  ],
};