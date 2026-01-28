"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import RoleDialog from "./role-dialog";

interface Permission {
  id: string;
  key: string;
  description: string;
}

interface Role {
  id: string;
  name: string;
  scope: string;
  clientId: string | null;
  permissions: { permission: Permission }[];
  createdAt: string;
}

export default function RoleTable() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [loading, setLoading] = useState(true);

  const loadRoles = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/roles");
      if (!res.ok) throw new Error("Failed to load roles");
      const data = await res.json();
      setRoles(data);
    } catch (error) {
      console.error("Error loading roles:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRoles();
  }, []);

  const handleEdit = (role: Role) => {
    setSelectedRole(role);
    setIsOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure?")) return;

    try {
      const res = await fetch(`/api/roles/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete");
      await loadRoles();
    } catch (error) {
      console.error("Error deleting role:", error);
    }
  };

  const handleClose = () => {
    setIsOpen(false);
    setSelectedRole(null);
  };

  const handleSuccess = () => {
    loadRoles();
    handleClose();
  };

  if (loading) return <div className="p-4">Loading roles...</div>;

  return (
    <div>
      <div className="mb-4">
        <Button onClick={() => setIsOpen(true)}>Add Role</Button>
      </div>

      <div className="border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-slate-900 overflow-hidden">
        <Table>
          <TableHeader className="bg-gradient-to-r from-indigo-50 to-blue-50 dark:from-slate-800 dark:to-slate-800 border-b border-gray-200 dark:border-gray-700">
            <TableRow className="hover:bg-transparent">
              <TableHead className="text-gray-900 dark:text-white font-bold">
                Name
              </TableHead>
              <TableHead className="text-gray-900 dark:text-white font-bold">
                Scope
              </TableHead>
              <TableHead className="text-gray-900 dark:text-white font-bold">
                Permissions
              </TableHead>
              <TableHead className="text-gray-900 dark:text-white font-bold">
                Created
              </TableHead>
              <TableHead className="text-gray-900 dark:text-white font-bold">
                Actions
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {roles.map((role) => (
              <TableRow
                key={role.id}
                className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors"
              >
                <TableCell className="font-medium text-gray-900 dark:text-gray-100">
                  {role.name}
                </TableCell>
                <TableCell>
                  <span
                    className={`px-2 py-1 rounded text-sm ${
                      role.scope === "PLATFORM"
                        ? "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300"
                        : "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300"
                    }`}
                  >
                    {role.scope}
                  </span>
                </TableCell>
                <TableCell>
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {role.permissions.length} permissions
                  </span>
                </TableCell>
                <TableCell className="text-gray-700 dark:text-gray-300">
                  {new Date(role.createdAt).toLocaleDateString()}
                </TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleEdit(role)}
                      className="dark:text-white dark:border-gray-600 dark:hover:bg-slate-700"
                    >
                      Edit
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleDelete(role.id)}
                      className="dark:hover:bg-red-900"
                    >
                      Delete
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <RoleDialog
        isOpen={isOpen}
        onClose={handleClose}
        role={selectedRole}
        onSuccess={handleSuccess}
      />
    </div>
  );
}
