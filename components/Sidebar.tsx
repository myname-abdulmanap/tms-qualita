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

type MenuLeaf = {
  href: string;
  icon?: string;
  label: string;
  requireSuperAdmin?: boolean;
};

type MenuItem = {
  href?: string;
  icon: string;
  label: string;
  children?: MenuLeaf[];
  requireSuperAdmin?: boolean;
};

const MENU: MenuItem[] = [
  { href: "/dashboard", icon: "lucide:bar-chart-3", label: "Dashboard" },
  {
    icon: "lucide:box",
    label: "Devices",
    href: "/devices",
    children: [
      {
        href: "/devices",
        icon: "lucide:layout-dashboard",
        label: "Device Management",
      },
      {
        href: "/ota",
        icon: "lucide:cloud-download",
        label: "OTA Update",
      },
    ],
  },
  {
    icon: "lucide:nfc",
    label: "Qipay",
    href: "/qipay",
    children: [
      {
        href: "/qipay",
        icon: "lucide:radio",
        label: "Qipay Devices",
      },
    ],
  },
  { href: "/transactions", icon: "lucide:receipt", label: "Transactions" },
  {
    href: "/settlements",
    icon: "lucide:landmark",
    label: "Settlement & Saldo",
  },
  { href: "/merchants", icon: "lucide:shopping-cart", label: "Merchants" },
  { href: "/users", icon: "lucide:users", label: "Users" },
  {
    href: "/clients",
    icon: "lucide:building-2",
    label: "Clients",
    requireSuperAdmin: true,
  },
  {
    href: "/roles",
    icon: "lucide:shield",
    label: "Roles",
    requireSuperAdmin: true,
  },
  {
    href: "/payment-gateways",
    icon: "lucide:credit-card",
    label: "Payment Gateways",
    requireSuperAdmin: true,
  },
  { href: "/profile", icon: "lucide:user-cog", label: "Profil Saya" },
];

type SidebarBodyProps = {
  sidebarOpen: boolean;
  isMobile: boolean;
  darkMode: boolean;
  logoutOpen: boolean;
  setSidebarOpen: (v: boolean) => void;
  isActive: (href: string) => boolean;
  doLogout: () => Promise<void>;
  loading: boolean;

  mode: "fixed" | "capture";
  // z-index strings
  overlayZ: string;
  sidebarZ: string;
  dialogZ: string;

  docHeight?: number | null;
  userInfo?: any;
};

function SidebarBody(props: SidebarBodyProps) {
  const {
    sidebarOpen,
    isMobile,
    darkMode,
    logoutOpen,
    setSidebarOpen,
    isActive,
    doLogout,
    loading,
    mode,
    overlayZ,
    sidebarZ,
    dialogZ,
    docHeight,
    userInfo,
  } = props;

  const showOverlay = isMobile && sidebarOpen && mode === "fixed";

  return (
    <>
      {showOverlay && (
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
          // Posisi:
          // - mode fixed => fixed
          // - mode capture (desktop) => absolute supaya ikut panjang dokumen
          mode === "fixed" ? "fixed left-0 top-0" : "absolute left-0 top-0",
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
          paddingBottom: "env(safe-area-inset-bottom)",
          // Saat capture desktop, pakai tinggi dokumen supaya sidebar “full”
          height:
            mode === "capture" && !isMobile
              ? (docHeight ?? undefined)
              : undefined,
        }}
        aria-hidden={mode === "capture" ? undefined : undefined}
      >
        {/* Close btn mobile (hanya di mode fixed) */}
        {isMobile && sidebarOpen && mode === "fixed" && (
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
            {!isMobile && sidebarOpen && mode === "fixed" && (
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

          {sidebarOpen || isMobile ? (
            <div className="flex items-center gap-2.5 p-2.5 rounded-lg bg-white/10 backdrop-blur-sm hover:bg-white/15 transition-all duration-200 cursor-pointer group animate-fadeIn">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
                <Icon
                  icon="lucide:user-circle"
                  className="w-5 h-5 text-white"
                />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-xs truncate">
                  {userInfo?.name
                    ? (console.log("📍 Rendering name:", userInfo.name),
                      userInfo.name.toUpperCase())
                    : (console.log(
                        "📍 userInfo?.name is falsy:",
                        userInfo?.name,
                      ),
                      "LOADING...")}
                </p>
                <p className="text-[10px] text-indigo-200">
                  {userInfo?.roleName || "..."}
                </p>
              </div>
            </div>
          ) : (
            !isMobile && (
              <div className="flex justify-center">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center hover:scale-110 transition-transform duration-200 cursor-pointer">
                  <Icon
                    icon="lucide:user-circle"
                    className="w-5 h-5 text-white"
                  />
                </div>
              </div>
            )
          )}
        </div>

        {/* Nav utama */}
        <NavMenu
          menu={MENU}
          sidebarOpen={sidebarOpen}
          isMobile={isMobile}
          isActive={isActive}
          closeSidebar={() => isMobile && props.setSidebarOpen(false)}
          userInfo={props.userInfo}
        />

        {/* Logout */}
        <div
          className={`${
            mode === "fixed" ? "sticky bottom-3 z-[95]" : ""
          } mt-3 pt-3 border-t border-white/10 pb-2`}
          style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
        >
          <AlertDialog
            // di mode capture, jangan buka dialog (tetap render supaya layout sama)
            open={mode === "fixed" ? undefined : false}
            onOpenChange={mode === "fixed" ? undefined : () => {}}
          >
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

            {/* Dialog di atas overlay & sidebar */}
            <AlertDialogContent
              className={`${darkMode ? "dark" : ""} ${dialogZ}`}
            >
              <AlertDialogHeader>
                <AlertDialogTitle>Logout dari QUALITA TMS?</AlertDialogTitle>
                <AlertDialogDescription>
                  Kamu akan keluar dari sesi saat ini. Kamu bisa login lagi
                  kapan saja.
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

// =========================
// Nav Menu + Dropdown Logic
// =========================
function NavMenu({
  menu,
  sidebarOpen,
  isMobile,
  isActive,
  closeSidebar,
  userInfo,
}: {
  menu: MenuItem[];
  sidebarOpen: boolean;
  isMobile: boolean;
  isActive: (href: string) => boolean;
  closeSidebar: () => void;
  userInfo?: any;
}) {
  const pathname = usePathname();

  // Filter menu: hide requireSuperAdmin items if not super admin
  const isSuperAdmin = !userInfo?.clientId;
  const filteredMenu = menu.filter((m) => {
    if (m.requireSuperAdmin && !isSuperAdmin) {
      return false;
    }
    return true;
  });

  // Buka otomatis dropdown yang match route saat ini
  const initiallyOpen = useMemo(() => {
    const open: Record<string, boolean> = {};
    filteredMenu.forEach((m) => {
      if (m.children && m.children.length > 0) {
        const anyActive =
          (m.href && pathname.startsWith(m.href + "/")) ||
          m.children.some(
            (c) => pathname === c.href || pathname.startsWith(c.href + "/"),
          );
        if (anyActive) open[m.label] = true;
      }
    });
    return open;
  }, [filteredMenu, pathname]);

  const [openMap, setOpenMap] =
    useState<Record<string, boolean>>(initiallyOpen);

  const toggle = (key: string) => setOpenMap((s) => ({ ...s, [key]: !s[key] }));

  return (
    <nav className={`space-y-1 ${!isMobile ? "flex-1" : ""}`}>
      {filteredMenu.map((m) => {
        const active = m.href ? isActive(m.href) : false;
        const hasChildren = !!m.children?.length;
        const isOpen = !!openMap[m.label];

        // Jika tidak punya children -> link biasa
        if (!hasChildren) {
          return (
            <Link
              key={m.href || m.label}
              href={m.href || "#"}
              className="block"
              onClick={closeSidebar}
            >
              <MenuRow
                icon={m.icon}
                label={m.label}
                active={active}
                sidebarOpen={sidebarOpen}
              />
            </Link>
          );
        }

        // Punya children -> tombol toggle (saat sidebarOpen),
        // kalau sidebar collapsed, klik parent akan navigate ke href (overview)
        return (
          <div key={m.label} className="block">
            {sidebarOpen ? (
              <button
                type="button"
                aria-expanded={isOpen}
                onClick={() => toggle(m.label)}
                className="w-full text-left"
              >
                <MenuRow
                  icon={m.icon}
                  label={m.label}
                  active={
                    // active kalau berada pada subtree
                    pathname.startsWith((m.href || "") + "/") ||
                    (m.href ? pathname === m.href : false) ||
                    m.children!.some(
                      (c) =>
                        pathname === c.href ||
                        pathname.startsWith(c.href + "/"),
                    )
                  }
                  sidebarOpen={sidebarOpen}
                  withChevron
                  chevronOpen={isOpen}
                />
              </button>
            ) : (
              <Link
                href={m.href || "#"}
                className="block"
                onClick={closeSidebar}
              >
                <MenuRow
                  icon={m.icon}
                  label={m.label}
                  active={active}
                  sidebarOpen={sidebarOpen}
                />
              </Link>
            )}

            {/* Children */}
            {sidebarOpen && (
              <div
                className={`overflow-hidden transition-[max-height,opacity] duration-300 ease-out ${
                  isOpen ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
                }`}
              >
                <ul className="mt-1 pl-8 pr-2 space-y-1">
                  {m.children!.map((c) => {
                    const cActive = isActive(c.href);
                    return (
                      <li key={c.href}>
                        <Link
                          href={c.href}
                          onClick={closeSidebar}
                          className="block"
                        >
                          <span
                            className={`relative w-full flex items-center gap-2 px-2 py-1.5 rounded-md transition-all duration-300 ease-out group overflow-hidden ${
                              cActive
                                ? "bg-white/20 text-white shadow backdrop-blur-sm"
                                : "text-indigo-100"
                            }`}
                          >
                            {c.icon && (
                              <Icon
                                icon={c.icon}
                                className={`w-4 h-4 relative z-10 transition-all duration-300 ease-out ${
                                  cActive
                                    ? "drop-shadow-[0_0_8px_rgba(255,255,255,0.5)]"
                                    : "group-hover:scale-110 group-hover:rotate-[4deg] group-hover:drop-shadow-[0_2px_8px_rgba(255,255,255,0.4)]"
                                }`}
                              />
                            )}
                            <span className="text-[12px] font-medium">
                              {c.label}
                            </span>
                          </span>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}
          </div>
        );
      })}
    </nav>
  );
}

function MenuRow({
  icon,
  label,
  active,
  sidebarOpen,
  withChevron,
  chevronOpen,
}: {
  icon: string;
  label: string;
  active: boolean;
  sidebarOpen: boolean;
  withChevron?: boolean;
  chevronOpen?: boolean;
}) {
  return (
    <span
      className={`relative w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg transition-all duration-300 ease-out group overflow-hidden ${
        !sidebarOpen ? "justify-center" : ""
      } ${active ? "bg-white/25 text-white shadow-lg backdrop-blur-sm scale-[1.02]" : "text-indigo-100"}`}
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
        icon={icon}
        className={`w-[18px] h-[18px] relative z-10 transition-all duration-300 ease-out ${
          active
            ? "drop-shadow-[0_0_8px_rgba(255,255,255,0.5)]"
            : "group-hover:scale-125 group-hover:rotate-[8deg] group-hover:drop-shadow-[0_2px_8px_rgba(255,255,255,0.4)]"
        }`}
      />

      {sidebarOpen && (
        <span
          className={`font-medium flex-1 text-left text-xs relative z-10 transition-all duration-300 ease-out ${
            !active && "group-hover:translate-x-2 group-hover:text-white"
          }`}
        >
          {label}
        </span>
      )}

      {withChevron && sidebarOpen && (
        <Icon
          icon="lucide:chevron-down"
          className={`w-4 h-4 mr-1 transition-transform duration-200 ${chevronOpen ? "rotate-180" : "rotate-0"}`}
        />
      )}
    </span>
  );
}

export function Sidebar() {
  const { darkMode, sidebarOpen, setSidebarOpen, isMobile } = useUi();
  const pathname = usePathname();
  const router = useRouter();
  const search = useSearchParams();

  const [logoutOpen, setLogoutOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [userInfo, setUserInfo] = useState<any>(null);

  const captureMode = useMemo(() => search?.get("capture") === "1", [search]);
  const [docHeight, setDocHeight] = useState<number | null>(null);

  // Get user info from JWT
  useEffect(() => {
    const getUser = async () => {
      try {
        console.log("🔄 Fetching /api/me...");
        const res = await fetch("/api/me");
        console.log("📦 /api/me response status:", res.status);
        const data = await res.json();
        console.log("👤 User info received:", data);
        console.log(
          "👤 Setting state with name:",
          data.name,
          "role:",
          data.roleName,
        );
        setUserInfo(data);
        console.log("✅ State updated with userInfo");
      } catch (error) {
        console.error("❌ Error fetching user:", error);
      }
    };
    getUser();
  }, []);

  // Debug: Monitor userInfo state changes
  useEffect(() => {
    console.log("🎯 userInfo state changed:", userInfo);
  }, [userInfo]);

  useEffect(() => {
    if (!captureMode || isMobile) return;
    const measure = () =>
      setDocHeight(
        Math.max(
          document.documentElement.scrollHeight,
          document.body.scrollHeight,
        ),
      );
    measure();
    const onResize = () => measure();
    window.addEventListener("resize", onResize);
    const ro = new ResizeObserver(measure);
    ro.observe(document.documentElement);
    return () => {
      window.removeEventListener("resize", onResize);
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

  // Z-index rules
  const overlayZ = isMobile && sidebarOpen ? "z-[80]" : "z-40";
  const sidebarZ =
    isMobile && sidebarOpen
      ? logoutOpen
        ? "z-[100]"
        : "z-[90]"
      : logoutOpen
        ? "z-[60]"
        : "z-50";
  const dialogZ = "z-[110]";

  return (
    <>
      {/* Sidebar normal (fixed). Saat capture desktop, kita sembunyikan supaya tidak double. */}
      <div className={captureMode && !isMobile ? "hidden" : "contents"}>
        <SidebarBody
          mode="fixed"
          sidebarOpen={sidebarOpen}
          isMobile={isMobile}
          darkMode={darkMode}
          logoutOpen={logoutOpen}
          setSidebarOpen={setSidebarOpen}
          isActive={isActive}
          doLogout={doLogout}
          loading={loading}
          overlayZ={overlayZ}
          sidebarZ={sidebarZ}
          dialogZ={dialogZ}
          userInfo={userInfo}
        />
      </div>

      {/* Sidebar clone untuk full-page screenshot (desktop saja) */}
      {captureMode && !isMobile && (
        <SidebarBody
          mode="capture"
          sidebarOpen={sidebarOpen}
          isMobile={false}
          darkMode={darkMode}
          logoutOpen={false}
          setSidebarOpen={() => {}}
          isActive={isActive}
          doLogout={async () => {}}
          loading={false}
          overlayZ="z-0"
          sidebarZ="z-[1]"
          dialogZ="z-[2]"
          docHeight={docHeight}
          userInfo={userInfo}
        />
      )}
    </>
  );
}
