// app/layout.tsx
import type { Metadata } from "next";
import "../globals.css";
import { UiProvider } from "@/lib/ui-store";
import { Sidebar } from "@/components/Sidebar";
import { Header } from "@/components/Header";
import { LayoutContent } from "@/components/LayoutContent";
import { TMSToggle } from "@/components/TMSToggle";

export const metadata: Metadata = {
  title: "QUALITA TMS",
  description: "Terminal Management System",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <UiProvider>
          <div className="min-h-screen relative">
            <Sidebar />
            <TMSToggle />
            <LayoutContent>
              <Header />
              <main className="p-3 lg:p-4">{children}</main>
            </LayoutContent>
          </div>
        </UiProvider>
      </body>
    </html>
  );
}
