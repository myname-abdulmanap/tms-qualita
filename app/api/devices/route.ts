import { NextResponse } from "next/server";
import { backendFetch } from "@/lib/backend-fetch";

export async function GET(req: Request) {
  try {
    console.log("🎯 Frontend /api/devices GET called");
    const { searchParams } = new URL(req.url);
    const query = searchParams.toString();
    const res = await backendFetch(query ? `/devices?${query}` : "/devices");
    console.log("📡 GET /devices backend response status:", res.status);
    
    if (!res.ok) {
      const errorText = await res.text();
      console.error("❌ Backend /devices error (status " + res.status + "):", errorText);
      if (res.status === 403) {
        console.error("⚠️ 403 Forbidden from backend - possible authentication or permission issue");
      }
      return NextResponse.json(
        { error: errorText, status: res.status },
        { status: res.status }
      );
    }
    
    const text = await res.text();
    const data = text ? JSON.parse(text) : [];
    console.log("✅ Successfully loaded " + data.length + " devices from backend");
    return NextResponse.json(Array.isArray(data) ? data : [], { status: res.status });
  } catch (error) {
    console.error("❌ GET /devices error:", error);
    return NextResponse.json(
      { error: String(error) },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    console.log("📤 Creating device with data:", body);
    
    // Decode JWT to see what's being sent
    const cookieStore = await (await import("next/headers")).cookies();
    const token = cookieStore.get("session")?.value;
    if (token) {
      try {
        const payload = JSON.parse(Buffer.from(token.split(".")[1], "base64").toString());
        console.log("🔐 JWT Payload being sent to backend:", {
          userId: payload.userId,
          clientId: payload.clientId,
          merchantId: payload.merchantId,
          roleId: payload.roleId,
          permissions: payload.permissions
        });
      } catch (e) {
        console.log("⚠️ Could not decode JWT");
      }
    }
    
    const res = await backendFetch("/devices", {
      method: "POST",
      body: JSON.stringify(body),
    });
    
    console.log("📡 POST /devices status:", res.status);
    const text = await res.text();
    console.log("📄 Backend response:", text);
    
    if (!res.ok) {
      const errorData = text ? JSON.parse(text) : { message: "Failed" };
      return NextResponse.json(errorData, { status: res.status });
    }
    
    const data = text ? JSON.parse(text) : {};
    return NextResponse.json(data);
  } catch (error) {
    console.error("❌ POST /devices error:", error);
    return NextResponse.json(
      { message: "Failed", error: String(error) },
      { status: 500 }
    );
  }
}
