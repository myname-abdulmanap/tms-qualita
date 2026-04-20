import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import EdcApkDashboard from "@/components/ota/edc-apk-dashboard";

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
        <h1 className="text-3xl font-bold tracking-tight">
          EDC Agent APK Management
        </h1>
        <p className="mt-2 text-gray-500">
          Upload dan kelola versi APK untuk aplikasi TMS Agent EDC devices.
        </p>
      </div>
      <EdcApkDashboard />
    </div>
  );
}
