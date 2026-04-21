import { NextResponse } from "next/server";
import { backendFetch } from "@/lib/backend-fetch";

// GET /api/apk - List all APKs
export async function GET(_req: Request) {
  try {
    const res = await backendFetch("/apk", { method: "GET" });
    const text = await res.text();
    const data = text ? JSON.parse(text) : { success: false, data: [] };
    return NextResponse.json(data, { status: res.status });
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error("[APK List Proxy Error]", errorMsg);
    const status = errorMsg.includes("Request timeout") ? 504 : 500;
    return NextResponse.json(
      { error: errorMsg, success: false },
      { status }
    );
  }
}
