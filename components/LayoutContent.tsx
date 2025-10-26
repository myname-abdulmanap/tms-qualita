// components/LayoutContent.tsx
"use client";

import { useUi } from "@/lib/ui-store";

export function LayoutContent({ children }: { children: React.ReactNode }) {
  const { sidebarOpen, isMobile } = useUi();

  return (
    <div
      className={`transition-all duration-300 ease-in-out
        ${isMobile 
          ? "ml-0" 
          : sidebarOpen 
            ? "ml-56" 
            : "ml-16"
        }`}
    >
      {children}
    </div>
  );
}