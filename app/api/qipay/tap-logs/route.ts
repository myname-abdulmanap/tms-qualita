import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:5000";

/* =====================================================
   GET QIPAY TAP LOGS (ADMIN)
===================================================== */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.toString();

    // ✅ FIX: cookies() is async
    const cookieStore = await cookies();
    const token = cookieStore.get("session")?.value;

    const response = await fetch(
      `${BACKEND_URL}/qipay/tap-logs${query ? `?${query}` : ""}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        cache: "no-store",
      }
    );

    const text = await response.text();
    const data = text ? JSON.parse(text) : [];

    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error("❌ Error fetching tap logs:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
