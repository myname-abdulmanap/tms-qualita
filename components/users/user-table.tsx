"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Icon } from "@iconify/react";
import UserDialog from "./user-dialog";

type User = {
  id: string;
  email: string;
  name: string;
  clientId?: string | null;
  merchantId?: string | null;
  role: {
    id: string;
    name: string;
    scope?: string;
  };
  createdAt?: string;
};

export default function UserTable() {
  const [users, setUsers] = useState<User[]>([]);
  const [open, setOpen] = useState(false);
  const [editUser, setEditUser] = useState<{
    id: string;
    email: string;
    name: string;
    roleId: string;
    clientId?: string | null;
  } | null>(null);
  const [loading, setLoading] = useState(false);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/users");
      if (!res.ok) throw new Error("Failed to load users");
      const data = await res.json();
      setUsers(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error loading users:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm("Yakin hapus user ini?")) return;

    try {
      const res = await fetch(`/api/users/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const error = await res.json();
        alert(error.message || "Gagal menghapus user");
        return;
      }
      loadUsers();
    } catch (error) {
      alert("Gagal menghapus user");
    }
  };

  const handleEdit = (user: User) => {
    setEditUser({
      id: user.id,
      email: user.email,
      name: user.name,
      roleId: user.role.id,
      clientId: user.clientId,
    } as any);
    setOpen(true);
  };

  const handleAdd = () => {
    setEditUser(null);
    setOpen(true);
  };

  const getUserBadge = (user: User) => {
    if (!user.clientId && !user.merchantId) {
      return (
        <span className="px-2 py-1 text-xs rounded bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300 font-medium">
          VENDOR
        </span>
      );
    }
    if (user.clientId && !user.merchantId) {
      return (
        <span className="px-2 py-1 text-xs rounded bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 font-medium">
          CLIENT
        </span>
      );
    }
    if (user.merchantId) {
      return (
        <span className="px-2 py-1 text-xs rounded bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300 font-medium">
          MERCHANT
        </span>
      );
    }
    return null;
  };

  return (
    <>
      <div className="mb-4 flex justify-between items-center">
        <div>
          <p className="text-sm text-gray-500">
            {users.length} user{users.length !== 1 ? "s" : ""} total
          </p>
        </div>
        <Button onClick={handleAdd}>
          <Icon icon="mdi:plus" className="mr-1" /> Add User
        </Button>
      </div>

      {loading ? (
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          Loading users...
        </div>
      ) : (
        <div className="rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden bg-white dark:bg-slate-900">
          <table className="w-full text-sm">
            <thead className="bg-gradient-to-r from-indigo-50 to-blue-50 dark:from-slate-800 dark:to-slate-800 border-b border-gray-200 dark:border-gray-700">
              <tr>
                <th className="p-3 text-left text-gray-900 dark:text-white font-bold">
                  Email
                </th>
                <th className="p-3 text-left text-gray-900 dark:text-white font-bold">
                  Name
                </th>
                <th className="p-3 text-center text-gray-900 dark:text-white font-bold">
                  Role
                </th>
                <th className="p-3 text-center text-gray-900 dark:text-white font-bold">
                  Type
                </th>
                <th className="p-3 text-right text-gray-900 dark:text-white font-bold">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {users.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="p-8 text-center text-gray-500 dark:text-gray-400"
                  >
                    Belum ada user. Buat user pertama Anda.
                  </td>
                </tr>
              ) : (
                users.map((u) => (
                  <tr
                    key={u.id}
                    className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors"
                  >
                    <td className="p-3 text-gray-900 dark:text-gray-100">
                      {u.email}
                    </td>
                    <td className="p-3 text-gray-900 dark:text-gray-100">
                      {u.name}
                    </td>
                    <td className="p-3 text-center">
                      <span className="px-2 py-1 text-xs rounded bg-gray-100 text-gray-700 dark:bg-slate-800 dark:text-gray-300">
                        {u.role?.name || "N/A"}
                      </span>
                    </td>
                    <td className="p-3 text-center">{getUserBadge(u)}</td>
                    <td className="p-3 text-right space-x-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEdit(u)}
                        className="dark:text-white dark:border-gray-600 dark:hover:bg-slate-700"
                      >
                        <Icon icon="mdi:pencil" className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleDelete(u.id)}
                        className="dark:hover:bg-red-900"
                      >
                        <Icon icon="mdi:delete" className="w-4 h-4" />
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      <UserDialog
        open={open}
        user={editUser}
        onClose={() => {
          setOpen(false);
          setEditUser(null);
        }}
        onSuccess={() => {
          setOpen(false);
          setEditUser(null);
          loadUsers();
        }}
      />
    </>
  );
}
