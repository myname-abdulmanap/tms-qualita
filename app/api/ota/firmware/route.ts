import { NextResponse } from "next/server";
import { backendFetch } from "@/lib/backend-fetch";

// GET /api/ota/firmware
export async function GET() {
  try {
    const res = await backendFetch("/ota/firmware");
    if (!res.ok) {
      return NextResponse.json({ error: await res.text() }, { status: res.status });
    }
    return NextResponse.json(await res.json());
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
