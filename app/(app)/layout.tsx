// app/(app)/layout.tsx
import { Sidebar } from "@/components/Sidebar";
import { Header } from "@/components/Header";
import { LayoutContent } from "@/components/LayoutContent";
import { TMSToggle } from "@/components/TMSToggle";

export const dynamic = "force-dynamic";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen relative">
      <Sidebar />
      <TMSToggle />
      <LayoutContent>
        <Header />
        <main className="p-3 lg:p-4">{children}</main>
      </LayoutContent>
    </div>
  );
}
