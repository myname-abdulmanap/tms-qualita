import { NextRequest, NextResponse } from "next/server";
import { backendFetch } from "@/lib/backend-fetch";
import { cookies } from "next/headers";

type Params = { id: string };

function decodeJWT(token: string) {
  try {
    return JSON.parse(Buffer.from(token.split(".")[1], "base64").toString());
  } catch {
    return null;
  }
}


async function checkSuperAdminAccess() {
  const cookieStore = await cookies();
  const token = cookieStore.get("session")?.value;

  if (!token) {
    return { authorized: false, error: "Unauthorized" };
  }

  const payload = decodeJWT(token);
  if (!payload) {
    return { authorized: false, error: "Invalid token" };
  }

  if (payload.clientId) {
    return { authorized: false, error: "Forbidden - Super admin only" };
  }

  return { authorized: true };
}


export async function PUT(
  request: NextRequest,
  context: { params: Promise<Params> }
) {
  const access = await checkSuperAdminAccess();
  if (!access.authorized) {
    return NextResponse.json({ error: access.error }, { status: 403 });
  }

  try {
    const { id } = await context.params;
    const body = await request.json();

    const res = await backendFetch(`/roles/${id}`, {
      method: "PUT",
      body: JSON.stringify(body),
    });

    const text = await res.text();

    if (!res.ok) {
      const errorData = text ? JSON.parse(text) : { message: "Failed" };
      return NextResponse.json(errorData, { status: res.status });
    }

    return NextResponse.json(text ? JSON.parse(text) : {});
  } catch (error) {
    console.error("❌ PUT /roles/[id] error:", error);
    return NextResponse.json(
      { message: "Failed", error: String(error) },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<Params> }
) {
  const access = await checkSuperAdminAccess();
  if (!access.authorized) {
    return NextResponse.json({ error: access.error }, { status: 403 });
  }

  try {
    const { id } = await context.params;

    const res = await backendFetch(`/roles/${id}`, {
      method: "DELETE",
    });

    const text = await res.text();

    if (!res.ok) {
      const errorData = text ? JSON.parse(text) : { message: "Failed" };
      return NextResponse.json(errorData, { status: res.status });
    }

    return NextResponse.json(text ? JSON.parse(text) : {});
  } catch (error) {
    console.error("❌ DELETE /roles/[id] error:", error);
    return NextResponse.json(
      { message: "Failed", error: String(error) },
      { status: 500 }
    );
  }
}
