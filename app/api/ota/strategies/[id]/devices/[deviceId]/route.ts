import { NextResponse } from "next/server";
import { backendFetch } from "@/lib/backend-fetch";

// DELETE /api/ota/strategies/[id]/devices/[deviceId]
export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string; deviceId: string }> }
) {
  try {
    const { id, deviceId } = await params;
    const res = await backendFetch(`/ota/strategies/${id}/devices/${deviceId}`, {
      method: "DELETE",
    });
    if (!res.ok) {
      return NextResponse.json({ error: await res.text() }, { status: res.status });
    }
    return NextResponse.json(await res.json());
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
