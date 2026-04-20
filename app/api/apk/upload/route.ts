import { NextResponse } from "next/server";
import { cookies } from "next/headers";

const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:3000";

export async function POST(req: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("session")?.value;

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Forward the request to backend with token
    const formData = await req.formData();
    
    const res = await fetch(`${BACKEND_URL}/apk/upload`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    });

    const contentType = res.headers.get("content-type");
    
    if (!res.ok) {
      // Try to parse as JSON if possible
      if (contentType?.includes("application/json")) {
        const data = await res.json();
        return NextResponse.json(data, { status: res.status });
      } else {
        // If not JSON, return error
        const text = await res.text();
        console.error("[Proxy Error]", text);
        return NextResponse.json(
          { error: text || "Upload failed", success: false },
          { status: res.status }
        );
      }
    }

    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error("[APK Upload Proxy Error]", errorMsg);
    return NextResponse.json(
      { error: errorMsg, success: false },
      { status: 500 }
    );
  }
}
