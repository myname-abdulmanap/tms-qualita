// app/login/page.tsx
"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export default function LoginPage() {
  return (
    <div className="min-h-screen grid place-items-center bg-gradient-to-br from-slate-50 to-indigo-50 dark:from-slate-950 dark:to-slate-900">
      <Suspense fallback={<div className="text-sm text-slate-600 dark:text-slate-300">Loading…</div>}>
        <LoginClient />
      </Suspense>
    </div>
  );
}

function LoginClient() {
  const router = useRouter();
  const sp = useSearchParams();
  const next = sp.get("next") || "/dashboard";

  const [email, setEmail] = useState("");
  const [pwd, setPwd] = useState("");
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const res = await fetch("/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" }, // biar aman
      body: JSON.stringify({ email, pwd, next }),
    });
    if (res.ok) router.replace(next);
    else setLoading(false);
  };

  return (
    <form
      onSubmit={onSubmit}
      className="w-full max-w-sm rounded-2xl border bg-white/80 dark:bg-slate-900/70 backdrop-blur p-6 shadow-xl dark:border-slate-800"
    >
      <h1 className="text-xl font-semibold mb-4 text-slate-900 dark:text-white">Sign in</h1>

      <label className="text-sm text-slate-600 dark:text-slate-300">Email</label>
      <input
        className="mt-1 mb-3 w-full rounded-lg border px-3 py-2 text-sm dark:bg-slate-800 dark:border-slate-700"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="admin@qualita.id"
        type="email"
        required
      />

      <label className="text-sm text-slate-600 dark:text-slate-300">Password</label>
      <input
        className="mt-1 mb-4 w-full rounded-lg border px-3 py-2 text-sm dark:bg-slate-800 dark:border-slate-700"
        value={pwd}
        onChange={(e) => setPwd(e.target.value)}
        placeholder="••••••••"
        type="password"
        required
      />

      <button
        disabled={loading}
        className="w-full rounded-lg bg-indigo-600 text-white py-2 text-sm font-medium hover:bg-indigo-700 transition disabled:opacity-60"
      >
        {loading ? "Signing in..." : "Sign in"}
      </button>
    </form>
  );
}
