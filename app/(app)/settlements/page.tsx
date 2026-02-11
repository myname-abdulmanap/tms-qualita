import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import SettlementDashboard from "@/components/settlements/settlement-dashboard";

export const dynamic = "force-dynamic";

export default async function SettlementsPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get("session")?.value;
  if (!token) {
    redirect("/login");
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          Settlement & Saldo
        </h1>
        <p className="text-gray-500 mt-2">
          Kelola settlement transaksi dan saldo merchant
        </p>
      </div>
      <SettlementDashboard />
    </div>
  );
}
