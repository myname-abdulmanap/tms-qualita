"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Icon } from "@iconify/react";

export default function LoginPage() {
  return (
    <div className="min-h-screen flex font-[family-name:var(--font-jakarta-sans)]">
      {/* Left Side - Hero Section */}
      <div className="hidden lg:flex lg:w-[55%] xl:w-[60%] relative bg-slate-900">
        {/* Background Pattern */}
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_110%)]" />
        </div>

        {/* Accent Gradient */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-500/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-cyan-500/8 rounded-full blur-[100px]" />

        {/* Content */}
        <div className="relative z-10 flex flex-col h-full w-full p-10 xl:p-14">
          {/* Logo */}
          <div className="flex items-center gap-3 mt-4 animate-[fadeInDown_0.6s_ease-out]">
            <div className="w-10 h-10 rounded-lg bg-indigo-600 flex items-center justify-center">
              <Icon icon="wpf:android" className="w-6 h-6 text-white" />
            </div>
            <span className="text-white font-semibold text-lg tracking-tight">
              Qualita TMS
            </span>
          </div>

          {/* Main Content - Centered */}
          <div className="flex-1 flex flex-col justify-center max-w-xl">
            <div className="mb-8 animate-[fadeInUp_0.7s_ease-out_0.2s_both]">
              <h1 className="text-4xl xl:text-5xl font-bold text-white leading-[1.15] tracking-tight mb-5">
                Kelola perangkat
                <br />
                <span className="text-slate-400">pembayaran Anda</span>
              </h1>

              <p className="text-slate-400 text-base leading-relaxed">
                Pantau status perangkat, lacak lokasi, dan kelola transaksi dari
                satu dashboard yang terintegrasi.
              </p>
            </div>

            {/* Stats */}
            <div className="flex gap-10 pt-8 border-t border-slate-800 animate-[fadeInUp_0.7s_ease-out_0.4s_both]">
              <div>
                <div className="text-3xl font-bold text-white">500+</div>
                <div className="text-sm text-slate-500 mt-1">
                  Perangkat aktif
                </div>
              </div>
              <div>
                <div className="text-3xl font-bold text-white">99.9%</div>
                <div className="text-sm text-slate-500 mt-1">Uptime sistem</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-white">24/7</div>
                <div className="text-sm text-slate-500 mt-1">Monitoring</div>
              </div>
            </div>
          </div>

          {/* Bottom - Testimonial/Trust */}
          <div className="mt-auto pt-8 border-t border-slate-800/50 animate-[fadeIn_0.8s_ease-out_0.6s_both]">
            <div className="flex items-center gap-4">
              <div className="flex -space-x-2">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-400 to-indigo-600 border-2 border-slate-900 flex items-center justify-center text-[10px] font-bold text-white">
                  AB
                </div>
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 border-2 border-slate-900 flex items-center justify-center text-[10px] font-bold text-white">
                  CD
                </div>
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 border-2 border-slate-900 flex items-center justify-center text-[10px] font-bold text-white">
                  EF
                </div>
              </div>
              <div>
                <div className="text-white text-sm font-medium">
                  Dipercaya oleh 50+ merchant
                </div>
                <div className="text-slate-500 text-xs">
                  di seluruh Indonesia
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="w-full lg:w-[45%] xl:w-[40%] flex items-center justify-center p-6 sm:p-10 bg-white dark:bg-slate-950">
        <Suspense
          fallback={
            <div className="text-sm text-slate-500 flex items-center gap-2">
              <Icon icon="mdi:loading" className="w-4 h-4 animate-spin" />
              Memuat...
            </div>
          }
        >
          <LoginClient />
        </Suspense>
      </div>
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
  const [showPwd, setShowPwd] = useState(false);

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
    <div className="w-full max-w-sm">
      {/* Logo */}
      <div className="mb-6 animate-[fadeInDown_0.5s_ease-out]">
        <img
          src="https://qualita-indonesia.com/assets/img/qualita_indonesia_logo.png"
          alt="Qualita Indonesia"
          className="h-24 w-auto"
        />
      </div>

      {/* Header */}
      <div className="mb-8 animate-[fadeInUp_0.5s_ease-out]">
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
          Masuk ke akun
        </h2>
        <p className="text-slate-500 dark:text-slate-400 text-sm mt-2">
          Silakan masukkan kredensial Anda
        </p>
      </div>

      <form
        onSubmit={onSubmit}
        className="space-y-5 animate-[fadeInUp_0.6s_ease-out_0.1s_both]"
      >
        {/* Error Alert */}
        {error && (
          <div className="rounded-lg bg-red-50 dark:bg-red-950/50 border border-red-100 dark:border-red-900 text-red-600 dark:text-red-400 px-4 py-3 text-sm flex items-start gap-3">
            <Icon
              icon="mdi:alert-circle"
              className="w-5 h-5 flex-shrink-0 mt-0.5"
            />
            <span>{error}</span>
          </div>
        )}

        {/* Success Alert */}
        {success && (
          <div className="rounded-lg bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-100 dark:border-emerald-900 text-emerald-600 dark:text-emerald-400 px-4 py-3 text-sm flex items-start gap-3">
            <Icon
              icon="mdi:check-circle"
              className="w-5 h-5 flex-shrink-0 mt-0.5"
            />
            <span>{success}</span>
          </div>
        )}

        {/* Email Field */}
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
            Email
          </label>
          <input
            className="w-full h-11 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-colors"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="nama@perusahaan.com"
            type="email"
            required
            autoComplete="email"
          />
        </div>

        {/* Password Field */}
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
            Password
          </label>
          <div className="relative">
            <input
              className="w-full h-11 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 pr-11 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-colors"
              value={pwd}
              onChange={(e) => setPwd(e.target.value)}
              placeholder="Masukkan password"
              type={showPwd ? "text" : "password"}
              required
              autoComplete="current-password"
            />
            <button
              type="button"
              onClick={() => setShowPwd(!showPwd)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
            >
              <Icon
                icon={showPwd ? "mdi:eye-off-outline" : "mdi:eye-outline"}
                className="w-5 h-5"
              />
            </button>
          </div>
        </div>

        {/* Submit Button */}
        <button
          disabled={loading}
          className="w-full h-11 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <Icon icon="mdi:loading" className="w-4 h-4 animate-spin" />
              Memproses...
            </>
          ) : (
            "Masuk"
          )}
        </button>
      </form>

      {/* Footer */}
      <p className="text-center text-xs text-slate-400 mt-8 animate-[fadeIn_0.7s_ease-out_0.3s_both]">
        © 2026 Qualita Indonesia
      </p>
    </div>
  );
}
