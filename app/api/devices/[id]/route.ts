import { NextResponse } from "next/server";
import { backendFetch } from "@/lib/backend-fetch";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(req.url);
    const query = searchParams.toString();
    const res = await backendFetch(query ? `/devices/${id}?${query}` : `/devices/${id}`);

    if (!res.ok) {
      const errorText = await res.text();
      const errorData = errorText ? JSON.parse(errorText) : { message: "Failed" };
      return NextResponse.json(errorData, { status: res.status });
    }

    const text = await res.text();
    const data = text ? JSON.parse(text) : {};
    return NextResponse.json(data);
  } catch (error) {
    console.error("❌ GET /devices/[id] error:", error);
    return NextResponse.json(
      { message: "Failed", error: String(error) },
      { status: 500 }
    );
  }
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const deviceType = typeof body.deviceType === "string" ? body.deviceType : undefined;
    const query = deviceType ? `?deviceType=${encodeURIComponent(deviceType)}` : "";
    console.log("📤 Updating device:", id, body);

    const res = await backendFetch(`/devices/${id}${query}`, {
      method: "PUT",
      body: JSON.stringify(body),
    });

    console.log("📡 PUT response status:", res.status);

    if (!res.ok) {
      const errorText = await res.text();
      console.error("❌ Backend error:", errorText);
      const errorData = errorText ? JSON.parse(errorText) : { message: "Failed" };
      console.error("❌ Full error response:", errorData);
      return NextResponse.json(errorData, { status: res.status });
    }

    const text = await res.text();
    const data = text ? JSON.parse(text) : {};
    return NextResponse.json(data);
  } catch (error) {
    console.error("❌ PUT /devices/[id] error:", error);
    return NextResponse.json(
      { message: "Failed", error: String(error) },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    console.log("🗑️ Deleting device:", id);

    const res = await backendFetch(`/devices/${id}`, {
      method: "DELETE",
    });

    console.log("📡 DELETE response status:", res.status);

    if (!res.ok) {
      const errorText = await res.text();
      console.error("❌ Backend error:", errorText);
      const errorData = errorText ? JSON.parse(errorText) : { message: "Failed" };
      return NextResponse.json(errorData, { status: res.status });
    }

    return NextResponse.json({ message: "Device deleted successfully" });
  } catch (error) {
    console.error("❌ DELETE /devices/[id] error:", error);
    return NextResponse.json(
      { message: "Failed", error: String(error) },
      { status: 500 }
    );
  }
}
