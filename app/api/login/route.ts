import { NextResponse } from "next/server";

const BACKEND_URL = process.env.BACKEND_URL!;

export async function POST(req: Request) {
  const { email, pwd } = await req.json();

  const res = await fetch(`${BACKEND_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password: pwd }),
  });

  const data = await res.json(); // { token }

  if (!res.ok) {
    return NextResponse.json({ message: "Login failed" }, { status: 401 });
  }

  const response = NextResponse.json({ ok: true });

  response.cookies.set("session", data.token, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 8,
  });

  return response;
}
