import DeviceTable from "@/components/devices/device-table";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function EdcDevicesPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get("session")?.value;

  if (!token) {
    redirect("/login");
  }

  return (
    <div className="container mx-auto max-w-6xl p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">EDC Device Management</h1>
        <p className="mt-2 text-gray-600">
          Kelola onboarding EDC, pantau kesehatan device, lokasi, aplikasi
          terinstal, dan detail operasional dalam satu halaman.
        </p>
      </div>

      <DeviceTable mode="edc" basePath="/edc/devices" />
    </div>
  );
}
