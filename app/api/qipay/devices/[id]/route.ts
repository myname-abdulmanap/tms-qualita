import { NextResponse } from "next/server";
import { backendFetch } from "@/lib/backend-fetch";

/* =========================
   GET QIPAY DEVICE (BY ID)
========================= */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const res = await backendFetch(`/qipay/devices/${id}`);
    const text = await res.text();
    const data = text ? JSON.parse(text) : null;

    return NextResponse.json(data, { status: res.status });
  } catch (error) {
    console.error("❌ GET /qipay/devices/[id] error:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}

/* =========================
   UPDATE QIPAY DEVICE
   (AES / STATUS / NOTES / SUN)
========================= */
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();

    // ❗ pastikan frontend TIDAK kirim field lama
    const payload = {
      aesKey: body.aesKey,
      status: body.status,
      sunEnabled: body.sunEnabled,
      notes: body.notes,
    };

    const res = await backendFetch(`/qipay/devices/${id}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    });

    const text = await res.text();
    const data = text ? JSON.parse(text) : null;

    return NextResponse.json(data, { status: res.status });
  } catch (error) {
    console.error("❌ PATCH /qipay/devices/[id] error:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}

/* =========================
   DELETE QIPAY DEVICE
========================= */
export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const res = await backendFetch(`/qipay/devices/${id}`, {
      method: "DELETE",
    });

    const text = await res.text();
    const data = text ? JSON.parse(text) : null;

    return NextResponse.json(data, { status: res.status });
  } catch (error) {
    console.error("❌ DELETE /qipay/devices/[id] error:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
