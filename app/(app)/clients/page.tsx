import ClientTable from "@/components/clients/client-table";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
export const dynamic = "force-dynamic";


function decodeJWT(token: string) {
  try {
    return JSON.parse(
      Buffer.from(token.split(".")[1], "base64").toString()
    );
  } catch {
    return null;
  }
}

export default async function ClientsPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get("session")?.value;
  
  if (!token) {
    redirect("/login");
  }

  const payload = decodeJWT(token);
  
  // Debug log
  console.log("🔍 Client Page Access Check:", {
    clientId: payload?.clientId,
    merchantId: payload?.merchantId,
    isVendor: payload?.clientId === null && payload?.merchantId === null,
    permissions: payload?.permissions
  });

  // Double check di server side
  const isVendor = payload?.clientId === null && payload?.merchantId === null;
  
  if (!isVendor) {
    console.log("❌ Not a vendor, redirecting to 403");
    redirect("/403");
  }

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Clients Management</h1>
        <p className="text-gray-600 mt-2">
          Manage all your clients and organizations (Vendor Only)
        </p>
      </div>
      
      <ClientTable />
    </div>
  );
}