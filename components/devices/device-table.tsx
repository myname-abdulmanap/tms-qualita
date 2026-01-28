"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Icon } from "@iconify/react";
import DeviceDialog from "./device-dialog";

type Device = {
  id: string;
  deviceCode: string;
  serialNumber: string;
  model: string;
  status: string;
  merchantId: string;
  merchant?: {
    id: string;
    name: string;
    clientId?: string;
  };
  createdAt?: string;
};

type CurrentUser = {
  userId: string;
  clientId: string | null;
  merchantId: string | null;
  permissions: string[];
};

export default function DeviceTable() {
  const [devices, setDevices] = useState<Device[]>([]);
  const [open, setOpen] = useState(false);
  const [editDevice, setEditDevice] = useState<Device | null>(null);
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadCurrentUser();
    loadDevices();
  }, []);

  const loadCurrentUser = async () => {
    try {
      const res = await fetch("/api/me");
      if (res.ok) {
        const data = await res.json();
        setCurrentUser(data);
      }
    } catch (err) {
      console.error("Error loading current user:", err);
    }
  };

  const loadDevices = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/devices");
      if (!res.ok) throw new Error("Failed to load devices");
      const data = await res.json();
      console.log("📦 Loaded devices with merchant data:", data);
      setDevices(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error loading devices:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Yakin hapus device ini?")) return;

    try {
      const res = await fetch(`/api/devices/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const error = await res.json();
        alert(error.message || "Gagal menghapus device");
        return;
      }
      loadDevices();
    } catch (error) {
      alert("Gagal menghapus device");
    }
  };

  const handleEdit = (device: Device) => {
    // Merchant users cannot edit devices
    if (currentUser?.merchantId) {
      alert("Anda tidak memiliki akses untuk edit device");
      return;
    }
    console.log("✏️ Editing device:", device, "Current user:", currentUser);
    setEditDevice(device);
    setOpen(true);
  };

  const handleAdd = () => {
    // Merchant users cannot create devices
    if (currentUser?.merchantId) {
      alert("Anda tidak memiliki akses untuk membuat device");
      return;
    }
    setEditDevice(null);
    setOpen(true);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "ACTIVE":
        return (
          <span className="px-2 py-1 text-xs rounded bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300 font-medium">
            ACTIVE
          </span>
        );
      case "INACTIVE":
        return (
          <span className="px-2 py-1 text-xs rounded bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300 font-medium">
            INACTIVE
          </span>
        );
      case "BLOCKED":
        return (
          <span className="px-2 py-1 text-xs rounded bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300 font-medium">
            BLOCKED
          </span>
        );
      default:
        return (
          <span className="px-2 py-1 text-xs rounded bg-gray-100 text-gray-700 dark:bg-slate-800 dark:text-gray-300">
            {status}
          </span>
        );
    }
  };

  return (
    <>
      <div className="mb-4 flex justify-between items-center">
        <div>
          <p className="text-sm text-gray-500">
            {devices.length} device{devices.length !== 1 ? "s" : ""} total
          </p>
        </div>
        {!currentUser?.merchantId && (
          <Button onClick={handleAdd}>
            <Icon icon="mdi:plus" className="mr-1" /> Add Device
          </Button>
        )}
      </div>

      {loading ? (
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          Loading devices...
        </div>
      ) : (
        <div className="rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden bg-white dark:bg-slate-900">
          <table className="w-full text-sm">
            <thead className="bg-gradient-to-r from-indigo-50 to-blue-50 dark:from-slate-800 dark:to-slate-800 border-b border-gray-200 dark:border-gray-700">
              <tr>
                <th className="p-3 text-left text-gray-900 dark:text-white font-bold">
                  Device Code
                </th>
                <th className="p-3 text-left text-gray-900 dark:text-white font-bold">
                  Serial Number
                </th>
                <th className="p-3 text-left text-gray-900 dark:text-white font-bold">
                  Model
                </th>
                <th className="p-3 text-left text-gray-900 dark:text-white font-bold">
                  Merchant
                </th>
                <th className="p-3 text-center text-gray-900 dark:text-white font-bold">
                  Status
                </th>
                <th className="p-3 text-right text-gray-900 dark:text-white font-bold">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {devices.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="p-8 text-center text-gray-500 dark:text-gray-400"
                  >
                    Belum ada device. Buat device pertama Anda.
                  </td>
                </tr>
              ) : (
                devices.map((device) => (
                  <tr
                    key={device.id}
                    className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors"
                  >
                    <td className="p-3 font-medium text-gray-900 dark:text-gray-100">
                      {device.deviceCode}
                    </td>
                    <td className="p-3 text-gray-900 dark:text-gray-100">
                      {device.serialNumber}
                    </td>
                    <td className="p-3 text-gray-900 dark:text-gray-100">
                      {device.model}
                    </td>
                    <td className="p-3 text-gray-900 dark:text-gray-100">
                      {device.merchant?.name || "-"}
                    </td>
                    <td className="p-3 text-center">
                      {getStatusBadge(device.status)}
                    </td>
                    <td className="p-3 text-right space-x-2">
                      {!currentUser?.merchantId && (
                        <>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleEdit(device)}
                            className="dark:text-white dark:border-gray-600 dark:hover:bg-slate-700"
                          >
                            <Icon icon="mdi:pencil" className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleDelete(device.id)}
                            className="dark:hover:bg-red-900"
                          >
                            <Icon icon="mdi:delete" className="w-4 h-4" />
                          </Button>
                        </>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      <DeviceDialog
        open={open}
        device={editDevice}
        onClose={() => {
          setOpen(false);
          setEditDevice(null);
        }}
        onSuccess={() => {
          setOpen(false);
          setEditDevice(null);
          loadDevices();
        }}
      />
    </>
  );
}
