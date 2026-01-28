"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Icon } from "@iconify/react";
import { QipayDevice } from "@/types/qipay";
import QipayDialog from "./qipay-dialog";
import QipayTapLogModal from "./qipay-tap-log";

type Props = {
  merchantId?: string;
};

export default function QipayTable({ merchantId }: Props) {
  const [devices, setDevices] = useState<QipayDevice[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editData, setEditData] = useState<QipayDevice | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [logModalOpen, setLogModalOpen] = useState(false);
  const [selectedDevice, setSelectedDevice] = useState<QipayDevice | null>(null);

  const fetchDevices = useCallback(async () => {
    try {
      setLoading(true);
      const url = merchantId
        ? `/api/qipay/devices?merchantId=${merchantId}`
        : "/api/qipay/devices";

      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to fetch devices");

      const data = await res.json();
      setDevices(data);
    } catch (err) {
      console.error("❌ Fetch devices error:", err);
    } finally {
      setLoading(false);
    }
  }, [merchantId]);

  useEffect(() => {
    fetchDevices();
  }, [fetchDevices]);

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/qipay/devices/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Delete failed");

      setDevices((prev) => prev.filter((d) => d.id !== id));
      setDeleteId(null);
    } catch (err) {
      console.error("❌ Delete error:", err);
    }
  };

  const openLogs = (device: QipayDevice) => {
    setSelectedDevice(device);
    setLogModalOpen(true);
  };

  if (loading) {
    return <div className="py-8 text-center">Loading QIPAY devices…</div>;
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">QIPAY Devices</h2>
        <Button
          onClick={() => {
            setEditData(null);
            setDialogOpen(true);
          }}
          className="gap-2"
        >
          <Icon icon="lucide:plus" width={16} />
          Add Device
        </Button>
      </div>

      {/* Table */}
      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>UID</TableHead>
              <TableHead>Merchant</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Last Counter</TableHead>
              <TableHead>SUN</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {devices.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8">
                  No devices found
                </TableCell>
              </TableRow>
            ) : (
              devices.map((d) => (
                <TableRow key={d.id}>
                  <TableCell className="font-mono text-sm">
                    {d.ntagUid}
                  </TableCell>

                  <TableCell>{d.merchant.name}</TableCell>

                  <TableCell>
                    <span
                      className={`px-2 py-1 rounded text-xs font-semibold ${
                        d.status === "ACTIVE"
                          ? "bg-green-100 text-green-800"
                          : d.status === "INACTIVE"
                          ? "bg-yellow-100 text-yellow-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {d.status}
                    </span>
                  </TableCell>

                  <TableCell>{d.lastCounter}</TableCell>

                  <TableCell>
                    {d.sunEnabled ? "✅ Enabled" : "❌ Disabled"}
                  </TableCell>

                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => openLogs(d)}
                        title="View Tap Logs"
                      >
                        <Icon icon="lucide:history" width={16} />
                      </Button>

                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          setEditData(d);
                          setDialogOpen(true);
                        }}
                      >
                        <Icon icon="lucide:edit" width={16} />
                      </Button>

                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-red-600"
                        onClick={() => setDeleteId(d.id)}
                      >
                        <Icon icon="lucide:trash" width={16} />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Dialogs */}
      <QipayDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSuccess={fetchDevices}
        editData={editData}
        merchantId={merchantId}
      />

      {selectedDevice && (
        <QipayTapLogModal
          open={logModalOpen}
          onOpenChange={setLogModalOpen}
          device={selectedDevice}
        />
      )}

      <AlertDialog
        open={!!deleteId}
        onOpenChange={(o) => !o && setDeleteId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Device</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={() => deleteId && handleDelete(deleteId)}
            className="bg-red-600 hover:bg-red-700"
          >
            Delete
          </AlertDialogAction>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
