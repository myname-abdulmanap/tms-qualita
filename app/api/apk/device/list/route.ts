import { NextResponse } from "next/server";
import { cookies } from "next/headers";

const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:3000";

export async function GET(req: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("session")?.value;
    const url = new URL(req.url);
    const sn = url.searchParams.get("sn");

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (!sn) {
      return NextResponse.json({ error: "Device serial number is required" }, { status: 400 });
    }

    const res = await fetch(`${BACKEND_URL}/apk/device/list?sn=${encodeURIComponent(sn)}`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    const contentType = res.headers.get("content-type");
    if (contentType?.includes("application/json")) {
      const data = await res.json();
      return NextResponse.json(data, { status: res.status });
    }

    const text = await res.text();
    return NextResponse.json({ error: text || "Failed to fetch APK list" }, { status: res.status });
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error("[APK Device List Proxy Error]", errorMsg);
    return NextResponse.json({ error: errorMsg, success: false }, { status: 500 });
  }
}
