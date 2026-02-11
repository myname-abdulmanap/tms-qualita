import { NextResponse } from "next/server";
import { backendFetch } from "@/lib/backend-fetch";

// POST /api/settlements/settle-merchant — settle all unsettled for a merchant
export async function POST(req: Request) {
  try {
    const body = await req.json();

    const res = await backendFetch("/settlement/settle-merchant", {
      method: "POST",
      body: JSON.stringify(body),
    });

    const text = await res.text();
    const data = text ? JSON.parse(text) : {};

    if (!res.ok) {
      return NextResponse.json(data, { status: res.status });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("❌ POST /settlements/settle-merchant error:", error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
