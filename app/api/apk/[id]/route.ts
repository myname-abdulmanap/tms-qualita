import { NextResponse } from "next/server";
import { backendFetch } from "@/lib/backend-fetch";

// GET /api/apk/[id] - Get APK details
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const res = await backendFetch(`/apk/${id}`, { method: "GET" });
    const text = await res.text();
    const data = text ? JSON.parse(text) : { success: false };
    return NextResponse.json(data, { status: res.status });
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error("[APK Detail Proxy Error]", errorMsg);
    const status = errorMsg.includes("Request timeout") ? 504 : 500;
    return NextResponse.json(
      { error: errorMsg, success: false },
      { status }
    );
  }
}

// DELETE /api/apk/[id] - Delete APK
export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const res = await backendFetch(`/apk/${id}`, { method: "DELETE" });
    const text = await res.text();
    const data = text ? JSON.parse(text) : { success: false };
    return NextResponse.json(data, { status: res.status });
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error("[APK Delete Proxy Error]", errorMsg);
    const status = errorMsg.includes("Request timeout") ? 504 : 500;
    return NextResponse.json(
      { error: errorMsg, success: false },
      { status }
    );
  }
}
