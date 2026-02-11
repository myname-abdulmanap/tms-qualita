import { NextResponse } from "next/server";
import { cookies } from "next/headers";

const BACKEND_URL = process.env.BACKEND_URL!;

// POST /api/ota/firmware/upload — proxy multipart upload
export async function POST(req: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("session")?.value;

    // Get the raw body and content-type (preserves multipart boundary)
    const contentType = req.headers.get("content-type") || "";
    const body = await req.arrayBuffer();

    const headers: HeadersInit = {
      "Content-Type": contentType,
    };
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    const res = await fetch(`${BACKEND_URL}/ota/firmware/upload`, {
      method: "POST",
      headers,
      body: Buffer.from(body),
    });

    if (!res.ok) {
      const errorText = await res.text();
      return NextResponse.json({ error: errorText }, { status: res.status });
    }

    return NextResponse.json(await res.json());
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
