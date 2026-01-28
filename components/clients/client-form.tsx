"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";

type Client = {
  id: string;
  code: string;
  name: string;
  type: string;
};

type ClientFormProps = {
  client?: Client | null;
  onSuccess: () => void;
};

export default function ClientForm({ client, onSuccess }: ClientFormProps) {
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [type, setType] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (client) {
      setCode(client.code);
      setName(client.name);
      setType(client.type);
    } else {
      setCode("");
      setName("");
      setType("");
    }
  }, [client]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!code || !name || !type) {
      setError("Semua field harus diisi");
      return;
    }

    setLoading(true);

    try {
      const url = client ? `/api/clients/${client.id}` : "/api/clients";
      const method = client ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, name, type }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Gagal menyimpan client");
      }

      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal menyimpan client");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="space-y-2">
        <label className="text-sm font-medium">Code</label>
        <Input
          placeholder="Client code (e.g., MCD, KFC)"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          required
          disabled={loading || !!client} // Code tidak bisa diubah saat edit
        />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Name</label>
        <Input
          placeholder="Client name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          disabled={loading}
        />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Type</label>
        <Select onValueChange={setType} disabled={loading} value={type}>
          <SelectTrigger>
            <SelectValue placeholder="Pilih type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="FRANCHISE">Franchise</SelectItem>
            <SelectItem value="RETAIL">Retail</SelectItem>
            <SelectItem value="ENTERPRISE">Enterprise</SelectItem>
            <SelectItem value="CORPORATE">Corporate</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? "Saving..." : client ? "Update Client" : "Create Client"}
      </Button>
    </form>
  );
}
