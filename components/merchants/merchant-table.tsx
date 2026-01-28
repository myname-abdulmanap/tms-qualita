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
import MerchantDialog from "./merchant-dialog";

interface Merchant {
  id: string;
  code: string;
  name: string;
  clientId: string;
  createdAt: string;
}

export default function MerchantTable() {
  const [merchants, setMerchants] = useState<Merchant[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedMerchant, setSelectedMerchant] = useState<Merchant | null>(
    null,
  );
  const [loading, setLoading] = useState(true);

  const loadMerchants = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/merchants");
      if (!res.ok) throw new Error("Failed to load merchants");
      const data = await res.json();
      setMerchants(data);
    } catch (error) {
      console.error("Error loading merchants:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMerchants();
  }, []);

  const handleEdit = (merchant: Merchant) => {
    setSelectedMerchant(merchant);
    setIsOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure?")) return;

    try {
      const res = await fetch(`/api/merchants/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete");
      await loadMerchants();
    } catch (error) {
      console.error("Error deleting merchant:", error);
    }
  };

  const handleClose = () => {
    setIsOpen(false);
    setSelectedMerchant(null);
  };

  const handleSuccess = () => {
    loadMerchants();
    handleClose();
  };

  if (loading) return <div className="p-4">Loading merchants...</div>;

  return (
    <div>
      <div className="mb-4">
        <Button onClick={() => setIsOpen(true)}>Add Merchant</Button>
      </div>

      <div className="border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-slate-900 overflow-hidden">
        <Table>
          <TableHeader className="bg-gradient-to-r from-indigo-50 to-blue-50 dark:from-slate-800 dark:to-slate-800 border-b border-gray-200 dark:border-gray-700">
            <TableRow className="hover:bg-transparent">
              <TableHead className="text-gray-900 dark:text-white font-bold">
                Code
              </TableHead>
              <TableHead className="text-gray-900 dark:text-white font-bold">
                Name
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
            {merchants.map((merchant) => (
              <TableRow
                key={merchant.id}
                className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors"
              >
                <TableCell className="font-mono text-sm text-gray-900 dark:text-gray-100">
                  {merchant.code}
                </TableCell>
                <TableCell className="font-medium text-gray-900 dark:text-gray-100">
                  {merchant.name}
                </TableCell>
                <TableCell className="text-gray-700 dark:text-gray-300">
                  {new Date(merchant.createdAt).toLocaleDateString()}
                </TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleEdit(merchant)}
                      className="dark:text-white dark:border-gray-600 dark:hover:bg-slate-700"
                    >
                      Edit
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleDelete(merchant.id)}
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

      <MerchantDialog
        isOpen={isOpen}
        onClose={handleClose}
        merchant={selectedMerchant}
        onSuccess={handleSuccess}
      />
    </div>
  );
}
