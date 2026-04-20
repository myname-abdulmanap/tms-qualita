import { NextResponse } from "next/server";
import { cookies } from "next/headers";

const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:3000";

export async function POST(req: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("session")?.value;
    const body = await req.json();

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const res = await fetch(`${BACKEND_URL}/apk/device/check-update`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error("[APK Check Update Proxy Error]", errorMsg);
    return NextResponse.json({ error: errorMsg, success: false }, { status: 500 });
  }
}
