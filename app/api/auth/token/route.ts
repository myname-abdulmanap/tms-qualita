import { NextResponse } from "next/server";
import { cookies } from "next/headers";

// GET /api/auth/token — return session token for direct backend calls
export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("session")?.value || null;
    return NextResponse.json({ token });
  } catch {
    return NextResponse.json({ token: null });
  }
}
