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
    return { authorized: false, error: "Unauthorized" };
  }
  
  const payload = decodeJWT(token);
  if (!payload) {
    return { authorized: false, error: "Invalid token" };
  }
  
  return { authorized: true };
}

export async function GET() {
  const access = await checkAuth();
  if (!access.authorized) {
    return NextResponse.json({ error: access.error }, { status: 401 });
  }

  try {
    // Ambil semua roles
    const res = await backendFetch("/roles");
    
    if (!res.ok) {
      const error = await res.text();
      console.error("❌ Backend /roles error:", error);
      return NextResponse.json({ error }, { status: res.status });
    }
    
    const roles = await res.json();
    
    // Ekstrak semua permissions dari roles dan deduplicate
    const permissionsMap = new Map();
    
    roles.forEach((role: any) => {
      role.permissions.forEach((rp: any) => {
        const perm = rp.permission;
        if (!permissionsMap.has(perm.id)) {
          permissionsMap.set(perm.id, {
            id: perm.id,
            key: perm.key,
            description: perm.description
          });
        }
      });
    });
    
    // Convert Map to Array dan sort by key
    const permissions = Array.from(permissionsMap.values()).sort((a, b) => 
      a.key.localeCompare(b.key)
    );
    
    return NextResponse.json(permissions);
  } catch (error) {
    console.error("❌ GET /permissions error:", error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}