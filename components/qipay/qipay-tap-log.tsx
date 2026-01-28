"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { QipayDevice, QipayTapLog } from "@/types/qipay";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  device: QipayDevice;
};

export default function QipayTapLogModal({
  open,
  onOpenChange,
  device,
}: Props) {
  const [logs, setLogs] = useState<QipayTapLog[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchLogs = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(
        `/api/qipay/tap-logs?ntagUid=${device.ntagUid}`
      );
      if (!res.ok) throw new Error("Failed to fetch logs");

      const data = await res.json();
      setLogs(data);
    } catch (err) {
      console.error("❌ Fetch logs error:", err);
    } finally {
      setLoading(false);
    }
  }, [device.ntagUid]);

  useEffect(() => {
    if (open) fetchLogs();
  }, [open, fetchLogs]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Tap Logs – {device.ntagUid}</DialogTitle>
        </DialogHeader>

        {/* Summary */}
        <div className="grid grid-cols-4 gap-4 p-4 bg-slate-50 rounded">
          <div>
            <p className="text-xs text-slate-500">Status</p>
            <p className="font-semibold">{device.status}</p>
          </div>
          <div>
            <p className="text-xs text-slate-500">SUN</p>
            <p className="font-semibold">
              {device.sunEnabled ? "Enabled" : "Disabled"}
            </p>
          </div>
          <div>
            <p className="text-xs text-slate-500">Last Counter</p>
            <p className="font-semibold">{device.lastCounter}</p>
          </div>
          <div>
            <p className="text-xs text-slate-500">Merchant</p>
            <p className="font-semibold">{device.merchant.name}</p>
          </div>
        </div>

        {/* Table */}
        {loading ? (
          <div className="py-8 text-center">Loading logs…</div>
        ) : (
          <div className="border rounded-lg overflow-hidden mt-4">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Counter</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>CMAC</TableHead>
                  <TableHead>IP Address</TableHead>
                  <TableHead>Time</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {logs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-6">
                      No tap logs found
                    </TableCell>
                  </TableRow>
                ) : (
                  logs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell className="font-semibold">
                        #{log.counter}
                      </TableCell>

                      <TableCell>
                        <span
                          className={`px-2 py-1 rounded text-xs font-semibold ${
                            log.status === "SUCCESS"
                              ? "bg-green-100 text-green-800"
                              : log.status === "REPLAYED"
                              ? "bg-yellow-100 text-yellow-800"
                              : "bg-red-100 text-red-800"
                          }`}
                        >
                          {log.status}
                        </span>
                      </TableCell>

                      <TableCell className="font-mono text-xs">
                        {log.cmac.slice(0, 16)}…
                      </TableCell>

                      <TableCell>{log.ipAddress || "-"}</TableCell>

                      <TableCell className="text-sm">
                        {new Date(log.createdAt).toLocaleString()}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
