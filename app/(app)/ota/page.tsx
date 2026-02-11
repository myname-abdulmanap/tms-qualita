import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import OtaDashboard from "@/components/ota/ota-dashboard";

export const dynamic = "force-dynamic";

export default async function OtaPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get("session")?.value;
  if (!token) {
    redirect("/login");
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">OTA Management</h1>
        <p className="text-gray-500 mt-2">
          Kelola firmware, jadwal update, dan device binding untuk Over-The-Air
          update
        </p>
      </div>
      <OtaDashboard />
    </div>
  );
}
