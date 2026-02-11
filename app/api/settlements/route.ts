import { NextResponse } from "next/server";
import { backendFetch } from "@/lib/backend-fetch";

// GET /api/settlements — list settlements (history)
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const params = new URLSearchParams();

    const merchantId = searchParams.get("merchantId");
    const from = searchParams.get("from");
    const to = searchParams.get("to");

    if (merchantId) params.append("merchantId", merchantId);
    if (from) params.append("from", from);
    if (to) params.append("to", to);

    const res = await backendFetch(`/settlement?${params.toString()}`);

    if (!res.ok) {
      const errorText = await res.text();
      return NextResponse.json({ error: errorText }, { status: res.status });
    }

    const json = await res.json();
    return NextResponse.json(json);
  } catch (error) {
    console.error("❌ GET /settlements error:", error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
