// app/api/login/route.ts
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const { email, pwd, next = "/dashboard" } = await req.json();

  // TODO: validasi asli ke backend kamu
  const ok = Boolean(email) && Boolean(pwd);
  if (!ok) return NextResponse.json({ error: "Invalid" }, { status: 401 });

  const res = NextResponse.json({ ok: true }, { status: 200 });
  // cookie sesi dummy 7 hari
  res.cookies.set("session", "dummy-session-token", {
    httpOnly: true,
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7,
    path: "/",
  });
  // biar fetch() di client bisa redirect setelah router.replace(next)
  return res;
}
