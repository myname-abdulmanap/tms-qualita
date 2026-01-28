import { NextResponse } from "next/server";
import { backendFetch } from "@/lib/backend-fetch";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> } // 👈 params adalah Promise
) {
  try {
    const { id } = await params; // 👈 await params dulu
    
    const res = await backendFetch(`/clients/${id}`);
    
    if (!res.ok) {
      const errorText = await res.text();
      const errorData = errorText ? JSON.parse(errorText) : { message: "Not found" };
      return NextResponse.json(errorData, { status: res.status });
    }
    
    const text = await res.text();
    const data = text ? JSON.parse(text) : {};
    return NextResponse.json(data);
  } catch (error) {
    console.error("❌ GET /clients/[id] error:", error);
    return NextResponse.json(
      { error: String(error) },
      { status: 500 }
    );
  }
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> } // 👈 params adalah Promise
) {
  try {
    const { id } = await params; // 👈 await params dulu
    const body = await req.json();
    console.log("📤 Updating client:", id, body);
    
    const res = await backendFetch(`/clients/${id}`, {
      method: "PUT",
      body: JSON.stringify(body),
    });
    
    console.log("📡 PUT response status:", res.status);
    
    if (!res.ok) {
      const errorText = await res.text();
      console.error("❌ Backend error:", errorText);
      const errorData = errorText ? JSON.parse(errorText) : { message: "Failed" };
      return NextResponse.json(errorData, { status: res.status });
    }
    
    const text = await res.text();
    const data = text ? JSON.parse(text) : {};
    return NextResponse.json(data);
  } catch (error) {
    console.error("❌ PUT /clients/[id] error:", error);
    return NextResponse.json(
      { message: "Failed", error: String(error) },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> } // 👈 params adalah Promise
) {
  try {
    const { id } = await params; // 👈 await params dulu
    
    const res = await backendFetch(`/clients/${id}`, {
      method: "DELETE",
    });
    
    if (!res.ok) {
      const errorText = await res.text();
      const errorData = errorText ? JSON.parse(errorText) : { message: "Failed" };
      return NextResponse.json(errorData, { status: res.status });
    }
    
    const text = await res.text();
    const data = text ? JSON.parse(text) : { message: "Deleted" };
    return NextResponse.json(data);
  } catch (error) {
    console.error("❌ DELETE /clients/[id] error:", error);
    return NextResponse.json(
      { message: "Failed", error: String(error) },
      { status: 500 }
    );
  }
}