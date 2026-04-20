import { NextResponse } from "next/server";
import { cookies } from "next/headers";

const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:3000";

// GET /api/apk - List all APKs
export async function GET(req: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("session")?.value;

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const res = await fetch(`${BACKEND_URL}/apk`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error("[APK List Proxy Error]", errorMsg);
    return NextResponse.json(
      { error: errorMsg, success: false },
      { status: 500 }
    );
  }
}
