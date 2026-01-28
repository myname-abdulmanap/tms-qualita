import { NextResponse } from "next/server";
import { backendFetch } from "@/lib/backend-fetch";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);

    const merchantId = searchParams.get("merchantId");
    const from = searchParams.get("from");
    const to = searchParams.get("to");
    const today = searchParams.get("today");
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "10", 10);

    // =====================
    // BUILD QUERY PARAMS
    // =====================
    const params = new URLSearchParams();
    if (merchantId) params.append("merchantId", merchantId);
    if (from) params.append("from", from);
    if (to) params.append("to", to);
    if (today) params.append("today", today);

    // =====================
    // FETCH BACKEND
    // =====================
    const res = await backendFetch(`/transactions?${params.toString()}`);

    if (!res.ok) {
      const errorText = await res.text();
      return NextResponse.json(
        { success: false, error: errorText },
        { status: res.status }
      );
    }

    // =====================
    // PARSE RESPONSE (FIX)
    // Backend returns: { success, data }
    // =====================
    const json = await res.json();

    const transactions = Array.isArray(json.data)
      ? json.data
      : [];

    // =====================
    // CLIENT-SIDE PAGINATION
    // =====================
    const total = transactions.length;
    const totalPages = Math.ceil(total / limit);

    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;

    const paginatedData = transactions.slice(startIndex, endIndex);

    // =====================
    // RESPONSE TO CLIENT
    // =====================
    return NextResponse.json({
      success: true,
      data: paginatedData,
      total,
      page,
      limit,
      totalPages,
    });
  } catch (error) {
    console.error("❌ GET /api/transactions error:", error);
    return NextResponse.json(
      {
        success: false,
        error: String(error),
      },
      { status: 500 }
    );
  }
}
