import { NextResponse } from "next/server";
import { cookies } from "next/headers";

const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:3000";

// GET /api/apk/[id] - Get APK details
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const cookieStore = await cookies();
    const token = cookieStore.get("session")?.value;

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const res = await fetch(`${BACKEND_URL}/apk/${id}`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error("[APK Detail Proxy Error]", errorMsg);
    return NextResponse.json(
      { error: errorMsg, success: false },
      { status: 500 }
    );
  }
}

// DELETE /api/apk/[id] - Delete APK
export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const cookieStore = await cookies();
    const token = cookieStore.get("session")?.value;

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const res = await fetch(`${BACKEND_URL}/apk/${id}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error("[APK Delete Proxy Error]", errorMsg);
    return NextResponse.json(
      { error: errorMsg, success: false },
      { status: 500 }
    );
  }
}
