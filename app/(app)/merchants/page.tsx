import MerchantTable from "@/components/merchants/merchant-table";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
export const dynamic = "force-dynamic";


function decodeJWT(token: string) {
  try {
    return JSON.parse(Buffer.from(token.split(".")[1], "base64").toString());
  } catch {
    return null;
  }
}

export default async function MerchantsPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get("session")?.value;

  if (!token) {
    redirect("/login");
  }

  const payload = decodeJWT(token);

  if (!payload) {
    redirect("/login");
  }

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Merchant Management</h1>
        <p className="text-gray-600 mt-2">
          Manage all merchants and their information
        </p>
      </div>

      <MerchantTable />
    </div>
  );
}
