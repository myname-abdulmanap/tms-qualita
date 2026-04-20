"use client";

import { useEffect, useMemo, useState } from "react";
import { Icon } from "@iconify/react";
import ResolvedLocationName from "@/components/devices/resolved-location-name";

type Device = {
  id: string;
  deviceCode: string;
  serialNumber: string;
  model?: string;
  status: string;
  deviceType?: string;
  firmware?: string;
  batteryLevel?: number;
  signal?: number;
  commode?: string;
  ipAddress?: string;
  lastSeenAt?: string;
  totalMemory?: number;
  availableMemory?: number;
  totalStorage?: number;
  availableStorage?: number;
  androidVersion?: string;
  securityPatch?: string;
  appVersion?: string;
  agentVersion?: string;
  lastHealthScore?: number;
  latitude?: number | null;
  longitude?: number | null;
  locationName?: string | null;
  locationSource?: string | null;
  locationUpdatedAt?: string | null;
  merchant?: {
    name: string;
  };
};

type Insight = {
  score: number;
  health: "EXCELLENT" | "GOOD" | "WARNING" | "CRITICAL";
  issues: string[];
  online: boolean;
};

const ONLINE_THRESHOLD_MS = 5 * 60 * 1000;

function isOnline(lastSeenAt?: string): boolean {
  if (!lastSeenAt) return false;
  return Date.now() - new Date(lastSeenAt).getTime() < ONLINE_THRESHOLD_MS;
}

function computeInsight(device: Device): Insight {
  let score = 100;
  const issues: string[] = [];
  const online = isOnline(device.lastSeenAt);

  // If lastHealthScore is already tracked in DB, use it for the baseline
  // but still compute issues for display
  const hasBaseline = typeof device.lastHealthScore === "number";
  if (hasBaseline) {
    score = device.lastHealthScore!;
  }

  if (!online) {
    score -= 35;
    issues.push("Offline > 5 menit");
  }

  if (typeof device.batteryLevel === "number") {
    if (device.batteryLevel < 20) {
      score -= 25;
      issues.push("Battery < 20%");
    } else if (device.batteryLevel < 40) {
      score -= 10;
      issues.push("Battery < 40%");
    }
  } else {
    score -= 5;
    issues.push("Data battery belum ada");
  }

  if (typeof device.signal === "number") {
    if (device.signal < -95) {
      score -= 20;
      issues.push("Sinyal lemah (< -95 dBm)");
    } else if (device.signal < -85) {
      score -= 10;
      issues.push("Sinyal sedang (< -85 dBm)");
    }
  }

  if (
    typeof device.totalStorage === "number" &&
    typeof device.availableStorage === "number" &&
    device.totalStorage > 0
  ) {
    const used =
      (device.totalStorage - device.availableStorage) / device.totalStorage;
    if (used > 0.9) {
      score -= 20;
      issues.push("Storage > 90% terpakai");
    } else if (used > 0.75) {
      score -= 10;
      issues.push("Storage > 75% terpakai");
    }
  }

  if (
    typeof device.totalMemory === "number" &&
    typeof device.availableMemory === "number" &&
    device.totalMemory > 0
  ) {
    const used =
      (device.totalMemory - device.availableMemory) / device.totalMemory;
    if (used > 0.9) {
      score -= 15;
      issues.push("RAM > 90% terpakai");
    } else if (used > 0.8) {
      score -= 8;
      issues.push("RAM > 80% terpakai");
    }
  }

  score = Math.max(0, Math.min(100, score));

  let health: Insight["health"] = "EXCELLENT";
  if (score < 40) health = "CRITICAL";
  else if (score < 60) health = "WARNING";
  else if (score < 80) health = "GOOD";

  return { score, health, issues, online };
}

function healthPillClass(health: Insight["health"]): string {
  if (health === "EXCELLENT") return "bg-emerald-100 text-emerald-700";
  if (health === "GOOD") return "bg-blue-100 text-blue-700";
  if (health === "WARNING") return "bg-amber-100 text-amber-700";
  return "bg-red-100 text-red-700";
}

export default function DeviceHealthOverview() {
  const [devices, setDevices] = useState<Device[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const res = await fetch("/api/devices?deviceType=EDC");
        if (!res.ok) throw new Error("Failed to load devices");
        const data = await res.json();
        setDevices(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error("Failed to load EDC overview:", error);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  const rows = useMemo(() => {
    return devices.map((device) => ({
      device,
      insight: computeInsight(device),
    }));
  }, [devices]);

  const summary = useMemo(() => {
    const total = rows.length;
    const online = rows.filter((r) => r.insight.online).length;
    const critical = rows.filter((r) => r.insight.health === "CRITICAL").length;
    const warning = rows.filter((r) => r.insight.health === "WARNING").length;
    return { total, online, critical, warning };
  }, [rows]);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <SummaryCard
          icon="mdi:devices"
          label="Total Device"
          value={summary.total}
        />
        <SummaryCard
          icon="mdi:check-decagram"
          label="Online"
          value={summary.online}
          tone="emerald"
        />
        <SummaryCard
          icon="mdi:alert"
          label="Warning"
          value={summary.warning}
          tone="amber"
        />
        <SummaryCard
          icon="mdi:alert-octagon"
          label="Critical"
          value={summary.critical}
          tone="red"
        />
      </div>

      <div className="rounded-lg border border-gray-200 bg-white">
        <div className="border-b border-gray-100 px-4 py-3">
          <h2 className="text-base font-semibold text-gray-900">
            Device Health Insight
          </h2>
          <p className="text-xs text-gray-500">
            Gunakan halaman ini sebagai quality gate sebelum OTA dan update
            aplikasi.
          </p>
        </div>

        {loading ? (
          <div className="px-4 py-8 text-center text-sm text-gray-500">
            Loading device insight...
          </div>
        ) : rows.length === 0 ? (
          <div className="px-4 py-8 text-center text-sm text-gray-500">
            Belum ada device.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-left text-xs uppercase tracking-wide text-gray-500">
                <tr>
                  <th className="px-4 py-3">Device</th>
                  <th className="px-4 py-3">Merchant</th>
                  <th className="px-4 py-3">Network</th>
                  <th className="px-4 py-3">Lokasi</th>
                  <th className="px-4 py-3">Health</th>
                  <th className="px-4 py-3">Score</th>
                  <th className="px-4 py-3">Insight</th>
                </tr>
              </thead>
              <tbody>
                {rows.map(({ device, insight }) => (
                  <tr
                    key={device.id}
                    className="border-t border-gray-100 align-top"
                  >
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-900">
                        {device.deviceCode}
                      </p>
                      <p className="text-xs text-gray-500">
                        {device.serialNumber}
                      </p>
                      <p className="text-xs text-gray-400">
                        {device.model || "-"}
                      </p>
                    </td>
                    <td className="px-4 py-3 text-gray-700">
                      {device.merchant?.name || "-"}
                    </td>
                    <td className="px-4 py-3 text-gray-700">
                      <p>{device.commode || "-"}</p>
                      <p className="text-xs text-gray-500">
                        {device.ipAddress || "-"}
                      </p>
                    </td>
                    <td className="px-4 py-3 text-gray-700">
                      <p className="text-xs text-gray-700 max-w-[220px] line-clamp-2">
                        <ResolvedLocationName
                          locationName={device.locationName}
                          latitude={device.latitude ?? undefined}
                          longitude={device.longitude ?? undefined}
                          fallback={
                            device.latitude != null && device.longitude != null
                              ? `${device.latitude.toFixed(5)}, ${device.longitude.toFixed(5)}`
                              : "-"
                          }
                        />
                      </p>
                      {device.locationSource && (
                        <p className="text-xs text-gray-400">
                          {device.locationSource}
                        </p>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`rounded-full px-2 py-1 text-xs font-semibold ${healthPillClass(insight.health)}`}
                      >
                        {insight.health}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-semibold text-gray-900">
                        {insight.score}/100
                      </p>
                      <p
                        className={`text-xs ${insight.online ? "text-emerald-600" : "text-red-600"}`}
                      >
                        {insight.online ? "Online" : "Offline"}
                      </p>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-600">
                      {insight.issues.length === 0
                        ? "Sehat, tidak ada issue kritikal."
                        : insight.issues.join("; ")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function SummaryCard({
  icon,
  label,
  value,
  tone = "slate",
}: {
  icon: string;
  label: string;
  value: number;
  tone?: "slate" | "emerald" | "amber" | "red";
}) {
  const toneClass =
    tone === "emerald"
      ? "text-emerald-600"
      : tone === "amber"
        ? "text-amber-600"
        : tone === "red"
          ? "text-red-600"
          : "text-slate-700";

  return (
    <div className="rounded-lg border border-gray-200 bg-white px-4 py-3">
      <div className="flex items-center gap-2">
        <Icon icon={icon} className={`h-5 w-5 ${toneClass}`} />
        <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
          {label}
        </p>
      </div>
      <p className="mt-2 text-2xl font-bold text-gray-900">{value}</p>
    </div>
  );
}
