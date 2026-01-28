import { NextResponse } from "next/server";
import { backendFetch } from "@/lib/backend-fetch";

export async function GET() {
  try {
    const res = await backendFetch("/dashboard/summary");
    console.log("📡 GET /dashboard/summary status:", res.status);
    
    if (!res.ok) {
      const errorText = await res.text();
      console.error("❌ Backend error:", errorText);
      return NextResponse.json(
        { error: errorText },
        { status: res.status }
      );
    }
    
    const text = await res.text();
    const data = text ? JSON.parse(text) : {
      merchants: 0,
      devices: 0,
      transactions: 0,
      totalAmount: 0
    };
    
    return NextResponse.json(data, { status: res.status });
  } catch (error) {
    console.error("❌ GET /dashboard/summary error:", error);
    return NextResponse.json(
      { error: String(error) },
      { status: 500 }
    );
  }
}