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

type Device = {
  id: string;
  deviceCode: string;
  serialNumber: string;
  model: string;
  status: string;
  merchantId: string;
  merchant?: {
    id: string;
    name: string;
    clientId?: string;
  };
};

type Merchant = {
  id: string;
  name: string;
  code: string;
  clientId: string;
};

type CurrentUser = {
  userId: string;
  clientId: string | null;
  merchantId: string | null;
  permissions: string[];
};

type DeviceFormProps = {
  device?: Device | null;
  onSuccess: () => void;
};

export default function DeviceForm({ device, onSuccess }: DeviceFormProps) {
  const [deviceCode, setDeviceCode] = useState("");
  const [serialNumber, setSerialNumber] = useState("");
  const [model, setModel] = useState("");
  const [status, setStatus] = useState("ACTIVE");
  const [merchantId, setMerchantId] = useState("");
  const [merchants, setMerchants] = useState<Merchant[]>([]);
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const isEdit = !!device;

  useEffect(() => {
    loadCurrentUser();
  }, []);

  useEffect(() => {
    if (currentUser) {
      loadMerchants();
    }
  }, [currentUser]);

  useEffect(() => {
    if (device) {
      setDeviceCode(device.deviceCode);
      setSerialNumber(device.serialNumber);
      setModel(device.model);
      setStatus(device.status);
      setMerchantId(device.merchantId || "");
    } else {
      resetForm();
    }
  }, [device]);

  const loadCurrentUser = async () => {
    try {
      const res = await fetch("/api/me");
      if (res.ok) {
        const data = await res.json();
        setCurrentUser(data);
      }
    } catch (err) {
      console.error("Error loading current user:", err);
    }
  };

  const loadMerchants = async () => {
    try {
      const res = await fetch("/api/merchants");
      if (!res.ok) throw new Error("Failed to load merchants");
      let data = await res.json();
      data = Array.isArray(data) ? data : [];

      // Filter merchants untuk client users
      if (currentUser?.clientId) {
        data = data.filter((m: any) => m.clientId === currentUser.clientId);
        console.log(
          "📍 Filtered merchants for client:",
          currentUser.clientId,
          data,
        );
      }

      setMerchants(data);
    } catch (err) {
      console.error("Error loading merchants:", err);
    }
  };

  const resetForm = () => {
    setDeviceCode("");
    setSerialNumber("");
    setModel("");
    setStatus("ACTIVE");
    setMerchantId("");
    setError("");
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Merchant users cannot create/update devices
    if (currentUser?.merchantId) {
      setError("Access denied");
      return;
    }

    // For client users, verify the selected merchant belongs to their client
    if (currentUser?.clientId && !isEdit) {
      const selectedMerchant = merchants.find((m) => m.id === merchantId);
      if (
        !selectedMerchant ||
        selectedMerchant.clientId !== currentUser.clientId
      ) {
        setError(
          "Anda hanya bisa membuat device untuk merchant milik client Anda",
        );
        return;
      }
    }

    if (isEdit) {
      // Update: only allow model and status changes
      if (!model) {
        setError("Model harus diisi");
        return;
      }

      // For client users, verify the device's merchant belongs to their client
      if (currentUser?.clientId) {
        const deviceMerchantClientId = device?.merchant?.clientId;
        console.log("🔍 Client boundary check for update:", {
          currentClientId: currentUser.clientId,
          deviceMerchantClientId,
          deviceMerchant: device?.merchant,
        });

        if (deviceMerchantClientId !== currentUser.clientId) {
          setError("Device ini bukan milik client Anda");
          return;
        }
      }

      setLoading(true);
      try {
        console.log("📤 Updating device with:", {
          deviceId: device.id,
          model,
          status,
          currentUser,
          deviceMerchant: device?.merchant,
        });

        const res = await fetch(`/api/devices/${device.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ model, status }),
        });

        if (!res.ok) {
          const errorData = await res.json();
          throw new Error(errorData.message || "Gagal update device");
        }

        onSuccess();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Gagal update device");
      } finally {
        setLoading(false);
      }
    } else {
      // Create: require all fields
      if (!deviceCode || !serialNumber || !model || !merchantId) {
        setError("Semua field harus diisi");
        return;
      }

      setLoading(true);
      try {
        const res = await fetch("/api/devices", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            deviceCode,
            serialNumber,
            model,
            merchantId,
          }),
        });

        if (!res.ok) {
          const errorData = await res.json();
          throw new Error(errorData.message || "Gagal membuat device");
        }

        onSuccess();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Gagal membuat device");
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {isEdit ? (
        <>
          <div className="space-y-2">
            <label className="text-sm font-medium">Device Code</label>
            <Input
              placeholder="Device code"
              value={deviceCode}
              disabled
              className="bg-gray-100"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Serial Number</label>
            <Input
              placeholder="Serial number"
              value={serialNumber}
              disabled
              className="bg-gray-100"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Merchant</label>
            <Input
              placeholder="Merchant"
              value={device?.merchant?.name || ""}
              disabled
              className="bg-gray-100"
            />
          </div>
        </>
      ) : (
        <>
          <div className="space-y-2">
            <label className="text-sm font-medium">Device Code</label>
            <Input
              placeholder="Device code (e.g., DEV001)"
              value={deviceCode}
              onChange={(e) => setDeviceCode(e.target.value)}
              required
              disabled={loading}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Serial Number</label>
            <Input
              placeholder="Serial number"
              value={serialNumber}
              onChange={(e) => setSerialNumber(e.target.value)}
              required
              disabled={loading}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Merchant</label>
            <Select
              value={merchantId}
              onValueChange={setMerchantId}
              disabled={loading}
            >
              <SelectTrigger>
                <SelectValue placeholder="Pilih merchant" />
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
        </>
      )}

      <div className="space-y-2">
        <label className="text-sm font-medium">Model</label>
        <Input
          placeholder="Device model (e.g., iPad Pro, Samsung Tab)"
          value={model}
          onChange={(e) => setModel(e.target.value)}
          required
          disabled={loading}
        />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Status</label>
        <Select value={status} onValueChange={setStatus} disabled={loading}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ACTIVE">Active</SelectItem>
            <SelectItem value="INACTIVE">Inactive</SelectItem>
            <SelectItem value="BLOCKED">Blocked</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? "Loading..." : isEdit ? "Update Device" : "Add Device"}
      </Button>
    </form>
  );
}
