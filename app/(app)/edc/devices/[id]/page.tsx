"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Icon } from "@iconify/react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import dynamic from "next/dynamic";
import {
  hasUsableLocationName,
  reverseGeocodeLocation,
} from "@/lib/reverse-geocode";

const DeviceLocationMap = dynamic(
  () => import("@/components/devices/device-location-map"),
  {
    ssr: false,
    loading: () => (
      <div className="h-[350px] bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center">
        <p className="text-gray-500">Loading map...</p>
      </div>
    ),
  },
);

type Device = {
  id?: string;
  deviceCode: string;
  serialNumber: string;
  deviceType?: "EDC" | "SOUNDBOX";
  model?: string;
  status?: string;
  batteryLevel?: number;
  charging?: boolean;
  signal?: number;
  commode?: string;
  ipAddress?: string;
  lastSeenAt?: string;
  merchant?: { name: string };
  carrier?: string;
  network?: string;
  latitude?: number;
  longitude?: number;
  accuracy?: number;
  locationSource?: string;
  locationUpdatedAt?: string;
  locationName?: string | null;
  mcc?: number;
  mnc?: number;
  lac?: number;
  cellId?: number;
  totalMemory?: number;
  availableMemory?: number;
  totalStorage?: number;
  availableStorage?: number;
  androidVersion?: string;
  appVersion?: string;
  agentVersion?: string;
  lastHealthScore?: number;
  telemetryUpdatedAt?: string | null;
  rawInfo?: Record<string, string> | null;
  healthInsights?: Array<{
    title?: string;
    status?: string;
    detail?: string;
    isWarning?: boolean;
  }> | null;
  componentDiagnostics?: Array<{
    title?: string;
    status?: string;
    detail?: string;
    isWarning?: boolean;
  }> | null;
  installedApps?: Array<{
    name?: string;
    packageName?: string;
    versionName?: string;
    isSystemApp?: boolean;
  }> | null;
  componentScore?: number | null;
};

const ONLINE_THRESHOLD = 5 * 60 * 1000;

function isOnline(lastSeenAt?: string) {
  if (!lastSeenAt) return false;
  return Date.now() - new Date(lastSeenAt).getTime() < ONLINE_THRESHOLD;
}

function getBatteryIcon(level?: number, charging?: boolean) {
  if (charging) return "mdi:battery-charging";
  if (level == null) return "mdi:battery-unknown";
  if (level >= 80) return "mdi:battery-high";
  if (level >= 50) return "mdi:battery-medium";
  if (level >= 20) return "mdi:battery-low";
  return "mdi:battery-alert";
}
function getBatteryColor(level?: number) {
  if (level == null) return "text-gray-400";
  if (level >= 50) return "text-green-500";
  if (level >= 20) return "text-yellow-500";
  return "text-red-500";
}
function getLocationSourceLabel(source?: string) {
  if (!source) return "-";
  const labels: Record<string, string> = {
    GPS: "📍 GPS",
    CELL_TOWER: "📡 Cell Tower",
    WIFI: "📶 WiFi",
    GOOGLE: "🌐 Google",
    OPENCELLID: "🌐 OpenCellID",
    UNWIREDLABS: "🌐 UnwiredLabs",
    MOZILLA_MLS: "🌐 Mozilla MLS",
    FALLBACK_MCC_MNC: "⚠️ Estimasi (Carrier)",
    FALLBACK_COUNTRY: "⚠️ Estimasi (Negara)",
    IP: "🌐 IP Address",
    UNKNOWN: "❓ Unknown",
  };
  return labels[source] || source;
}

function InfoCard({
  icon,
  label,
  value,
  wrap = false,
}: {
  icon: string;
  label: string;
  value: string;
  wrap?: boolean;
}) {
  return (
    <div className="p-4 rounded-xl bg-gray-50 dark:bg-slate-800 border border-gray-100 dark:border-slate-700">
      <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 mb-1.5">
        <Icon icon={icon} className="w-4 h-4" />
        <span className="uppercase tracking-wide font-medium">{label}</span>
      </div>
      <p
        className={`font-semibold text-gray-900 dark:text-gray-100 text-sm ${wrap ? "whitespace-normal break-words" : "truncate"}`}
        title={wrap ? undefined : value}
      >
        {value}
      </p>
    </div>
  );
}

function SectionInsightList({
  title,
  emptyText,
  items,
}: {
  title: string;
  emptyText: string;
  items: {
    key: string;
    title: string;
    status: string;
    detail: string;
    isWarning: boolean;
  }[];
}) {
  return (
    <div className="rounded-xl border border-gray-200 dark:border-slate-700 overflow-hidden">
      <div className="px-4 py-3 bg-gray-50 dark:bg-slate-800 border-b border-gray-200 dark:border-slate-700">
        <h4 className="text-sm font-semibold text-gray-800 dark:text-gray-100">
          {title}
        </h4>
      </div>
      {items.length === 0 ? (
        <p className="px-4 py-4 text-sm text-gray-400">{emptyText}</p>
      ) : (
        <div className="divide-y divide-gray-100 dark:divide-slate-700">
          {items.map((item) => (
            <div key={item.key} className="px-4 py-3 flex items-start gap-3">
              <Icon
                icon={item.isWarning ? "mdi:alert-circle" : "mdi:check-circle"}
                className={`w-5 h-5 mt-0.5 shrink-0 ${item.isWarning ? "text-amber-500" : "text-green-500"}`}
              />
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  {item.title}{" "}
                  <span className="text-xs font-normal text-gray-500">
                    — {item.status}
                  </span>
                </p>
                <p className="text-xs text-gray-500 mt-0.5">{item.detail}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ProgressBar({
  used,
  total,
  color,
}: {
  used: number;
  total: number;
  color: string;
}) {
  const pct = total > 0 ? Math.min(100, (used / total) * 100) : 0;
  const barColor = pct > 90 ? "bg-red-500" : pct > 70 ? "bg-yellow-500" : color;
  return (
    <div className="w-full bg-gray-200 dark:bg-slate-600 rounded-full h-2">
      {/* eslint-disable-next-line react/forbid-dom-props */}
      <div
        className={`h-2 rounded-full transition-all ${barColor}`}
        // Dynamic width cannot be expressed as a Tailwind class
        // eslint-disable-next-line @next/next/no-css-global
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

export default function EdcDeviceDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  const [device, setDevice] = useState<Device | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [resolvedLocation, setResolvedLocation] = useState<{
    key: string;
    name: string | null;
  } | null>(null);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    fetch(`/api/devices/${id}`)
      .then((r) => {
        if (!r.ok) throw new Error("Device tidak ditemukan");
        return r.json();
      })
      .then((data) => setDevice(data))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    let cancelled = false;

    if (!device) return;

    if (hasUsableLocationName(device.locationName)) return;

    if (!Number.isFinite(device.latitude) || !Number.isFinite(device.longitude))
      return;

    const key = `${device.latitude!.toFixed(5)},${device.longitude!.toFixed(5)}`;

    reverseGeocodeLocation(device.latitude, device.longitude).then((name) => {
      if (!cancelled) setResolvedLocation({ key, name });
    });

    return () => {
      cancelled = true;
    };
  }, [device]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <Icon
            icon="mdi:loading"
            className="w-10 h-10 animate-spin text-sky-500 mx-auto mb-3"
          />
          <p className="text-gray-500">Memuat detail device...</p>
        </div>
      </div>
    );
  }

  if (error || !device) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <Icon
            icon="mdi:alert-circle"
            className="w-12 h-12 text-red-400 mx-auto mb-3"
          />
          <p className="text-gray-700 dark:text-gray-300 font-medium">
            {error || "Device tidak ditemukan"}
          </p>
          <Button
            className="mt-4"
            variant="outline"
            onClick={() => router.back()}
          >
            <Icon icon="mdi:arrow-left" className="w-4 h-4 mr-2" /> Kembali
          </Button>
        </div>
      </div>
    );
  }

  const online = isOnline(device.lastSeenAt);
  const isWifiMode = device.commode?.toUpperCase() === "WIFI";
  const hasValidLocation =
    typeof device.latitude === "number" && typeof device.longitude === "number";
  const hasCellTower = !isWifiMode && device.mcc != null && device.mcc > 0;
  const healthInsights = Array.isArray(device.healthInsights)
    ? device.healthInsights
    : [];
  const componentDiagnostics = Array.isArray(device.componentDiagnostics)
    ? device.componentDiagnostics
    : [];
  const installedApps = Array.isArray(device.installedApps)
    ? device.installedApps
    : [];
  const locationKey = hasValidLocation
    ? `${device.latitude!.toFixed(5)},${device.longitude!.toFixed(5)}`
    : null;
  const locationLabel = hasUsableLocationName(device.locationName)
    ? device.locationName!.trim()
    : locationKey && resolvedLocation?.key === locationKey
      ? resolvedLocation.name || "-"
      : "-";

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">
      {/* ── Breadcrumb ── */}
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <button
          onClick={() => router.push("/edc/devices")}
          className="hover:text-sky-600 transition-colors flex items-center gap-1"
        >
          <Icon icon="mdi:point-of-sale" className="w-4 h-4" />
          EDC Devices
        </button>
        <Icon icon="mdi:chevron-right" className="w-4 h-4" />
        <span className="text-gray-900 dark:text-white font-medium">
          {device.deviceCode}
        </span>
      </div>

      {/* ── Header Card ── */}
      <div className="rounded-2xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
        <div className="bg-gradient-to-r from-sky-500 to-indigo-500 px-6 py-5">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-white/20 flex items-center justify-center">
                <Icon icon="mdi:point-of-sale" className="w-8 h-8 text-white" />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h1 className="text-xl font-bold text-white">
                    {device.deviceCode}
                  </h1>
                  <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-white/20 text-white">
                    EDC
                  </span>
                </div>
                <p className="text-sky-100 text-sm">{device.serialNumber}</p>
                <p className="text-sky-200 text-xs mt-0.5">
                  {device.model || "-"} ·{" "}
                  {device.merchant?.name || "No Merchant"}
                </p>
              </div>
            </div>
            <div className="flex flex-col items-end gap-2">
              <span
                className={`px-3 py-1.5 rounded-full text-xs font-bold ${online ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}
              >
                {online ? "🟢 ONLINE" : "🔴 OFFLINE"}
              </span>
              <span className="text-xs text-sky-200">
                {device.lastSeenAt
                  ? new Date(device.lastSeenAt).toLocaleString("id-ID")
                  : "Belum ada aktivitas"}
              </span>
            </div>
          </div>
        </div>

        {/* Quick stats bar */}
        <div className="grid grid-cols-3 divide-x divide-gray-100 dark:divide-slate-700 bg-gray-50 dark:bg-slate-800">
          <div className="px-4 py-3 text-center">
            <Icon
              icon={getBatteryIcon(device.batteryLevel, device.charging)}
              className={`w-5 h-5 mx-auto mb-1 ${getBatteryColor(device.batteryLevel)}`}
            />
            <p className="text-xs text-gray-500">Battery</p>
            <p className="text-sm font-bold text-gray-900 dark:text-white">
              {device.batteryLevel != null ? `${device.batteryLevel}%` : "-"}
            </p>
          </div>
          <div className="px-4 py-3 text-center">
            <Icon
              icon="mdi:heart-pulse"
              className={`w-5 h-5 mx-auto mb-1 ${typeof device.lastHealthScore === "number" ? (device.lastHealthScore >= 80 ? "text-green-500" : device.lastHealthScore >= 60 ? "text-yellow-500" : "text-red-500") : "text-gray-400"}`}
            />
            <p className="text-xs text-gray-500">Health</p>
            <p className="text-sm font-bold text-gray-900 dark:text-white">
              {typeof device.lastHealthScore === "number"
                ? `${device.lastHealthScore}/100`
                : "-"}
            </p>
          </div>
          <div className="px-4 py-3 text-center">
            <Icon
              icon={isWifiMode ? "mdi:wifi" : "mdi:signal-cellular-3"}
              className="w-5 h-5 mx-auto mb-1 text-sky-500"
            />
            <p className="text-xs text-gray-500">Network</p>
            <p className="text-sm font-bold text-gray-900 dark:text-white">
              {device.commode || "-"}
            </p>
          </div>
        </div>
      </div>

      {/* ── Tabs ── */}
      <Tabs defaultValue="info" className="w-full">
        <TabsList className="grid w-full grid-cols-5 rounded-xl bg-gray-100 dark:bg-slate-800 p-1 h-auto">
          <TabsTrigger
            value="info"
            className="rounded-lg py-2 text-xs data-[state=active]:bg-white dark:data-[state=active]:bg-slate-700 data-[state=active]:shadow-sm"
          >
            <Icon icon="mdi:information-outline" className="w-4 h-4 mr-1.5" />
            Info
          </TabsTrigger>
          <TabsTrigger
            value="health"
            className="rounded-lg py-2 text-xs data-[state=active]:bg-white dark:data-[state=active]:bg-slate-700 data-[state=active]:shadow-sm"
          >
            <Icon icon="mdi:heart-pulse" className="w-4 h-4 mr-1.5" />
            Health
          </TabsTrigger>
          <TabsTrigger
            value="network"
            className="rounded-lg py-2 text-xs data-[state=active]:bg-white dark:data-[state=active]:bg-slate-700 data-[state=active]:shadow-sm"
          >
            <Icon icon="mdi:signal" className="w-4 h-4 mr-1.5" />
            Network
          </TabsTrigger>
          <TabsTrigger
            value="location"
            className="rounded-lg py-2 text-xs data-[state=active]:bg-white dark:data-[state=active]:bg-slate-700 data-[state=active]:shadow-sm"
          >
            <Icon icon="mdi:map-marker" className="w-4 h-4 mr-1.5" />
            Lokasi
          </TabsTrigger>
          <TabsTrigger
            value="apps"
            className="rounded-lg py-2 text-xs data-[state=active]:bg-white dark:data-[state=active]:bg-slate-700 data-[state=active]:shadow-sm"
          >
            <Icon icon="mdi:apps" className="w-4 h-4 mr-1.5" />
            Apps
          </TabsTrigger>
        </TabsList>

        {/* ── TAB: INFO ── */}
        <TabsContent value="info" className="mt-6 space-y-6">
          <div className="grid grid-cols-2 gap-3">
            <InfoCard
              icon="mdi:barcode"
              label="Device Code"
              value={device.deviceCode}
            />
            <InfoCard
              icon="mdi:identifier"
              label="Serial Number"
              value={device.serialNumber}
            />
            <InfoCard
              icon="mdi:cellphone"
              label="Model"
              value={device.model || "-"}
            />
            <InfoCard
              icon="mdi:store"
              label="Merchant"
              value={device.merchant?.name || "-"}
            />
            <InfoCard
              icon="mdi:application"
              label="App Version"
              value={device.appVersion || "-"}
            />
            <InfoCard
              icon="mdi:android"
              label="Android Version"
              value={device.androidVersion || "-"}
            />
            <InfoCard
              icon="mdi:map-marker-radius"
              label="Location Name"
              value={locationLabel}
              wrap
            />
            <div className="p-4 rounded-xl bg-gray-50 dark:bg-slate-800 border border-gray-100 dark:border-slate-700">
              <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 mb-1.5">
                <Icon
                  icon={getBatteryIcon(device.batteryLevel, device.charging)}
                  className={`w-4 h-4 ${getBatteryColor(device.batteryLevel)}`}
                />
                <span className="uppercase tracking-wide font-medium">
                  Battery
                </span>
              </div>
              <p className="font-semibold text-gray-900 dark:text-gray-100 text-sm">
                {device.batteryLevel != null
                  ? `${device.batteryLevel}% ${device.charging ? "⚡ Charging" : ""}`
                  : "-"}
              </p>
            </div>
          </div>

          {/* Memory & Storage */}
          {(device.totalMemory != null || device.totalStorage != null) && (
            <div className="rounded-xl border border-gray-200 dark:border-slate-700 overflow-hidden">
              <div className="px-4 py-3 bg-gray-50 dark:bg-slate-800 border-b border-gray-200 dark:border-slate-700 flex items-center gap-2">
                <Icon icon="mdi:memory" className="w-4 h-4" />
                <h4 className="text-sm font-semibold text-gray-800 dark:text-gray-100">
                  Memory & Storage
                </h4>
              </div>
              <div className="p-4 space-y-4">
                {device.totalMemory != null && (
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <Icon
                          icon="mdi:memory"
                          className="w-4 h-4 text-purple-500"
                        />
                        RAM
                      </div>
                      <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                        {device.availableMemory ?? 0} MB bebas /{" "}
                        {device.totalMemory} MB total
                      </span>
                    </div>
                    <ProgressBar
                      used={device.totalMemory - (device.availableMemory ?? 0)}
                      total={device.totalMemory}
                      color="bg-purple-500"
                    />
                    <p className="text-xs text-gray-400 mt-1">
                      Terpakai:{" "}
                      {device.totalMemory - (device.availableMemory ?? 0)} MB (
                      {device.totalMemory > 0
                        ? Math.round(
                            ((device.totalMemory -
                              (device.availableMemory ?? 0)) /
                              device.totalMemory) *
                              100,
                          )
                        : 0}
                      %)
                    </p>
                  </div>
                )}
                {device.totalStorage != null && (
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <Icon
                          icon="mdi:harddisk"
                          className="w-4 h-4 text-blue-500"
                        />
                        Storage
                      </div>
                      <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                        {device.availableStorage ?? 0} MB bebas /{" "}
                        {device.totalStorage} MB total
                      </span>
                    </div>
                    <ProgressBar
                      used={
                        device.totalStorage - (device.availableStorage ?? 0)
                      }
                      total={device.totalStorage}
                      color="bg-blue-500"
                    />
                    <p className="text-xs text-gray-400 mt-1">
                      Terpakai:{" "}
                      {device.totalStorage - (device.availableStorage ?? 0)} MB
                      (
                      {device.totalStorage > 0
                        ? Math.round(
                            ((device.totalStorage -
                              (device.availableStorage ?? 0)) /
                              device.totalStorage) *
                              100,
                          )
                        : 0}
                      %)
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </TabsContent>

        {/* ── TAB: HEALTH ── */}
        <TabsContent value="health" className="mt-6 space-y-6">
          <div className="grid grid-cols-2 gap-3">
            <InfoCard
              icon="mdi:heart-pulse"
              label="Health Score"
              value={
                typeof device.lastHealthScore === "number"
                  ? `${device.lastHealthScore}/100`
                  : "-"
              }
            />
            <InfoCard
              icon="mdi:cpu-64-bit"
              label="Component Score"
              value={
                typeof device.componentScore === "number"
                  ? `${device.componentScore}/100`
                  : "-"
              }
            />
            <InfoCard
              icon="mdi:chip"
              label="Android"
              value={device.androidVersion || "-"}
            />
            <InfoCard
              icon="mdi:clock-outline"
              label="Heartbeat Updated"
              value={
                device.lastSeenAt
                  ? new Date(device.lastSeenAt).toLocaleString("id-ID")
                  : "-"
              }
            />
          </div>

          <SectionInsightList
            title="Insight Kesehatan"
            emptyText="Belum ada insight kesehatan dari device."
            items={healthInsights.map((item, idx) => ({
              key: `health-${idx}`,
              title: item.title || "-",
              status: item.status || "-",
              detail: item.detail || "-",
              isWarning: !!item.isWarning,
            }))}
          />

          <SectionInsightList
            title="Diagnostik Komponen"
            emptyText="Belum ada diagnostik komponen dari device."
            items={componentDiagnostics.map((item, idx) => ({
              key: `diag-${idx}`,
              title: item.title || "-",
              status: item.status || "-",
              detail: item.detail || "-",
              isWarning: !!item.isWarning,
            }))}
          />

          {device.rawInfo && Object.keys(device.rawInfo).length > 0 && (
            <div className="rounded-xl border border-gray-200 dark:border-slate-700 overflow-hidden">
              <div className="px-4 py-3 bg-gray-50 dark:bg-slate-800 border-b border-gray-200 dark:border-slate-700">
                <h4 className="text-sm font-semibold text-gray-800 dark:text-gray-100">
                  Raw Device Info
                </h4>
              </div>
              <div className="p-4 grid grid-cols-2 gap-3 text-xs">
                {Object.entries(device.rawInfo).map(([key, value]) => (
                  <div
                    key={key}
                    className="rounded-lg bg-gray-50 dark:bg-slate-800 border border-gray-100 dark:border-slate-700 p-3"
                  >
                    <p className="text-gray-500 mb-0.5">{key}</p>
                    <p className="font-medium text-gray-900 dark:text-gray-100 break-all">
                      {String(value)}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </TabsContent>

        {/* ── TAB: NETWORK ── */}
        <TabsContent value="network" className="mt-6 space-y-6">
          <div
            className={`p-4 rounded-xl bg-gradient-to-r ${isWifiMode ? "from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 border-blue-100 dark:border-blue-800" : "from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-green-100 dark:border-green-800"} border`}
          >
            <div className="flex items-center gap-4">
              <div
                className={`p-3 rounded-xl ${isWifiMode ? "bg-blue-100 dark:bg-blue-800" : "bg-green-100 dark:bg-green-800"}`}
              >
                <Icon
                  icon={isWifiMode ? "mdi:wifi" : "mdi:signal-cellular-3"}
                  className={`w-8 h-8 ${isWifiMode ? "text-blue-600" : "text-green-600"}`}
                />
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide">
                  Connection Type
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {device.commode || "-"}
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <InfoCard
              icon="mdi:ip-network"
              label="IP Address"
              value={device.ipAddress || "-"}
            />
            <InfoCard
              icon="mdi:sim"
              label="Carrier"
              value={device.carrier || "-"}
            />
            <InfoCard
              icon="mdi:antenna"
              label="Network Type"
              value={device.network || device.commode || "-"}
            />
          </div>

          {hasCellTower && (
            <div className="rounded-xl border border-amber-200 dark:border-amber-800 overflow-hidden">
              <div className="px-4 py-3 bg-amber-50 dark:bg-amber-900/20 border-b border-amber-200 dark:border-amber-800 flex items-center gap-2">
                <Icon
                  icon="mdi:broadcast-tower"
                  className="w-4 h-4 text-amber-600"
                />
                <h4 className="text-sm font-semibold text-amber-800 dark:text-amber-200">
                  Cell Tower Information
                </h4>
              </div>
              <div className="p-4 grid grid-cols-2 gap-3">
                {[
                  {
                    label: "MCC",
                    value: device.mcc,
                    sub: device.mcc === 510 ? "Indonesia" : "",
                  },
                  {
                    label: "MNC",
                    value: device.mnc,
                    sub:
                      device.mnc === 10
                        ? "Telkomsel"
                        : device.mnc === 11
                          ? "XL"
                          : device.mnc === 13
                            ? "Indosat"
                            : "",
                  },
                  { label: "LAC", value: device.lac, sub: "" },
                  { label: "Cell ID", value: device.cellId, sub: "" },
                ].map(({ label, value, sub }) => (
                  <div
                    key={label}
                    className="p-3 rounded-lg bg-gray-50 dark:bg-slate-800 text-center"
                  >
                    <p className="text-[10px] text-gray-500 uppercase tracking-wide">
                      {label}
                    </p>
                    <p className="text-lg font-mono font-bold text-gray-900 dark:text-white mt-1">
                      {value ?? "-"}
                    </p>
                    {sub && (
                      <p className="text-[10px] text-gray-400 mt-0.5">{sub}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </TabsContent>

        {/* ── TAB: LOCATION ── */}
        <TabsContent value="location" className="mt-6 space-y-6">
          <div className="rounded-xl overflow-hidden border border-gray-200 dark:border-slate-700 h-[350px]">
            <DeviceLocationMap
              latitude={hasValidLocation ? device.latitude : undefined}
              longitude={hasValidLocation ? device.longitude : undefined}
              accuracy={hasValidLocation ? device.accuracy : undefined}
              locationSource={device.locationSource}
              locationName={locationLabel}
              deviceName={device.deviceCode}
              className="h-full"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <InfoCard
              icon="mdi:latitude"
              label="Latitude"
              value={hasValidLocation ? device.latitude!.toFixed(6) : "-"}
            />
            <InfoCard
              icon="mdi:longitude"
              label="Longitude"
              value={hasValidLocation ? device.longitude!.toFixed(6) : "-"}
            />
            <InfoCard
              icon="mdi:crosshairs-gps"
              label="Sumber Lokasi"
              value={
                hasValidLocation && device.locationSource
                  ? getLocationSourceLabel(device.locationSource)
                  : "-"
              }
            />
            <InfoCard
              icon="mdi:target"
              label="Akurasi"
              value={
                hasValidLocation && device.accuracy
                  ? device.accuracy >= 1000
                    ? `~${(device.accuracy / 1000).toFixed(1)} km`
                    : `~${device.accuracy} m`
                  : "-"
              }
            />
            <InfoCard
              icon="mdi:clock-outline"
              label="Location Updated"
              value={
                device.locationUpdatedAt
                  ? new Date(device.locationUpdatedAt).toLocaleString("id-ID")
                  : "-"
              }
            />
            <InfoCard
              icon="mdi:map-marker-radius"
              label="Nama Lokasi"
              value={locationLabel}
              wrap
            />
          </div>

          {!hasValidLocation && !hasCellTower && !isWifiMode && (
            <div className="p-6 rounded-xl bg-gray-50 dark:bg-slate-800 text-center">
              <Icon
                icon="mdi:map-marker-off"
                className="w-12 h-12 mx-auto text-gray-400 mb-3"
              />
              <p className="text-sm text-gray-500">
                Data lokasi belum tersedia
              </p>
              <p className="text-xs text-gray-400 mt-1">
                Device belum mengirim data lokasi
              </p>
            </div>
          )}
        </TabsContent>

        {/* ── TAB: APPS ── */}
        <TabsContent value="apps" className="mt-6">
          <div className="rounded-xl border border-gray-200 dark:border-slate-700 overflow-hidden">
            <div className="px-4 py-3 bg-gray-50 dark:bg-slate-800 border-b border-gray-200 dark:border-slate-700 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Icon icon="mdi:apps" className="w-4 h-4" />
                <h4 className="text-sm font-semibold text-gray-800 dark:text-gray-100">
                  Installed Apps
                </h4>
              </div>
              <span className="text-xs text-gray-500">
                {installedApps.length} apps
              </span>
            </div>
            <div className="overflow-auto max-h-[500px]">
              <table className="w-full text-xs">
                <thead className="bg-gray-50 dark:bg-slate-800 text-left text-[11px] uppercase tracking-wide text-gray-500 sticky top-0">
                  <tr>
                    <th className="px-4 py-3">Nama App</th>
                    <th className="px-4 py-3">Package</th>
                    <th className="px-4 py-3">Versi</th>
                    <th className="px-4 py-3">Tipe</th>
                  </tr>
                </thead>
                <tbody>
                  {installedApps.length === 0 ? (
                    <tr>
                      <td
                        colSpan={4}
                        className="px-4 py-6 text-center text-gray-400"
                      >
                        Belum ada data aplikasi terinstal.
                      </td>
                    </tr>
                  ) : (
                    installedApps.map((app, idx) => (
                      <tr
                        key={`${app.packageName || app.name}-${idx}`}
                        className="border-t border-gray-100 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors"
                      >
                        <td className="px-4 py-2.5 font-medium text-gray-900 dark:text-gray-100">
                          {app.name || "-"}
                        </td>
                        <td className="px-4 py-2.5 text-gray-500 dark:text-gray-400 break-all font-mono">
                          {app.packageName || "-"}
                        </td>
                        <td className="px-4 py-2.5 text-gray-600 dark:text-gray-300">
                          {app.versionName || "-"}
                        </td>
                        <td className="px-4 py-2.5">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${app.isSystemApp ? "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300" : "bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-300"}`}
                          >
                            {app.isSystemApp ? "System" : "User"}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
