"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Icon } from "@iconify/react";
import ClientDialog from "./client-dialog";

type Client = {
  id: string;
  code: string;
  name: string;
  type: string;
  createdAt: string;
};

export default function ClientTable() {
  const [clients, setClients] = useState<Client[]>([]);
  const [open, setOpen] = useState(false);
  const [editClient, setEditClient] = useState<Client | null>(null);

  const loadClients = async () => {
    try {
      const res = await fetch("/api/clients");
      if (!res.ok) throw new Error("Failed to load clients");
      const data = await res.json();
      setClients(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error loading clients:", error);
    }
  };

  useEffect(() => {
    loadClients();
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm("Yakin hapus client ini?")) return;

    try {
      const res = await fetch(`/api/clients/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const error = await res.json();
        alert(error.message || "Gagal menghapus client");
        return;
      }
      loadClients();
    } catch (error) {
      alert("Gagal menghapus client");
    }
  };

  const handleEdit = (client: Client) => {
    setEditClient(client);
    setOpen(true);
  };

  return (
    <>
      <div className="mb-4 flex justify-between items-center">
        <h2 className="text-xl font-bold">Clients</h2>
        <Button
          onClick={() => {
            setEditClient(null);
            setOpen(true);
          }}
        >
          <Icon icon="mdi:plus" className="mr-1" /> Add Client
        </Button>
      </div>

      <div className="rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden bg-white dark:bg-slate-900">
        <table className="w-full text-sm">
          <thead className="bg-gradient-to-r from-indigo-50 to-blue-50 dark:from-slate-800 dark:to-slate-800 border-b border-gray-200 dark:border-gray-700">
            <tr>
              <th className="p-3 text-left text-gray-900 dark:text-white font-bold">
                Code
              </th>
              <th className="p-3 text-left text-gray-900 dark:text-white font-bold">
                Name
              </th>
              <th className="p-3 text-left text-gray-900 dark:text-white font-bold">
                Type
              </th>
              <th className="p-3 text-right text-gray-900 dark:text-white font-bold">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {clients.length === 0 ? (
              <tr>
                <td
                  colSpan={4}
                  className="p-4 text-center text-gray-500 dark:text-gray-400"
                >
                  Belum ada client
                </td>
              </tr>
            ) : (
              clients.map((c) => (
                <tr
                  key={c.id}
                  className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors"
                >
                  <td className="p-3 text-gray-900 dark:text-gray-100">
                    {c.code}
                  </td>
                  <td className="p-3 text-gray-900 dark:text-gray-100">
                    {c.name}
                  </td>
                  <td className="p-3">
                    <span className="px-2 py-1 text-xs rounded bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
                      {c.type}
                    </span>
                  </td>
                  <td className="p-3 text-right space-x-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleEdit(c)}
                      className="dark:text-white dark:border-gray-600 dark:hover:bg-slate-700"
                    >
                      <Icon icon="mdi:pencil" className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleDelete(c.id)}
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

      <ClientDialog
        open={open}
        client={editClient}
        onClose={() => {
          setOpen(false);
          setEditClient(null);
        }}
        onSuccess={() => {
          setOpen(false);
          setEditClient(null);
          loadClients();
        }}
      />
    </>
  );
}
