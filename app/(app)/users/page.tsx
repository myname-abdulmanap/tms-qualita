import UserTable from "@/components/users/user-table";
export const dynamic = "force-dynamic";

export default function UsersPage() {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold mb-4">User Management</h1>
      <UserTable />
    </div>
  );
}
