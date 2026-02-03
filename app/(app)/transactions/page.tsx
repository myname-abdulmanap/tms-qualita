import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import TransactionTable from "@/components/transactions/transaction-table";
export const dynamic = "force-dynamic";


export default async function TransactionsPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get("session")?.value;

  if (!token) {
    redirect("/login");
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Transactions</h1>
        <p className="text-gray-500 mt-2">View and manage transactions</p>
      </div>
      <TransactionTable />
    </div>
  );
}
