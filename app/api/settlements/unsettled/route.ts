import { NextResponse } from "next/server";
import { backendFetch } from "@/lib/backend-fetch";

// GET /api/settlements/unsettled — list unsettled transactions
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const params = new URLSearchParams();

    const merchantId = searchParams.get("merchantId");
    if (merchantId) params.append("merchantId", merchantId);

    const res = await backendFetch(`/settlement/unsettled?${params.toString()}`);

    if (!res.ok) {
      const errorText = await res.text();
      return NextResponse.json({ error: errorText }, { status: res.status });
    }

    const json = await res.json();
    return NextResponse.json(json);
  } catch (error) {
    console.error("❌ GET /settlements/unsettled error:", error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
