import { NextResponse } from "next/server";
import { cookies } from "next/headers";

function decodeJWT(token: string) {
  try {
    return JSON.parse(
      Buffer.from(token.split(".")[1], "base64").toString()
    );
  } catch {
    return null;
  }
}

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("session")?.value;

    console.log("🔑 /api/me: Token exists?", !!token);

    if (!token) {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      );
    }

    const payload = decodeJWT(token);
    console.log("📋 /api/me: Decoded payload:", payload);

    if (!payload) {
      return NextResponse.json(
        { message: "Invalid token" },
        { status: 401 }
      );
    }

    // Return user info dari JWT
    const response = {
      userId: payload.userId,
      name: payload.name || "User",
      email: payload.email || "",
      roleId: payload.roleId,
      roleName: payload.roleName || "Unknown",
      clientId: payload.clientId,
      merchantId: payload.merchantId,
      permissions: payload.permissions,
    };

    console.log("✅ /api/me: Returning response:", response);

    return NextResponse.json(response);
  } catch (error) {
    console.error("❌ GET /api/me error:", error);
    return NextResponse.json(
      { error: String(error) },
      { status: 500 }
    );
  }
}