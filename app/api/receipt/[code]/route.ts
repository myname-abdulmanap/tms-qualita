import { NextResponse } from "next/server";

const BACKEND_URL = process.env.BACKEND_URL!;

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await params;

    // Panggil backend langsung TANPA auth (receipt publik)
    const res = await fetch(`${BACKEND_URL}/transactions/${code}`, {
      headers: { "Content-Type": "application/json" },
      cache: "no-store",
    });

    if (!res.ok) {
      return NextResponse.json(
        { success: false },
        { status: res.status }
      );
    }

    const json = await res.json();

    return NextResponse.json({
      success: true,
      data: json.data,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 }
    );
  }
}