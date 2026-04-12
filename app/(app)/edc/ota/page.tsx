import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import OtaDashboard from "@/components/ota/ota-dashboard";

export const dynamic = "force-dynamic";

export default async function EdcOtaPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get("session")?.value;

  if (!token) {
    redirect("/login");
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">EDC OTA & App Update</h1>
        <p className="mt-2 text-gray-500">
          Jalankan OTA firmware dan update aplikasi EDC setelah status device dinyatakan sehat dari halaman Device Info & Health.
        </p>
      </div>
      <OtaDashboard />
    </div>
  );
}
