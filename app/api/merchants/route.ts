import { NextResponse } from "next/server";
import { backendFetch } from "@/lib/backend-fetch";

export async function GET() {
  try {
    const res = await backendFetch("/merchants");
    console.log("📡 GET /merchants status:", res.status);
    
    if (!res.ok) {
      const errorText = await res.text();
      console.error("❌ Backend error:", errorText);
      return NextResponse.json(
        { error: errorText },
        { status: res.status }
      );
    }
    
    const text = await res.text();
    const data = text ? JSON.parse(text) : [];
    return NextResponse.json(Array.isArray(data) ? data : [], { status: res.status });
  } catch (error) {
    console.error("❌ GET /merchants error:", error);
    return NextResponse.json(
      { error: String(error) },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    
    const res = await backendFetch("/merchants", {
      method: "POST",
      body: JSON.stringify(body),
    });
    
    const text = await res.text();
    
    if (!res.ok) {
      const errorData = text ? JSON.parse(text) : { message: "Failed" };
      return NextResponse.json(errorData, { status: res.status });
    }
    
    const data = text ? JSON.parse(text) : {};
    return NextResponse.json(data);
  } catch (error) {
    console.error("❌ POST /merchants error:", error);
    return NextResponse.json(
      { message: "Failed", error: String(error) },
      { status: 500 }
    );
  }
}
