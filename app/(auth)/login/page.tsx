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
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, pwd }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Login gagal");
        setLoading(false);
        return;
      }

      setSuccess("Login berhasil, mengalihkan...");
      setTimeout(() => router.replace(next), 800);
    } catch {
      setError("Server tidak dapat dihubungi");
      setLoading(false);
    }
  };

  return (
    <form
      onSubmit={onSubmit}
      className="w-full max-w-sm rounded-2xl border bg-white/80 dark:bg-slate-900/70 backdrop-blur p-6 shadow-xl dark:border-slate-800"
    >
      {error && (
        <div className="mb-3 rounded-lg bg-red-50 border border-red-200 text-red-700 px-3 py-2 text-sm">
          {error}
        </div>
      )}

      {success && (
        <div className="mb-3 rounded-lg bg-green-50 border border-green-200 text-green-700 px-3 py-2 text-sm">
          {success}
        </div>
      )}

      <h1 className="text-xl font-semibold mb-4 text-slate-900 dark:text-white">
        Sign in
      </h1>

      <label className="text-sm text-slate-600 dark:text-slate-300">Email</label>
      <input
        className="mt-1 mb-3 w-full rounded-lg border px-3 py-2 text-sm dark:bg-slate-800 dark:border-slate-700"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="email..."
        type="email"
        required
      />

      <label className="text-sm text-slate-600 dark:text-slate-300">
        Password
      </label>
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
