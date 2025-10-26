// lib/ui-store.tsx
"use client";
import React, { createContext, useContext, useEffect, useMemo, useState } from "react";

type UiState = {
  darkMode: boolean;
  setDarkMode: (v: boolean) => void;
  sidebarOpen: boolean;
  setSidebarOpen: (v: boolean) => void;
  isMobile: boolean;
};

const UiCtx = createContext<UiState | null>(null);

export function UiProvider({ children }: { children: React.ReactNode }) {
  const [darkMode, setDarkMode] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Deteksi mobile + auto-close sidebar
  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 1024;
      setIsMobile(mobile);
      if (mobile) setSidebarOpen(false);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Apply class dark ke html
  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle("dark", darkMode);
    // atur wrapper margin kiri
    const wrapper = document.getElementById("app-content-wrapper");
    if (!wrapper) return;
    wrapper.style.marginLeft = isMobile ? "0px" : sidebarOpen ? "16rem" : "5rem"; // 64 / 20
  }, [darkMode, sidebarOpen, isMobile]);

  const value = useMemo(
    () => ({ darkMode, setDarkMode, sidebarOpen, setSidebarOpen, isMobile }),
    [darkMode, sidebarOpen, isMobile]
  );

  return <UiCtx.Provider value={value}>{children}</UiCtx.Provider>;
}

export function useUi() {
  const ctx = useContext(UiCtx);
  if (!ctx) throw new Error("useUi must be used within UiProvider");
  return ctx;
}
