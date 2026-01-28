import { NextResponse } from "next/server";
import { backendFetch } from "@/lib/backend-fetch";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    // Await params di Next.js 15+
    const { code } = await params;
    
    const res = await backendFetch(`/transactions/${code}`);

    if (!res.ok) {
      return NextResponse.json(
        { success: false },
        { status: res.status }
      );
    }

    const json = await res.json();

    return NextResponse.json({
      success: true,
      data: json.data, // unwrap backend response
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 }
    );
  }
}