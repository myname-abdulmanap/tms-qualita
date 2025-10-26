// components/Sidebar.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useUi } from "@/lib/ui-store";
import { Icon } from "@iconify/react";

import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";

// Tip: pakai nama ikon dari koleksi Iconify (lucide, mdi, solar, dst.)
// https://icon-sets.iconify.design/
type MenuItem = { href: string; icon: string; label: string };

const MENU: MenuItem[] = [
  { href: "/dashboard", icon: "lucide:bar-chart-3", label: "Dashboard" },
  { href: "/devices", icon: "lucide:box", label: "Devices" },
  { href: "/stores", icon: "lucide:store", label: "Stores" },
  { href: "/groups", icon: "lucide:package", label: "Device Groups" },
  { href: "/users", icon: "lucide:users", label: "Users" },
];

export function Sidebar() {
  const { darkMode, sidebarOpen, setSidebarOpen, isMobile } = useUi();
  const pathname = usePathname();
  const router = useRouter();
  const search = useSearchParams();

  const [logoutOpen, setLogoutOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  // ====== MODE SCREENSHOT ======
  // Aktifkan dengan menambahkan ?capture=1 pada URL
  const captureMode = useMemo(() => search?.get("capture") === "1", [search]);
  const [docHeight, setDocHeight] = useState<number | null>(null);

  useEffect(() => {
    if (!captureMode || isMobile) return;
    // ukur tinggi dokumen supaya sidebar bisa "ikut panjang" saat full-page screenshot
    const measure = () =>
      setDocHeight(
        Math.max(
          document.documentElement.scrollHeight,
          document.body.scrollHeight
        )
      );
    measure();
    window.addEventListener("resize", measure);
    // kalau konten dinamis, observer bantu update tinggi
    const ro = new ResizeObserver(measure);
    ro.observe(document.documentElement);
    return () => {
      window.removeEventListener("resize", measure);
      ro.disconnect();
    };
  }, [captureMode, isMobile]);

  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(href + "/");

  async function doLogout() {
    try {
      setLoading(true);
      await fetch("/api/logout", { method: "POST" });
    } finally {
      setLoading(false);
      setLogoutOpen(false);
      router.replace("/login");
    }
  }

  // Z-index rules (pastikan sidebar > header saat mobile)
  const overlayZ = isMobile && sidebarOpen ? "z-[80]" : "z-40";
  const sidebarZ =
    isMobile && sidebarOpen ? (logoutOpen ? "z-[100]" : "z-[90]") : logoutOpen ? "z-[60]" : "z-50";
  const dialogZ = "z-[110]";

  return (
    <>
      {/* Overlay mobile: matikan saat capture mode (biar bersih) */}
      {isMobile && sidebarOpen && !captureMode && (
        <div
          className={`fixed inset-0 bg-black/50 lg:hidden ${overlayZ}`}
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside
        className={[
          // Width & slide behavior
          isMobile
            ? sidebarOpen
              ? "translate-x-0 w-64"
              : "-translate-x-full w-64"
            : sidebarOpen
            ? "w-56"
            : "w-16",
          // Base layout: saat captureMode (desktop) → absolute; normalnya → fixed
          captureMode && !isMobile ? "absolute left-0 top-0" : "fixed left-0 top-0",
          "min-h-screen flex flex-col",
          "transition-all duration-300 ease-in-out",
          // Background
          darkMode
            ? "bg-slate-900"
            : "bg-gradient-to-br from-indigo-600 via-indigo-700 to-indigo-800",
          "text-white",
          // Padding
          sidebarOpen ? "p-3" : "lg:p-3 p-0",
          // Elevation & stacking
          sidebarZ,
          "shadow-2xl",
          // Scroll (tetap diaktifkan untuk mobile/offcanvas)
          "overflow-y-auto",
        ].join(" ")}
        style={{
          // Safe area bottom padding (iOS notch)
          paddingBottom: "env(safe-area-inset-bottom)",
          // Saat captureMode di desktop, pakai tinggi dokumen supaya sidebar ikut panjang di full-page screenshot
          height: captureMode && !isMobile ? (docHeight ?? undefined) : undefined,
        }}
      >
        {/* Close btn mobile (matikan saat capture mode) */}
        {isMobile && sidebarOpen && !captureMode && (
          <button
            onClick={() => setSidebarOpen(false)}
            className="absolute right-3 top-3 w-7 h-7 bg-white/10 rounded-lg flex items-center justify-center hover:bg-white/20 transition-colors lg:hidden"
            aria-label="Close sidebar"
          >
            <Icon icon="lucide:x" className="w-4 h-4 text-white" />
          </button>
        )}

        {/* Brand + user */}
        <div className="mb-5">
          <div
            className={`flex items-center gap-2.5 mb-4 ${
              !sidebarOpen && !isMobile ? "justify-center" : "justify-between"
            }`}
          >
            <div className="flex items-center gap-2.5">
              {/* Logo */}
              <div className="w-8 h-8 rounded-xl bg-transparent flex items-center justify-center group">
                <Icon
                  icon="wpf:android"
                  className="w-6 h-6 text-white transition-all duration-300
                  group-hover:animate-[spin_0.6s_ease]
                  group-hover:scale-110 group-hover:rotate-[10deg]
                  group-hover:drop-shadow-[0_4px_12px_rgba(255,255,255,0.35)]"
                />
              </div>

              {(sidebarOpen || isMobile) && (
                <div className="animate-fadeIn">
                  <h1 className="text-base font-bold">QUALITA TMS</h1>
                  <p className="text-[10px] text-indigo-200">Device Manager</p>
                </div>
              )}
            </div>

            {/* Toggle close (desktop) */}
            {!isMobile && sidebarOpen && !captureMode && (
              <button
                onClick={() => setSidebarOpen(false)}
                className="w-6 h-6 bg-white/10 rounded-lg flex items-center justify-center hover:bg-white/20 transition-all duration-200 hover:rotate-90 group"
                aria-label="Collapse sidebar"
              >
                <Icon
                  icon="lucide:chevron-right"
                  className="w-3.5 h-3.5 text-white group-hover:scale-110 transition-transform duration-200"
                />
              </button>
            )}
          </div>

          {(sidebarOpen || isMobile) ? (
            <div className="flex items-center gap-2.5 p-2.5 rounded-lg bg-white/10 backdrop-blur-sm hover:bg-white/15 transition-all duration-200 cursor-pointer group animate-fadeIn">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
                <Icon icon="lucide:user-circle" className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-xs truncate">ABDUL M.</p>
                <p className="text-[10px] text-indigo-200">Administrator</p>
              </div>
            </div>
          ) : (
            !isMobile && (
              <div className="flex justify-center">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center hover:scale-110 transition-transform duration-200 cursor-pointer">
                  <Icon icon="lucide:user-circle" className="w-5 h-5 text-white" />
                </div>
              </div>
            )
          )}
        </div>

        {/* Nav utama */}
        <nav className={`space-y-1 ${!isMobile ? "flex-1" : ""}`}>
          {MENU.map((m) => {
            const active = isActive(m.href);
            return (
              <Link
                key={m.href}
                href={m.href}
                className="block"
                onClick={() => {
                  if (isMobile) setSidebarOpen(false);
                }}
              >
                <span
                  className={`relative w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg transition-all duration-300 ease-out group overflow-hidden
                    ${!sidebarOpen && !isMobile ? "justify-center" : ""}
                    ${
                      active
                        ? "bg-white/25 text-white shadow-lg backdrop-blur-sm scale-[1.02]"
                        : "text-indigo-100"
                    }`}
                  aria-current={active ? "page" : undefined}
                >
                  {!active && (
                    <>
                      <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/15 to-white/0 opacity-0 group-hover:opacity-100 transition-all duration-500" />
                      <div className="absolute inset-0 rounded-lg border border-white/0 group-hover:border-white/30 transition-all duration-300" />
                    </>
                  )}
                  {active && (
                    <div className="absolute inset-0 bg-gradient-to-r from-white/5 via-white/10 to-white/5 animate-pulse" />
                  )}
                  {!active && (
                    <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out bg-gradient-to-r from-transparent via-white/25 to-transparent" />
                  )}

                  <Icon
                    icon={m.icon}
                    className={`w-[18px] h-[18px] relative z-10 transition-all duration-300 ease-out
                      ${
                        active
                          ? "drop-shadow-[0_0_8px_rgba(255,255,255,0.5)]"
                          : "group-hover:scale-125 group-hover:rotate-[8deg] group-hover:drop-shadow-[0_2px_8px_rgba(255,255,255,0.4)]"
                      }`}
                  />

                  {(sidebarOpen || isMobile) && (
                    <span
                      className={`font-medium flex-1 text-left text-xs relative z-10 transition-all duration-300 ease-out
                        ${!active && "group-hover:translate-x-2 group-hover:text-white"}`}
                    >
                      {m.label}
                    </span>
                  )}
                </span>
              </Link>
            );
          })}
        </nav>

        {/* Logout */}
        <div
          className={`${
            captureMode && !isMobile ? "" : "sticky bottom-3 z-[95]"
          } mt-3 pt-3 border-t border-white/10 pb-2`}
          style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
        >
          <AlertDialog open={logoutOpen} onOpenChange={setLogoutOpen}>
            <AlertDialogTrigger asChild>
              <button
                title="Logout"
                className={`relative w-full flex items-center px-2.5 py-2 rounded-lg transition-all duration-300 ease-out group overflow-hidden text-indigo-100
                  ${!sidebarOpen && !isMobile ? "justify-center" : "gap-2.5"}`}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-red-500/0 via-red-500/25 to-red-500/0 opacity-0 group-hover:opacity-100 transition-all duration-500" />
                <div className="absolute inset-0 rounded-lg border border-red-400/0 group-hover:border-red-400/40 transition-all duration-300" />
                <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out bg-gradient-to-r from-transparent via-white/25 to-transparent" />

                <Icon
                  icon="lucide:log-out"
                  className="w-[18px] h-[18px] relative z-10 transition-all duration-300 ease-out group-hover:scale-125 group-hover:-rotate-[15deg] group-hover:drop-shadow-[0_2px_8px_rgba(239,68,68,0.5)] group-hover:text-white"
                />

                {(sidebarOpen || isMobile) && (
                  <span className="font-medium text-xs relative z-10 transition-all duration-300 ease-out group-hover:translate-x-2 group-hover:text-white">
                    Logout
                  </span>
                )}
              </button>
            </AlertDialogTrigger>

            <AlertDialogContent className={`${darkMode ? "dark" : ""} ${dialogZ}`}>
              <AlertDialogHeader>
                <AlertDialogTitle>Logout dari QUALITA TMS?</AlertDialogTitle>
                <AlertDialogDescription>
                  Kamu akan keluar dari sesi saat ini. Kamu bisa login lagi kapan saja.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel disabled={loading}>Batal</AlertDialogCancel>
                <AlertDialogAction
                  onClick={doLogout}
                  disabled={loading}
                  className="bg-red-600 hover:bg-red-700"
                >
                  {loading ? "Logging out..." : "Logout"}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </aside>
    </>
  );
}
