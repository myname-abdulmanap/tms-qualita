"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import TransactionFilter from "./transaction-filter";

interface Transaction {
  id: string;
  transactionCode: string;
  merchantId: string;
  deviceId: string;
  amount: number;
  status: string;
  provider: string;
  createdAt: string;
  merchant: { name: string };
  device: { deviceCode: string };
}

interface PaginationData {
  data: Transaction[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

interface Filters {
  merchantId: string;
  today: boolean;
  from: string;
  to: string;
}

export default function TransactionTable() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  });
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<Filters>({
    merchantId: "",
    today: false,
    from: "",
    to: "",
  });

  const loadTransactions = async (
    page: number = 1,
    currentFilters: Filters
  ) => {
    try {
      setLoading(true);

      const params = new URLSearchParams({
        page: page.toString(),
        limit: "10",
      });

      if (currentFilters.merchantId)
        params.append("merchantId", currentFilters.merchantId);
      if (currentFilters.today) params.append("today", "true");
      if (currentFilters.from) params.append("from", currentFilters.from);
      if (currentFilters.to) params.append("to", currentFilters.to);

      const res = await fetch(`/api/transactions?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to load transactions");

      const data: PaginationData = await res.json();

      setTransactions(data.data);
      setPagination({
        page: data.page,
        limit: data.limit,
        total: data.total,
        totalPages: data.totalPages,
      });
    } catch (error) {
      console.error("Error loading transactions:", error);
      setTransactions([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTransactions(1, filters);
  }, [filters]);

  const handleFilterChange = (newFilters: Filters) => {
    setFilters(newFilters);
  };

  const handlePreviousPage = () => {
    if (pagination.page > 1) {
      loadTransactions(pagination.page - 1, filters);
    }
  };

  const handleNextPage = () => {
    if (pagination.page < pagination.totalPages) {
      loadTransactions(pagination.page + 1, filters);
    }
  };

  if (loading) return <div className="p-4">Loading transactions...</div>;

  return (
    <div>
      <TransactionFilter onFilterChange={handleFilterChange} />

      <div className="border border-gray-200 dark:border-gray-700 rounded-lg mt-4 bg-white dark:bg-slate-900 overflow-hidden">
        <Table>
          <TableHeader className="bg-gradient-to-r from-indigo-50 to-blue-50 dark:from-slate-800 dark:to-slate-800">
            <TableRow>
              <TableHead>Transaction Code</TableHead>
              <TableHead>Merchant</TableHead>
              <TableHead>Device</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Provider</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Date</TableHead>
              <TableHead className="text-center">Receipt</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {transactions.length > 0 ? (
              transactions.map((tx) => (
                <TableRow key={tx.id}>
                  <TableCell className="font-mono text-xs font-semibold">
                    {tx.transactionCode}
                  </TableCell>

                  <TableCell>{tx.merchant.name}</TableCell>

                  <TableCell className="font-mono text-sm">
                    {tx.device.deviceCode}
                  </TableCell>

                  <TableCell>
                    Rp {(tx.amount || 0).toLocaleString("id-ID")}
                  </TableCell>

                  <TableCell>
                    <span className="px-2 py-1 rounded text-xs bg-blue-100 dark:bg-blue-900/30">
                      {tx.provider}
                    </span>
                  </TableCell>

                  <TableCell>
                    <span
                      className={`px-2 py-1 rounded text-xs ${
                        tx.status === "PAID"
                          ? "bg-green-100 text-green-800"
                          : tx.status === "PENDING"
                          ? "bg-yellow-100 text-yellow-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {tx.status}
                    </span>
                  </TableCell>

                  <TableCell>
                    {new Date(tx.createdAt).toLocaleString("id-ID")}
                  </TableCell>

                  {/* ===== RECEIPT BUTTON ===== */}
                  <TableCell className="text-center">
                    {tx.status === "PAID" ? (
                      <Link
                        href={`/receipt/${tx.transactionCode}`}
                        target="_blank"
                      >
                        <Button size="sm" variant="outline">
                          Lihat Struk
                        </Button>
                      </Link>
                    ) : (
                      <span className="text-xs text-gray-400">
                        Belum tersedia
                      </span>
                    )}
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={8} className="text-center text-gray-500">
                  No transactions found
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between mt-4">
        <span className="text-sm text-gray-600">
          Total: {pagination.total} | Halaman {pagination.page} dari{" "}
          {pagination.totalPages || 1}
        </span>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handlePreviousPage}
            disabled={pagination.page === 1}
          >
            Sebelumnya
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleNextPage}
            disabled={
              pagination.page === pagination.totalPages ||
              pagination.totalPages === 0
            }
          >
            Berikutnya
          </Button>
        </div>
      </div>
    </div>
  );
}
