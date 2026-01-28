import { NextResponse } from "next/server";
import { backendFetch } from "@/lib/backend-fetch";
import { cookies } from "next/headers";

function decodeJWT(token: string) {
  try {
    return JSON.parse(Buffer.from(token.split(".")[1], "base64").toString());
  } catch {
    return null;
  }
}

async function checkAuth() {
  const cookieStore = await cookies();
  const token = cookieStore.get("session")?.value;
  
  if (!token) {
    return { authorized: false, error: "Unauthorized", user: null };
  }
  
  const payload = decodeJWT(token);
  if (!payload) {
    return { authorized: false, error: "Invalid token", user: null };
  }
  
  return { authorized: true, user: payload };
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
  
  // Only super admin (no clientId) can access
  if (payload.clientId) {
    return { authorized: false, error: "Forbidden - Super admin only" };
  }
  
  return { authorized: true };
}

// GET - Semua authenticated user bisa akses (tapi backend yang filter)
export async function GET(req: Request) {
  const auth = await checkAuth();
  if (!auth.authorized) {
    return NextResponse.json({ error: auth.error }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const scope = searchParams.get("scope");
    
    const url = scope ? `/roles?scope=${scope}` : "/roles";
    const res = await backendFetch(url);
    
    if (!res.ok) {
      const error = await res.text();
      return NextResponse.json({ error }, { status: res.status });
    }
    
    const data = await res.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("❌ GET /roles error:", error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

// POST - Hanya Super Admin
export async function POST(req: Request) {
  const access = await checkSuperAdminAccess();
  if (!access.authorized) {
    return NextResponse.json({ error: access.error }, { status: 403 });
  }

  try {
    const body = await req.json();
    
    const res = await backendFetch("/roles", {
      method: "POST",
      body: JSON.stringify(body),
    });
    
    const text = await res.text();
    
    if (!res.ok) {
      const errorData = text ? JSON.parse(text) : { message: "Failed" };
      return NextResponse.json(errorData, { status: res.status });
    }
    
    const data = text ? JSON.parse(text) : {};
    return NextResponse.json(data);
  } catch (error) {
    console.error("❌ POST /roles error:", error);
    return NextResponse.json({ message: "Failed", error: String(error) }, { status: 500 });
  }
}