"use client";

import { useEffect, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Icon } from "@iconify/react";

// ============ TYPES ============
interface Merchant {
  id: string;
  code: string;
  name: string;
  saldo: number;
}

interface UnsettledTx {
  id: string;
  transactionCode: string;
  amount: number;
  paymentMethod: string;
  provider: string;
  status: string;
  createdAt: string;
  merchant: { id: string; name: string; code: string };
  device: { deviceCode: string; serialNumber: string };
}

interface Settlement {
  id: string;
  amount: number;
  settledAt: string;
  createdAt: string;
  transaction: {
    transactionCode: string;
    paymentMethod: string;
    provider: string;
    status: string;
    createdAt: string;
    device: { deviceCode: string; serialNumber: string };
  };
  merchant: { id: string; name: string; code: string };
}

interface MerchantSummary {
  merchantName: string;
  merchantCode: string;
  count: number;
  total: number;
}

// ============ HELPERS ============
function formatRupiah(amount: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(amount);
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const hours = Math.floor(diff / 3600000);
  if (hours < 1) return `${Math.floor(diff / 60000)} menit lalu`;
  if (hours < 24) return `${hours} jam lalu`;
  return `${Math.floor(hours / 24)} hari lalu`;
}

// ============ COMPONENT ============
export default function SettlementDashboard() {
  // State
  const [merchants, setMerchants] = useState<Merchant[]>([]);
  const [saldoList, setSaldoList] = useState<Merchant[]>([]);
  const [unsettledTxs, setUnsettledTxs] = useState<UnsettledTx[]>([]);
  const [unsettledSummary, setUnsettledSummary] = useState<
    Record<string, MerchantSummary>
  >({});
  const [totalUnsettled, setTotalUnsettled] = useState(0);
  const [totalUnsettledAmount, setTotalUnsettledAmount] = useState(0);
  const [settlements, setSettlements] = useState<Settlement[]>([]);
  const [loading, setLoading] = useState(false);
  const [settling, setSettling] = useState(false);
  const [activeTab, setActiveTab] = useState("unsettled");

  // Filters
  const [filterMerchant, setFilterMerchant] = useState("");
  const [filterFrom, setFilterFrom] = useState("");
  const [filterTo, setFilterTo] = useState("");

  // ============ LOAD DATA ============
  const loadMerchants = useCallback(async () => {
    try {
      const res = await fetch("/api/merchants");
      if (res.ok) {
        const data = await res.json();
        setMerchants(Array.isArray(data) ? data : []);
      }
    } catch (e) {
      console.error("Load merchants error:", e);
    }
  }, []);

  const loadSaldo = useCallback(async () => {
    try {
      const res = await fetch("/api/settlements/saldo");
      if (res.ok) {
        const json = await res.json();
        setSaldoList(json.data || []);
      }
    } catch (e) {
      console.error("Load saldo error:", e);
    }
  }, []);

  const loadUnsettled = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filterMerchant) params.append("merchantId", filterMerchant);
      const res = await fetch(`/api/settlements/unsettled?${params}`);
      if (res.ok) {
        const json = await res.json();
        setUnsettledTxs(json.data || []);
        setUnsettledSummary(json.summary || {});
        setTotalUnsettled(json.totalUnsettled || 0);
        setTotalUnsettledAmount(json.totalAmount || 0);
      }
    } catch (e) {
      console.error("Load unsettled error:", e);
    } finally {
      setLoading(false);
    }
  }, [filterMerchant]);

  const loadSettlements = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filterMerchant) params.append("merchantId", filterMerchant);
      if (filterFrom) params.append("from", filterFrom);
      if (filterTo) params.append("to", filterTo);
      const res = await fetch(`/api/settlements?${params}`);
      if (res.ok) {
        const json = await res.json();
        setSettlements(json.data || []);
      }
    } catch (e) {
      console.error("Load settlements error:", e);
    } finally {
      setLoading(false);
    }
  }, [filterMerchant, filterFrom, filterTo]);

  // ============ SETTLE ============
  const handleSettle = async (merchantId: string) => {
    try {
      setSettling(true);
      const res = await fetch("/api/settlements/settle-merchant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ merchantId }),
      });
      const json = await res.json();
      if (res.ok && json.success) {
        alert(
          `Settlement berhasil!\nKode: ${json.data.settlement_code}\nTotal TX: ${json.data.total_tx}\nTotal: ${formatRupiah(json.data.total_amount)}\nSaldo baru: ${formatRupiah(json.data.new_saldo)}`,
        );
        // Reload all data
        loadUnsettled();
        loadSettlements();
        loadSaldo();
      } else {
        alert(json.message || "Settlement gagal");
      }
    } catch (e) {
      console.error("Settle error:", e);
      alert("Settlement gagal");
    } finally {
      setSettling(false);
    }
  };

  // ============ EFFECTS ============
  useEffect(() => {
    loadMerchants();
    loadSaldo();
  }, [loadMerchants, loadSaldo]);

  useEffect(() => {
    if (activeTab === "unsettled") loadUnsettled();
    if (activeTab === "history") loadSettlements();
  }, [activeTab, loadUnsettled, loadSettlements]);

  // ============ RENDER ============
  return (
    <div className="space-y-4">
      {/* ====== SALDO CARDS ====== */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {saldoList.map((m) => (
          <Card key={m.id}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-500 dark:text-gray-400">
                {m.name}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                {formatRupiah(m.saldo)}
              </div>
              <p className="text-xs text-gray-400 mt-1">{m.code}</p>
            </CardContent>
          </Card>
        ))}
        {/* Summary card */}
        <Card className="border-orange-200 dark:border-orange-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-orange-600 dark:text-orange-400">
              Belum Settle
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
              {formatRupiah(totalUnsettledAmount)}
            </div>
            <p className="text-xs text-gray-400 mt-1">
              {totalUnsettled} transaksi
            </p>
          </CardContent>
        </Card>
      </div>

      {/* ====== TABS ====== */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="unsettled" className="gap-1">
            <Icon icon="lucide:clock" className="w-4 h-4" />
            Belum Settle
            {totalUnsettled > 0 && (
              <Badge variant="destructive" className="ml-1 text-xs px-1.5">
                {totalUnsettled}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="history" className="gap-1">
            <Icon icon="lucide:history" className="w-4 h-4" />
            Riwayat Settlement
          </TabsTrigger>
        </TabsList>

        {/* ==================== TAB: UNSETTLED ==================== */}
        <TabsContent value="unsettled" className="space-y-4">
          {/* Filter */}
          <Card>
            <CardContent className="pt-4">
              <div className="flex flex-wrap gap-3 items-end">
                <div className="min-w-[200px]">
                  <label className="text-sm font-medium mb-1 block">
                    Merchant
                  </label>
                  <Select
                    value={filterMerchant}
                    onValueChange={(v) =>
                      setFilterMerchant(v === "ALL" ? "" : v)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Semua Merchant" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ALL">Semua Merchant</SelectItem>
                      {merchants.map((m) => (
                        <SelectItem key={m.id} value={m.id}>
                          {m.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button
                  variant="outline"
                  onClick={loadUnsettled}
                  disabled={loading}
                >
                  <Icon icon="lucide:refresh-cw" className="w-4 h-4 mr-1" />
                  Refresh
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Per-merchant summary with settle buttons */}
          {Object.keys(unsettledSummary).length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {Object.entries(unsettledSummary).map(([merchantId, summary]) => (
                <Card
                  key={merchantId}
                  className="border-orange-100 dark:border-orange-900"
                >
                  <CardContent className="pt-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-semibold">{summary.merchantName}</p>
                        <p className="text-xs text-gray-400">
                          {summary.merchantCode}
                        </p>
                        <p className="text-lg font-bold text-orange-600 dark:text-orange-400 mt-1">
                          {formatRupiah(summary.total)}
                        </p>
                        <p className="text-xs text-gray-500">
                          {summary.count} transaksi
                        </p>
                      </div>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            size="sm"
                            className="bg-green-600 hover:bg-green-700 text-white"
                            disabled={settling}
                          >
                            <Icon
                              icon="lucide:check-circle"
                              className="w-4 h-4 mr-1"
                            />
                            Settle
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>
                              Konfirmasi Settlement
                            </AlertDialogTitle>
                            <AlertDialogDescription>
                              Settle <strong>{summary.count}</strong> transaksi
                              senilai{" "}
                              <strong>{formatRupiah(summary.total)}</strong>{" "}
                              untuk merchant{" "}
                              <strong>{summary.merchantName}</strong>?
                              <br />
                              <br />
                              Saldo merchant akan bertambah sebesar{" "}
                              {formatRupiah(summary.total)}.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Batal</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleSettle(merchantId)}
                              className="bg-green-600 hover:bg-green-700"
                            >
                              Ya, Settle Sekarang
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Unsettled transactions table */}
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Kode Transaksi</TableHead>
                    <TableHead>Merchant</TableHead>
                    <TableHead>Device</TableHead>
                    <TableHead>Metode</TableHead>
                    <TableHead className="text-right">Jumlah</TableHead>
                    <TableHead>Waktu</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8">
                        <Icon
                          icon="lucide:loader-2"
                          className="w-6 h-6 animate-spin mx-auto mb-2"
                        />
                        Loading...
                      </TableCell>
                    </TableRow>
                  ) : unsettledTxs.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={7}
                        className="text-center py-8 text-gray-400"
                      >
                        <Icon
                          icon="lucide:check-circle-2"
                          className="w-8 h-8 mx-auto mb-2 text-green-400"
                        />
                        Semua transaksi sudah di-settle!
                      </TableCell>
                    </TableRow>
                  ) : (
                    unsettledTxs.map((tx) => (
                      <TableRow key={tx.id}>
                        <TableCell className="font-mono text-xs">
                          {tx.transactionCode}
                        </TableCell>
                        <TableCell>{tx.merchant.name}</TableCell>
                        <TableCell className="text-xs">
                          {tx.device.deviceCode}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{tx.paymentMethod}</Badge>
                        </TableCell>
                        <TableCell className="text-right font-semibold">
                          {formatRupiah(tx.amount)}
                        </TableCell>
                        <TableCell className="text-xs">
                          {formatDate(tx.createdAt)}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              Date.now() - new Date(tx.createdAt).getTime() >
                              86400000
                                ? "destructive"
                                : "secondary"
                            }
                            className="text-xs"
                          >
                            {timeAgo(tx.createdAt)}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ==================== TAB: HISTORY ==================== */}
        <TabsContent value="history" className="space-y-4">
          {/* Filter */}
          <Card>
            <CardContent className="pt-4">
              <div className="flex flex-wrap gap-3 items-end">
                <div className="min-w-[200px]">
                  <label className="text-sm font-medium mb-1 block">
                    Merchant
                  </label>
                  <Select
                    value={filterMerchant}
                    onValueChange={(v) =>
                      setFilterMerchant(v === "ALL" ? "" : v)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Semua Merchant" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ALL">Semua Merchant</SelectItem>
                      {merchants.map((m) => (
                        <SelectItem key={m.id} value={m.id}>
                          {m.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">Dari</label>
                  <Input
                    type="date"
                    value={filterFrom}
                    onChange={(e) => setFilterFrom(e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">
                    Sampai
                  </label>
                  <Input
                    type="date"
                    value={filterTo}
                    onChange={(e) => setFilterTo(e.target.value)}
                  />
                </div>
                <Button variant="outline" onClick={loadSettlements}>
                  <Icon icon="lucide:search" className="w-4 h-4 mr-1" />
                  Cari
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => {
                    setFilterFrom("");
                    setFilterTo("");
                    setFilterMerchant("");
                  }}
                >
                  Reset
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Settlement history table */}
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Kode Transaksi</TableHead>
                    <TableHead>Merchant</TableHead>
                    <TableHead>Device</TableHead>
                    <TableHead>Metode</TableHead>
                    <TableHead className="text-right">Jumlah</TableHead>
                    <TableHead>Waktu TX</TableHead>
                    <TableHead>Waktu Settle</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8">
                        <Icon
                          icon="lucide:loader-2"
                          className="w-6 h-6 animate-spin mx-auto mb-2"
                        />
                        Loading...
                      </TableCell>
                    </TableRow>
                  ) : settlements.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={7}
                        className="text-center py-8 text-gray-400"
                      >
                        Belum ada riwayat settlement
                      </TableCell>
                    </TableRow>
                  ) : (
                    settlements.map((s) => (
                      <TableRow key={s.id}>
                        <TableCell className="font-mono text-xs">
                          {s.transaction.transactionCode}
                        </TableCell>
                        <TableCell>{s.merchant.name}</TableCell>
                        <TableCell className="text-xs">
                          {s.transaction.device.deviceCode}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {s.transaction.paymentMethod}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right font-semibold">
                          {formatRupiah(s.amount)}
                        </TableCell>
                        <TableCell className="text-xs">
                          {formatDate(s.transaction.createdAt)}
                        </TableCell>
                        <TableCell className="text-xs">
                          <Badge
                            variant="secondary"
                            className="bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300"
                          >
                            {formatDate(s.settledAt)}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
              {settlements.length > 0 && (
                <div className="p-4 border-t text-sm text-gray-500 flex justify-between">
                  <span>Total: {settlements.length} settlement</span>
                  <span className="font-semibold text-green-600 dark:text-green-400">
                    {formatRupiah(
                      settlements.reduce((sum, s) => sum + s.amount, 0),
                    )}
                  </span>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
