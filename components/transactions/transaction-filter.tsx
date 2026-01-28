"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Merchant {
  id: string;
  code: string;
  name: string;
}

interface TransactionFilterProps {
  onFilterChange: (filters: {
    merchantId: string;
    today: boolean;
    from: string;
    to: string;
  }) => void;
}

export default function TransactionFilter({
  onFilterChange,
}: TransactionFilterProps) {
  const [merchants, setMerchants] = useState<Merchant[]>([]);
  const [merchantId, setMerchantId] = useState("");
  const [today, setToday] = useState(false);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  useEffect(() => {
    loadMerchants();
  }, []);

  const loadMerchants = async () => {
    try {
      const res = await fetch("/api/merchants");
      if (!res.ok) throw new Error("Failed to load merchants");
      const data = await res.json();
      setMerchants(data);
    } catch (error) {
      console.error("Error loading merchants:", error);
    }
  };

  const handleMerchantChange = (value: string) => {
    setMerchantId(value);
  };

  const handleTodayToggle = () => {
    const newToday = !today;
    setToday(newToday);
    // Reset from/to jika today aktif
    if (newToday) {
      setFrom("");
      setTo("");
    }
  };

  const handleFromChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFrom(e.target.value);
  };

  const handleToChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTo(e.target.value);
  };

  const handleApply = () => {
    onFilterChange({
      merchantId,
      today,
      from: today ? "" : from,
      to: today ? "" : to,
    });
  };

  const handleReset = () => {
    setMerchantId("");
    setToday(false);
    setFrom("");
    setTo("");
    onFilterChange({
      merchantId: "",
      today: false,
      from: "",
      to: "",
    });
  };

  return (
    <div className="p-4 bg-white dark:bg-slate-900 rounded-lg border border-gray-200 dark:border-gray-700 space-y-4 shadow-sm">
      <h3 className="font-semibold text-gray-900 dark:text-white">
        Filter Transaksi
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Merchant Filter */}
        <div>
          <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
            Merchant
          </label>
          <Select
            value={merchantId || undefined}
            onValueChange={handleMerchantChange}
          >
            <SelectTrigger className="dark:bg-slate-800 dark:border-gray-600 dark:text-white">
              <SelectValue placeholder="Semua merchant" />
            </SelectTrigger>
            <SelectContent>
              {merchants.map((m) => (
                <SelectItem key={m.id} value={m.id}>
                  {m.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Today Toggle */}
        <div className="flex items-end">
          <Button
            variant={today ? "default" : "outline"}
            onClick={handleTodayToggle}
            className="w-full dark:text-white dark:border-gray-600"
          >
            {today ? "Hari Ini ✓" : "Semua Waktu"}
          </Button>
        </div>

        {/* From Date */}
        <div>
          <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
            Dari Tanggal
          </label>
          <Input
            type="date"
            value={from}
            onChange={handleFromChange}
            disabled={today}
            className="dark:bg-slate-800 dark:border-gray-600 dark:text-white"
          />
        </div>

        {/* To Date */}
        <div>
          <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
            Hingga Tanggal
          </label>
          <Input
            type="date"
            value={to}
            onChange={handleToChange}
            disabled={today}
            className="dark:bg-slate-800 dark:border-gray-600 dark:text-white"
          />
        </div>
      </div>

      <div className="flex justify-end gap-2 border-t border-gray-200 dark:border-gray-700 pt-4">
        <Button
          variant="outline"
          size="sm"
          onClick={handleReset}
          className="dark:text-white dark:border-gray-600 dark:hover:bg-slate-800"
        >
          Reset
        </Button>
        <Button
          size="sm"
          onClick={handleApply}
          className="bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-600 dark:hover:bg-indigo-700"
        >
          Terapkan Filter
        </Button>
      </div>
    </div>
  );
}
