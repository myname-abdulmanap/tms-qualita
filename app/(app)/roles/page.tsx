import RoleTable from "@/components/roles/role-table";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
export const dynamic = "force-dynamic";
export const revalidate = 0;


function decodeJWT(token: string) {
  try {
    return JSON.parse(Buffer.from(token.split(".")[1], "base64").toString());
  } catch {
    return null;
  }
}

export default async function RolesPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get("session")?.value;

  if (!token) {
    redirect("/login");
  }

  const payload = decodeJWT(token);

  if (!payload) {
    redirect("/login");
  }

  // Only super admin (vendor/platform) can access - check if no clientId
  if (payload.clientId) {
    redirect("/403");
  }

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Role Management</h1>
        <p className="text-gray-600 mt-2">
          Create and manage user roles with custom permissions
        </p>
      </div>

      <RoleTable />
    </div>
  );
}
