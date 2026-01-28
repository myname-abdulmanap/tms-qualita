import { NextResponse } from "next/server";
import { backendFetch } from "@/lib/backend-fetch";

/* =========================
   GET QIPAY DEVICES
========================= */
export async function GET() {
  try {
    const res = await backendFetch("/qipay/devices");
    const text = await res.text();
    const data = text ? JSON.parse(text) : [];

    return NextResponse.json(data, { status: res.status });
  } catch (error) {
    console.error("❌ GET /qipay/devices error:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}

/* =========================
   CREATE QIPAY DEVICE
========================= */
export async function POST(req: Request) {
  try {
    const body = await req.json();

    const payload = {
      ntagUid: body.ntagUid,
      aesKey: body.aesKey,
      merchantId: body.merchantId,
      notes: body.notes,
    };

    const res = await backendFetch("/qipay/devices", {
      method: "POST",
      body: JSON.stringify(payload),
    });

    const text = await res.text();
    const data = text ? JSON.parse(text) : null;

    return NextResponse.json(data, { status: res.status });
  } catch (error) {
    console.error("❌ POST /qipay/devices error:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
