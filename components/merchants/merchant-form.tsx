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
import { Alert, AlertDescription } from "@/components/ui/alert";

interface Client {
  id: string;
  code: string;
  name: string;
}

interface Merchant {
  id: string;
  code: string;
  name: string;
  clientId: string;
}

interface MerchantFormProps {
  merchant?: Merchant | null;
  onSuccess: () => void;
}

export default function MerchantForm({
  merchant,
  onSuccess,
}: MerchantFormProps) {
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [clientId, setClientId] = useState("");
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    loadClients();
  }, []);

  useEffect(() => {
    if (merchant) {
      setCode(merchant.code);
      setName(merchant.name);
      setClientId(merchant.clientId);
    }
  }, [merchant]);

  const loadClients = async () => {
    try {
      const res = await fetch("/api/clients");
      if (!res.ok) throw new Error("Failed to load clients");
      const data = await res.json();
      setClients(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error loading clients:", error);
      setError("Failed to load clients");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      if (!code || !name || !clientId) {
        throw new Error("All fields are required");
      }

      const body = {
        code: code.trim(),
        name: name.trim(),
        clientId: merchant?.clientId || clientId, // For edit, use existing clientId
      };

      const url = merchant ? `/api/merchants/${merchant.id}` : "/api/merchants";
      const method = merchant ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Failed to save merchant");
      }

      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save merchant");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div>
        <label className="block text-sm font-medium mb-2">Merchant Code</label>
        <Input
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="e.g., M001"
          disabled={!!merchant}
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">Merchant Name</label>
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g., Abdul Digital Store"
          required
        />
      </div>

      {!merchant && (
        <div>
          <label className="block text-sm font-medium mb-2">Client</label>
          <Select value={clientId} onValueChange={setClientId}>
            <SelectTrigger>
              <SelectValue placeholder="Select a client" />
            </SelectTrigger>
            <SelectContent>
              {clients.map((client) => (
                <SelectItem key={client.id} value={client.id}>
                  {client.name} ({client.code})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {merchant && (
        <div>
          <label className="block text-sm font-medium mb-2">Client</label>
          <Input
            value={clients.find((c) => c.id === clientId)?.name || clientId}
            disabled
            className="bg-gray-100"
          />
        </div>
      )}

      <div className="flex gap-2 pt-4">
        <Button type="submit" disabled={loading}>
          {loading
            ? "Saving..."
            : merchant
              ? "Update Merchant"
              : "Create Merchant"}
        </Button>
      </div>
    </form>
  );
}
