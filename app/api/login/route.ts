import { NextResponse } from "next/server";

const BACKEND_URL = process.env.BACKEND_URL!;

export async function POST(req: Request) {
  const { email, pwd } = await req.json();

  const res = await fetch(`${BACKEND_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password: pwd }),
  });

  const rawText = await res.text();

  const contentType = res.headers.get("content-type") ?? "";
  if (!res.ok || !contentType.includes("application/json")) {
    console.error(`[login] backend responded ${res.status}, body: ${rawText.slice(0, 200)}`);
    return NextResponse.json({ message: "Login failed" }, { status: 401 });
  }

  const data = JSON.parse(rawText); // { token }

  const response = NextResponse.json({ ok: true });

  response.cookies.set("session", data.token, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 8,
  });

  return response;
}
