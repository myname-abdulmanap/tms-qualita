// components/TMSToggle.tsx
"use client";

import { useUi } from "@/lib/ui-store";

export function TMSToggle() {
  const { sidebarOpen, setSidebarOpen, isMobile } = useUi();

 
  if (isMobile || sidebarOpen) return null;

  return (
    <button
      onClick={() => setSidebarOpen(true)}
      type="button"
      aria-label="Open sidebar"
      className="
        fixed left-2 top-2.5 z-50
        w-10 h-10      
        rounded-lg
        bg-transparent
        opacity-0        
        hover:opacity-0
        active:opacity-0
        focus:outline-none
      "
    />
  );
}
