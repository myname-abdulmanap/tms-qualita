import { NextResponse } from "next/server";
import { backendFetch } from "@/lib/backend-fetch";

// GET /api/ota/strategies/[id]/logs
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const res = await backendFetch(`/ota/strategies/${id}/logs`);
    if (!res.ok) {
      return NextResponse.json({ error: await res.text() }, { status: res.status });
    }
    return NextResponse.json(await res.json());
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
