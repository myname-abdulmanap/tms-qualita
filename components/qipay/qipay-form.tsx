"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { QipayDevice } from "@/types/qipay";

interface Merchant {
  id: string;
  name: string;
  code: string;
}

type Props = {
  editData?: QipayDevice | null;
  merchantId?: string;
  onSuccess?: () => void;
  onCancel?: () => void;
};

export default function QipayForm({
  editData,
  merchantId,
  onSuccess,
  onCancel,
}: Props) {
  const [loading, setLoading] = useState(false);
  const [merchants, setMerchants] = useState<Merchant[]>([]);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    ntagUid: editData?.ntagUid || "",
    aesKey: editData?.aesKey || "",
    status: editData?.status || "ACTIVE",
    sunEnabled: editData?.sunEnabled ?? true,
    notes: editData?.notes || "",
    merchantId: merchantId || "",
  });

  const fetchMerchants = useCallback(async () => {
    const res = await fetch("/api/merchants");
    const data = await res.json();
    setMerchants(data);
  }, []);

  useEffect(() => {
    if (!editData) fetchMerchants();
  }, [editData, fetchMerchants]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!form.ntagUid || !form.aesKey) {
      setError("NTAG UID & AES Key wajib diisi");
      return;
    }

    const url = editData
      ? `/api/qipay/devices/${editData.id}`
      : "/api/qipay/devices";

    const method = editData ? "PATCH" : "POST";

    setLoading(true);
    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    if (!res.ok) {
      const err = await res.json();
      setError(err.message || "Failed");
      setLoading(false);
      return;
    }

    onSuccess?.();
    setLoading(false);
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      {error && <p className="text-red-600 text-sm">{error}</p>}

      {!editData && (
        <div>
          <Label>Merchant</Label>
          <Select
            value={form.merchantId}
            onValueChange={(v) => setForm({ ...form, merchantId: v })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select merchant" />
            </SelectTrigger>
            <SelectContent>
              {merchants.map((m) => (
                <SelectItem key={m.id} value={m.id}>
                  {m.name} ({m.code})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      <div>
        <Label>UID</Label>
        <Input
          value={form.ntagUid}
          disabled={!!editData}
          onChange={(e) =>
            setForm({ ...form, ntagUid: e.target.value.toUpperCase() })
          }
        />
      </div>

      <div>
        <Label>AES Key</Label>
        <Input
          value={form.aesKey}
          onChange={(e) => setForm({ ...form, aesKey: e.target.value })}
        />
      </div>

      {editData && (
        <div>
          <Label>Status</Label>
          <Select
            value={form.status}
            onValueChange={(v) =>
              setForm({ ...form, status: v as any })
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ACTIVE">ACTIVE</SelectItem>
              <SelectItem value="INACTIVE">INACTIVE</SelectItem>
              <SelectItem value="BLOCKED">BLOCKED</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}

      <div className="flex items-center gap-2">
        <Switch
          checked={form.sunEnabled}
          onCheckedChange={(v) =>
            setForm({ ...form, sunEnabled: v })
          }
        />
        <Label>Enable SUN (AES-CMAC)</Label>
      </div>

      <Textarea
        placeholder="Notes"
        value={form.notes}
        onChange={(e) => setForm({ ...form, notes: e.target.value })}
      />

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={loading}>
          {loading ? "Saving..." : "Save"}
        </Button>
      </div>
    </form>
  );
}
