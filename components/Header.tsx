// components/Header.tsx
"use client";
import { useEffect, useState } from "react";
import { Menu, Calendar, Moon, Sun, Clock } from "lucide-react";
import { useUi } from "@/lib/ui-store";
import NotificationBell from "@/components/NotificationBell";

export function Header() {
  const { darkMode, setDarkMode, isMobile, setSidebarOpen } = useUi();
  const [time, setTime] = useState<string>("");

  useEffect(() => {
    // Set initial time
    const updateTime = () => {
      const now = new Date();
      setTime(
        now.toLocaleTimeString("id-ID", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        }),
      );
    };

    updateTime();

    // Update every second
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header
      className={`${darkMode ? "bg-slate-900/80" : "bg-white/80"} 
      backdrop-blur-xl border-b ${darkMode ? "border-slate-800" : "border-slate-200"} 
      sticky top-0 z-[50]`}
    >
      <div className="flex items-center justify-between px-3 lg:px-4 py-2.5">
        <div className="flex items-center gap-2.5">
          {/* Mobile menu button */}
          {isMobile && (
            <button
              onClick={() => setSidebarOpen(true)}
              className={`p-1.5 rounded-lg ${darkMode ? "hover:bg-slate-800" : "hover:bg-slate-100"} transition-colors`}
              aria-label="Open sidebar"
            >
              <Menu
                className={`w-[18px] h-[18px] ${darkMode ? "text-white" : "text-slate-900"}`}
              />
            </button>
          )}

          <h1
            className={`text-sm lg:text-base font-bold ${darkMode ? "text-white" : "text-slate-900"}`}
          >
            Dashboard
          </h1>
        </div>

        <div className="flex items-center gap-1.5">
          {!isMobile && (
            <>
              <div
                className={`hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg ${darkMode ? "bg-slate-800" : "bg-slate-100"} hover:scale-105 transition-transform duration-200`}
              >
                <Calendar
                  className={`w-3.5 h-3.5 ${darkMode ? "text-slate-400" : "text-slate-600"}`}
                />
                <span
                  className={`text-[11px] font-medium ${darkMode ? "text-slate-300" : "text-slate-700"}`}
                >
                  {new Date().toLocaleDateString("id-ID", {
                    weekday: "short",
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                  })}
                </span>
              </div>

              <div
                className={`hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg ${darkMode ? "bg-slate-800" : "bg-slate-100"} hover:scale-105 transition-transform duration-200`}
              >
                <Clock
                  className={`w-3.5 h-3.5 ${darkMode ? "text-slate-400" : "text-slate-600"}`}
                />
                <span
                  className={`text-[11px] font-mono font-semibold ${darkMode ? "text-slate-300" : "text-slate-700"}`}
                >
                  {time || "--:--:--"}
                </span>
              </div>
            </>
          )}

          <NotificationBell variant="header" darkMode={darkMode} />

          <button
            onClick={() => setDarkMode(!darkMode)}
            className={`p-1.5 rounded-lg ${darkMode ? "bg-slate-800" : "bg-slate-100"} transition-all hover:scale-110 hover:rotate-12 duration-200`}
            aria-label={
              darkMode ? "Switch to light mode" : "Switch to dark mode"
            }
          >
            {darkMode ? (
              <Sun className="w-[18px] h-[18px] text-yellow-500" />
            ) : (
              <Moon className="w-[18px] h-[18px] text-slate-600" />
            )}
          </button>
        </div>
      </div>
    </header>
  );
}
