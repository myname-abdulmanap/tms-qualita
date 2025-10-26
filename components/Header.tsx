// components/Header.tsx
"use client";
import { Menu, Bell, Calendar, Moon, Sun } from "lucide-react";
import { useUi } from "@/lib/ui-store";

export function Header() {
  const { darkMode, setDarkMode, isMobile, setSidebarOpen } = useUi();

  return (
    <header className={`${darkMode ? "bg-slate-900/80" : "bg-white/80"} 
      backdrop-blur-xl border-b ${darkMode ? "border-slate-800" : "border-slate-200"} 
      sticky top-0 z-9999`}>
      <div className="flex items-center justify-between px-3 lg:px-4 py-2.5">
        <div className="flex items-center gap-2.5">
          {/* Mobile menu button */}
          {isMobile && (
            <button
              onClick={() => setSidebarOpen(true)}
              className={`p-1.5 rounded-lg ${darkMode ? "hover:bg-slate-800" : "hover:bg-slate-100"} transition-colors`}>
              <Menu className={`w-[18px] h-[18px] ${darkMode ? "text-white" : "text-slate-900"}`} />
            </button>
          )}
          
          <h1 className={`text-sm lg:text-base font-bold ${darkMode ? "text-white" : "text-slate-900"}`}>
            Dashboard
          </h1>
        </div>

        <div className="flex items-center gap-1.5">
          {!isMobile && (
            <div className={`hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg ${darkMode ? "bg-slate-800" : "bg-slate-100"} hover:scale-105 transition-transform duration-200`}>
              <Calendar className={`w-3.5 h-3.5 ${darkMode ? "text-slate-400" : "text-slate-600"}`} />
              <span className={`text-[11px] font-medium ${darkMode ? "text-slate-300" : "text-slate-700"}`}>
                Oct 26, 2025
              </span>
            </div>
          )}

          <button className={`p-1.5 rounded-lg ${darkMode ? "hover:bg-slate-800" : "hover:bg-slate-100"} transition-all hover:scale-110 duration-200 relative group`}>
            <Bell className={`w-[18px] h-[18px] ${darkMode ? "text-slate-300" : "text-slate-600"} group-hover:rotate-12 transition-transform duration-200`} />
            <div className="absolute top-1 right-1 w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse" />
          </button>

          <button
            onClick={() => setDarkMode(!darkMode)}
            className={`p-1.5 rounded-lg ${darkMode ? "bg-slate-800" : "bg-slate-100"} transition-all hover:scale-110 hover:rotate-12 duration-200`}>
            {darkMode ? <Sun className="w-[18px] h-[18px] text-yellow-500" /> : <Moon className="w-[18px] h-[18px] text-slate-600" />}
          </button>
        </div>
      </div>
    </header>
  );
}