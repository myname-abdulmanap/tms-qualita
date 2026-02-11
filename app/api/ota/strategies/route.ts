import { NextResponse } from "next/server";
import { backendFetch } from "@/lib/backend-fetch";

// GET /api/ota/strategies
export async function GET() {
  try {
    const res = await backendFetch("/ota/strategies");
    if (!res.ok) {
      return NextResponse.json({ error: await res.text() }, { status: res.status });
    }
    return NextResponse.json(await res.json());
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

// POST /api/ota/strategies
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const res = await backendFetch("/ota/strategies", {
      method: "POST",
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      return NextResponse.json({ error: await res.text() }, { status: res.status });
    }
    return NextResponse.json(await res.json());
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
