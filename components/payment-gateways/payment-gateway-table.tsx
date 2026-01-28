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
import PaymentGatewayDialog from "./payment-gateway-dialog";
import { PaymentGatewayConfig } from "@/types/payment-gateway";

export default function PaymentGatewayTable() {
  const [gateways, setGateways] = useState<PaymentGatewayConfig[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedGateway, setSelectedGateway] =
    useState<PaymentGatewayConfig | null>(null);
  const [loading, setLoading] = useState(true);

  const loadGateways = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/payment-gateways");
      if (!res.ok) throw new Error("Failed to load gateways");
      const data = await res.json();
      setGateways(data);
    } catch (error) {
      console.error("Error loading gateways:", error);
      alert("Gagal memuat payment gateways");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadGateways();
  }, []);

  const handleEdit = async (gateway: PaymentGatewayConfig) => {
    try {
      const res = await fetch(`/api/payment-gateways/${gateway.id}`);
      if (!res.ok) throw new Error("Failed to load gateway details");
      const data = await res.json();
      setSelectedGateway(data);
      setIsOpen(true);
    } catch {
      alert("Gagal memuat detail gateway");
    }
  };

  const handleDelete = async (id?: string) => {
    if (!id) return;
    if (!confirm("Yakin hapus payment gateway ini?")) return;

    try {
      const res = await fetch(`/api/payment-gateways/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Gagal menghapus gateway");
      }
      await loadGateways();
    } catch (error) {
      alert(error instanceof Error ? error.message : "Gagal menghapus gateway");
    }
  };

  const handleClose = () => {
    setIsOpen(false);
    setSelectedGateway(null);
  };

  const handleSuccess = () => {
    loadGateways();
    handleClose();
  };

  if (loading)
    return (
      <div className="p-4 text-gray-500 dark:text-gray-400">
        Loading payment gateways...
      </div>
    );

  return (
    <div>
      <div className="mb-4">
        <Button
          onClick={() => {
            setSelectedGateway(null);
            setIsOpen(true);
          }}
        >
          Add Payment Gateway
        </Button>
      </div>

      <div className="border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-slate-900 overflow-hidden">
        <Table>
          <TableHeader className="bg-gradient-to-r from-indigo-50 to-blue-50 dark:from-slate-800 dark:to-slate-800 border-b border-gray-200 dark:border-gray-700">
            <TableRow>
              <TableHead>Code</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Base URL</TableHead>
              <TableHead className="text-center">Status</TableHead>
              <TableHead>Created</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {gateways.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8">
                  No payment gateways found
                </TableCell>
              </TableRow>
            ) : (
              gateways.map((gateway) => (
                <TableRow key={gateway.id}>
                  <TableCell className="font-mono">{gateway.code}</TableCell>
                  <TableCell>{gateway.name}</TableCell>
                  <TableCell className="truncate max-w-xs">
                    {gateway.baseUrl}
                  </TableCell>
                  <TableCell className="text-center">
                    <span
                      className={`px-2 py-1 rounded text-xs ${
                        gateway.isActive
                          ? "bg-green-100 text-green-800"
                          : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {gateway.isActive ? "Active" : "Inactive"}
                    </span>
                  </TableCell>
                  <TableCell className="text-sm">
                    {gateway.createdAt
                      ? new Date(gateway.createdAt).toLocaleDateString("id-ID")
                      : "-"}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEdit(gateway)}
                      >
                        Edit
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleDelete(gateway.id)}
                      >
                        Delete
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <PaymentGatewayDialog
        isOpen={isOpen}
        onClose={handleClose}
        gateway={selectedGateway}
        onSuccess={handleSuccess}
      />
    </div>
  );
}
