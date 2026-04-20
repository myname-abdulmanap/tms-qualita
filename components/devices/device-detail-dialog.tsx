"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Icon } from "@iconify/react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import {
  hasUsableLocationName,
  reverseGeocodeLocation,
} from "@/lib/reverse-geocode";

// Dynamic import untuk map (client-side only)
const DeviceLocationMap = dynamic(() => import("./device-location-map"), {
  ssr: false,
  loading: () => (
    <div className="h-[250px] bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center">
      <p className="text-gray-500">Loading map...</p>
    </div>
  ),
});

type Device = {
  id?: string;
  deviceCode: string;
  serialNumber: string;
  deviceType?: "EDC" | "SOUNDBOX";
  model?: string;
  batteryLevel?: number;
  charging?: boolean;
  signal?: number;
  commode?: string;
  ipAddress?: string;
  lastSeenAt?: string;
  merchant?: { name: string };
  // 🔥 TMS Location fields
  carrier?: string;
  network?: string;
  latitude?: number;
  longitude?: number;
  accuracy?: number; // meters
  locationSource?: string;
  locationUpdatedAt?: string;
  mcc?: number;
  mnc?: number;
  lac?: number;
  cellId?: number;
  // Memory & Storage
  totalMemory?: number;
  availableMemory?: number;
  totalStorage?: number;
  availableStorage?: number;
  // EDC/Android specific
  androidVersion?: string;
  appVersion?: string;
  lastHealthScore?: number;
  telemetryUpdatedAt?: string | null;
  locationName?: string | null;
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

const ONLINE_THRESHOLD = 5 * 60 * 1000; // 5 menit

function isOnline(lastSeenAt?: string) {
  if (!lastSeenAt) return false;
  return Date.now() - new Date(lastSeenAt).getTime() < ONLINE_THRESHOLD;
}

function getSignalIcon(signal?: number) {
  if (signal === undefined || signal === null)
    return "mdi:signal-cellular-outline";
  if (signal >= -70) return "mdi:signal-cellular-3";
  if (signal >= -85) return "mdi:signal-cellular-2";
  if (signal >= -100) return "mdi:signal-cellular-1";
  return "mdi:signal-cellular-outline";
}

function getSignalColor(signal?: number) {
  if (signal === undefined || signal === null) return "text-gray-400";
  if (signal >= -70) return "text-green-500";
  if (signal >= -85) return "text-yellow-500";
  if (signal >= -100) return "text-orange-500";
  return "text-red-500";
}

function getBatteryIcon(level?: number, charging?: boolean) {
  if (charging) return "mdi:battery-charging";
  if (level === undefined || level === null) return "mdi:battery-unknown";
  if (level >= 80) return "mdi:battery-high";
  if (level >= 50) return "mdi:battery-medium";
  if (level >= 20) return "mdi:battery-low";
  return "mdi:battery-alert";
}

function getBatteryColor(level?: number) {
  if (level === undefined || level === null) return "text-gray-400";
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

function getDeviceTypeBadge(deviceType?: "EDC" | "SOUNDBOX") {
  if (deviceType === "EDC") {
    return "bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-300";
  }

  return "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300";
}

export default function DeviceDetailDialog({
  open,
  device,
  onClose,
}: {
  open: boolean;
  device: Device | null;
  onClose: () => void;
}) {
  const online = isOnline(device?.lastSeenAt);

  const isWifiMode = device?.commode?.toUpperCase() === "WIFI";
  const hasValidLocation =
    typeof device?.latitude === "number" && typeof device?.longitude === "number";

  // Check if any cell tower data exists (not null/undefined, and has meaningful values)
  const hasCellTower =
    !isWifiMode &&
    device?.mcc !== null &&
    device?.mcc !== undefined &&
    device.mcc > 0;

  const healthInsights = Array.isArray(device?.healthInsights)
    ? device.healthInsights
    : [];
  const componentDiagnostics = Array.isArray(device?.componentDiagnostics)
    ? device.componentDiagnostics
    : [];
  const installedApps = Array.isArray(device?.installedApps)
    ? device.installedApps
    : [];
  const [resolvedLocation, setResolvedLocation] = useState<{
    key: string;
    name: string | null;
  } | null>(null);
  const locationKey = device && hasValidLocation
    ? `${device.latitude!.toFixed(5)},${device.longitude!.toFixed(5)}`
    : null;

  useEffect(() => {
    let cancelled = false;

    if (!device) return;

    if (hasUsableLocationName(device.locationName)) return;

    if (!hasValidLocation) return;

    const key = `${device.latitude!.toFixed(5)},${device.longitude!.toFixed(5)}`;

    reverseGeocodeLocation(device.latitude, device.longitude).then((name) => {
      if (!cancelled) setResolvedLocation({ key, name });
    });

    return () => {
      cancelled = true;
    };
  }, [device, hasValidLocation]);

  const locationLabel = hasUsableLocationName(device?.locationName)
    ? device.locationName!.trim()
    : locationKey && resolvedLocation?.key === locationKey
      ? resolvedLocation.name || "-"
      : "-";

  if (!device) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Icon icon="mdi:devices" className="w-5 h-5" />
            Device Detail - {device.deviceCode}
            <span
              className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold ${getDeviceTypeBadge(device.deviceType)}`}
            >
              {device.deviceType || "SOUNDBOX"}
            </span>
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="info" className="w-full">
          <TabsList
            className={`grid w-full ${device.deviceType === "EDC" ? "grid-cols-5" : "grid-cols-3"}`}
          >
            <TabsTrigger value="info">
              <Icon icon="mdi:information" className="w-4 h-4 mr-1" />
              Info
            </TabsTrigger>
            {device.deviceType === "EDC" && (
              <TabsTrigger value="health">
                <Icon icon="mdi:heart-pulse" className="w-4 h-4 mr-1" />
                Health
              </TabsTrigger>
            )}
            <TabsTrigger value="network">
              <Icon icon="mdi:signal" className="w-4 h-4 mr-1" />
              Network
            </TabsTrigger>
            <TabsTrigger value="location">
              <Icon icon="mdi:map-marker" className="w-4 h-4 mr-1" />
              Location
            </TabsTrigger>
            {device.deviceType === "EDC" && (
              <TabsTrigger value="apps">
                <Icon icon="mdi:apps" className="w-4 h-4 mr-1" />
                Apps
              </TabsTrigger>
            )}
          </TabsList>

          {/* ================= TAB: INFO ================= */}
          <TabsContent value="info" className="space-y-4 mt-4">
            {/* Status Banner */}
            <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-800">
              <div className="flex items-center gap-3">
                <span
                  className={`px-3 py-1.5 rounded-full text-xs font-bold ${
                    online
                      ? "bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300"
                      : "bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300"
                  }`}
                >
                  {online ? "🟢 ONLINE" : "🔴 OFFLINE"}
                </span>
                <span className="text-gray-500 text-xs">
                  {device.lastSeenAt
                    ? `Last seen ${new Date(device.lastSeenAt).toLocaleString("id-ID")}`
                    : "No activity"}
                </span>
              </div>
            </div>

            {/* Device Info Grid */}
            <div className="grid grid-cols-2 gap-4">
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
                icon="mdi:tag"
                label="Device Type"
                value={device.deviceType || "SOUNDBOX"}
              />
              <InfoCard
                icon="mdi:application"
                label="App Version"
                value={device.appVersion || "-"}
              />
              <InfoCard
                icon="mdi:store"
                label="Merchant"
                value={device.merchant?.name || "-"}
              />
              <InfoCard
                icon="mdi:map-marker-radius"
                label="Location Name"
                value={locationLabel}
                wrap
              />

              {/* Battery dengan icon */}
              <div className="p-3 rounded-lg bg-gray-50 dark:bg-gray-800">
                <div className="flex items-center gap-2 text-xs text-gray-500 mb-1">
                  <Icon
                    icon={getBatteryIcon(device.batteryLevel, device.charging)}
                    className={`w-4 h-4 ${getBatteryColor(device.batteryLevel)}`}
                  />
                  Battery
                </div>
                <p className="font-bold text-gray-900 dark:text-gray-100">
                  {device.batteryLevel !== undefined
                    ? `${device.batteryLevel}% ${device.charging ? "⚡ Charging" : ""}`
                    : "-"}
                </p>
              </div>
            </div>

            {/* Memory & Storage */}
            {(device.totalMemory !== undefined ||
              device.totalStorage !== undefined) && (
              <div className="mt-2">
                <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                  <Icon icon="mdi:memory" className="w-4 h-4" />
                  Memory & Storage
                </h4>
                <div className="space-y-3">
                  {/* RAM */}
                  {device.totalMemory !== undefined && (
                    <div className="p-3 rounded-lg bg-gray-50 dark:bg-gray-800">
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2 text-xs text-gray-500">
                          <Icon
                            icon="mdi:memory"
                            className="w-4 h-4 text-purple-500"
                          />
                          RAM
                        </div>
                        <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                          {device.availableMemory ?? 0} MB /{" "}
                          {device.totalMemory} MB
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full transition-all ${
                            device.totalMemory > 0 &&
                            (device.totalMemory -
                              (device.availableMemory ?? 0)) /
                              device.totalMemory >
                              0.9
                              ? "bg-red-500"
                              : (device.totalMemory -
                                    (device.availableMemory ?? 0)) /
                                    device.totalMemory >
                                  0.7
                                ? "bg-yellow-500"
                                : "bg-purple-500"
                          }`}
                          style={{
                            width:
                              device.totalMemory > 0
                                ? `${Math.min(100, ((device.totalMemory - (device.availableMemory ?? 0)) / device.totalMemory) * 100)}%`
                                : "0%",
                          }}
                        />
                      </div>
                      <p className="text-xs text-gray-400 mt-1">
                        Terpakai:{" "}
                        {device.totalMemory - (device.availableMemory ?? 0)} MB
                        (
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

                  {/* Storage */}
                  {device.totalStorage !== undefined && (
                    <div className="p-3 rounded-lg bg-gray-50 dark:bg-gray-800">
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2 text-xs text-gray-500">
                          <Icon
                            icon="mdi:harddisk"
                            className="w-4 h-4 text-blue-500"
                          />
                          Storage
                        </div>
                        <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                          {device.availableStorage ?? 0} MB /{" "}
                          {device.totalStorage} MB
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full transition-all ${
                            device.totalStorage > 0 &&
                            (device.totalStorage -
                              (device.availableStorage ?? 0)) /
                              device.totalStorage >
                              0.9
                              ? "bg-red-500"
                              : (device.totalStorage -
                                    (device.availableStorage ?? 0)) /
                                    device.totalStorage >
                                  0.7
                                ? "bg-yellow-500"
                                : "bg-blue-500"
                          }`}
                          style={{
                            width:
                              device.totalStorage > 0
                                ? `${Math.min(100, ((device.totalStorage - (device.availableStorage ?? 0)) / device.totalStorage) * 100)}%`
                                : "0%",
                          }}
                        />
                      </div>
                      <p className="text-xs text-gray-400 mt-1">
                        Terpakai:{" "}
                        {device.totalStorage - (device.availableStorage ?? 0)}{" "}
                        MB (
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

          {device.deviceType === "EDC" && (
            <TabsContent value="health" className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
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
                  icon="mdi:chip"
                  label="Android Version"
                  value={device.androidVersion || "-"}
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
                  icon="mdi:clock-outline"
                  label="Heartbeat Updated"
                  value={
                    device.lastSeenAt
                      ? new Date(device.lastSeenAt).toLocaleString("id-ID")
                      : "-"
                  }
                />
              </div>

              <SectionList
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

              <SectionList
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
                <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800">
                  <h4 className="mb-3 text-sm font-semibold text-gray-800 dark:text-gray-100">
                    Raw Device Info
                  </h4>
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    {Object.entries(device.rawInfo).map(([key, value]) => (
                      <div
                        key={key}
                        className="rounded bg-white p-2 dark:bg-slate-900"
                      >
                        <p className="text-gray-500">{key}</p>
                        <p className="font-medium text-gray-900 dark:text-gray-100 break-all">
                          {String(value)}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </TabsContent>
          )}

          {/* ================= TAB: NETWORK ================= */}
          <TabsContent value="network" className="space-y-4 mt-4">
            {/* Connection Type */}
            <div className="p-4 rounded-lg bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-100 dark:border-blue-800">
              <div className="flex items-center gap-4">
                <div
                  className={`p-3 rounded-full ${device.commode === "WIFI" ? "bg-blue-100 dark:bg-blue-800" : "bg-green-100 dark:bg-green-800"}`}
                >
                  <Icon
                    icon={
                      device.commode === "WIFI"
                        ? "mdi:wifi"
                        : "mdi:signal-cellular-3"
                    }
                    className={`w-8 h-8 ${device.commode === "WIFI" ? "text-blue-600" : "text-green-600"}`}
                  />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Connection Type</p>
                  <p className="text-xl font-bold text-gray-900 dark:text-white">
                    {device.commode || device.network || "-"}
                  </p>
                </div>
              </div>
            </div>

            {/* Network Details Grid */}
            <div className="grid grid-cols-2 gap-4">
              {/* Signal Strength */}
              <div className="p-3 rounded-lg bg-gray-50 dark:bg-gray-800">
                <div className="flex items-center gap-2 text-xs text-gray-500 mb-1">
                  <Icon
                    icon={getSignalIcon(device.signal)}
                    className={`w-4 h-4 ${getSignalColor(device.signal)}`}
                  />
                  Signal Strength
                </div>
                <p className="font-bold text-gray-900 dark:text-gray-100">
                  {device.signal !== undefined ? `${device.signal} dBm` : "-"}
                </p>
              </div>

              {/* IP Address */}
              <InfoCard
                icon="mdi:ip-network"
                label="IP Address"
                value={device.ipAddress || "-"}
              />

              {/* Carrier */}
              <InfoCard
                icon="mdi:sim"
                label="Carrier / Operator"
                value={device.carrier || "-"}
              />

              {/* Network Type */}
              <InfoCard
                icon="mdi:antenna"
                label="Network Type"
                value={device.network || device.commode || "-"}
              />
            </div>

            {/* Cell Tower Info - only show for SIM mode with valid data */}
            {hasCellTower && (
              <div className="mt-4">
                <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                  <Icon icon="mdi:broadcast-tower" className="w-4 h-4" />
                  Cell Tower Information
                </h4>
                <div className="grid grid-cols-4 gap-3">
                  <CellTowerCard
                    label="MCC"
                    value={device.mcc}
                    tooltip="Mobile Country Code"
                  />
                  <CellTowerCard
                    label="MNC"
                    value={device.mnc}
                    tooltip="Mobile Network Code"
                  />
                  <CellTowerCard
                    label="LAC"
                    value={device.lac}
                    tooltip="Location Area Code"
                  />
                  <CellTowerCard
                    label="Cell ID"
                    value={device.cellId}
                    tooltip="Cell Tower ID"
                  />
                </div>
              </div>
            )}

            {/* WiFi Info - show when in WIFI mode */}
            {isWifiMode && (
              <div className="mt-4">
                <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                  <Icon icon="mdi:wifi" className="w-4 h-4" />
                  WiFi Connection
                </h4>
                <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                  <div className="flex items-center gap-2">
                    <Icon icon="mdi:wifi" className="w-5 h-5 text-blue-600" />
                    <div>
                      <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                        Connected via WiFi
                      </p>
                      <p className="text-xs text-blue-600 dark:text-blue-400">
                        IP: {device.ipAddress || "-"}
                      </p>
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    ℹ️ Cell tower data tidak tersedia saat menggunakan koneksi
                    WiFi
                  </p>
                </div>
              </div>
            )}
          </TabsContent>

          {/* ================= TAB: LOCATION ================= */}
          <TabsContent value="location" className="space-y-4 mt-4">
            {/* Map - only show if location is valid for current mode */}
            <div className="h-[250px] rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700">
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

            {/* Location Details */}
            <div className="grid grid-cols-2 gap-4">
              <InfoCard
                icon="mdi:latitude"
                label="Latitude"
                value={hasValidLocation ? device.latitude?.toFixed(6) : "-"}
              />
              <InfoCard
                icon="mdi:longitude"
                label="Longitude"
                value={hasValidLocation ? device.longitude?.toFixed(6) : "-"}
              />
              <InfoCard
                icon="mdi:crosshairs-gps"
                label="Location Source"
                value={
                  hasValidLocation && device.locationSource
                    ? getLocationSourceLabel(device.locationSource)
                    : "-"
                }
              />
              <InfoCard
                icon="mdi:target"
                label="Accuracy"
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
                label="Location Name"
                value={locationLabel}
                wrap
              />
            </div>

            {/* Cell Tower for Location - only show for SIM mode */}
            {hasCellTower && (
              <div className="p-4 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
                <div className="flex items-start gap-3">
                  <Icon
                    icon="mdi:broadcast-tower"
                    className="w-5 h-5 text-amber-600 mt-0.5"
                  />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
                      Cell Tower Data (SIM)
                    </p>
                    <div className="grid grid-cols-4 gap-2 mt-2">
                      <div className="bg-white dark:bg-gray-800 rounded p-2 text-center">
                        <p className="text-[10px] text-gray-500">MCC</p>
                        <p className="text-sm font-mono font-bold">
                          {device.mcc ?? "-"}
                        </p>
                        <p className="text-[9px] text-gray-400">
                          {device.mcc === 510 ? "Indonesia" : ""}
                        </p>
                      </div>
                      <div className="bg-white dark:bg-gray-800 rounded p-2 text-center">
                        <p className="text-[10px] text-gray-500">MNC</p>
                        <p className="text-sm font-mono font-bold">
                          {device.mnc ?? "-"}
                        </p>
                        <p className="text-[9px] text-gray-400">
                          {device.mnc === 10
                            ? "Telkomsel"
                            : device.mnc === 11
                              ? "XL"
                              : device.mnc === 13
                                ? "Indosat"
                                : ""}
                        </p>
                      </div>
                      <div className="bg-white dark:bg-gray-800 rounded p-2 text-center">
                        <p className="text-[10px] text-gray-500">LAC</p>
                        <p className="text-sm font-mono font-bold">
                          {device.lac ?? "-"}
                        </p>
                      </div>
                      <div className="bg-white dark:bg-gray-800 rounded p-2 text-center">
                        <p className="text-[10px] text-gray-500">Cell ID</p>
                        <p className="text-sm font-mono font-bold">
                          {device.cellId ?? "-"}
                        </p>
                      </div>
                    </div>
                    {hasValidLocation && (
                      <p className="text-xs text-green-600 dark:text-green-400 mt-2 flex items-center gap-1">
                        <Icon icon="mdi:check-circle" className="w-3 h-3" />
                        Lokasi berhasil di-resolve dari cell tower
                      </p>
                    )}
                    {!hasValidLocation && (
                      <p className="text-xs text-amber-600/70 dark:text-amber-400/70 mt-2">
                        ⚠️ Koordinat belum tersedia dari device.
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* WiFi Info for Location */}
            {isWifiMode && (
              <div className="p-4 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
                <div className="flex items-start gap-3">
                  <Icon
                    icon="mdi:wifi"
                    className="w-5 h-5 text-blue-600 mt-0.5"
                  />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-blue-800 dark:text-blue-200">
                      WiFi Connection
                    </p>
                    <div className="mt-2 space-y-1">
                      <div className="flex items-center gap-2 text-sm">
                        <Icon
                          icon="mdi:ip-network"
                          className="w-4 h-4 text-blue-500"
                        />
                        <span className="text-gray-600 dark:text-gray-400">
                          IP Address:
                        </span>
                        <span className="font-mono font-medium">
                          {device.ipAddress || "-"}
                        </span>
                      </div>
                    </div>
                    {hasValidLocation && (
                      <p className="text-xs text-green-600 dark:text-green-400 mt-2 flex items-center gap-1">
                        <Icon icon="mdi:check-circle" className="w-3 h-3" />
                        Lokasi berhasil di-resolve dari WiFi Access Points (via{" "}
                        {device.locationSource})
                      </p>
                    )}
                    {!hasValidLocation && (
                      <p className="text-xs text-blue-600/70 dark:text-blue-400/70 mt-2">
                        ℹ️ Menunggu data WiFi AP untuk resolve lokasi via
                        Mozilla MLS
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {!hasValidLocation && !hasCellTower && !isWifiMode && (
              <div className="p-4 rounded-lg bg-gray-50 dark:bg-gray-800 text-center">
                <Icon
                  icon="mdi:map-marker-off"
                  className="w-12 h-12 mx-auto text-gray-400 mb-2"
                />
                <p className="text-sm text-gray-500">
                  Data lokasi belum tersedia
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  Device belum mengirim data lokasi atau cell tower
                </p>
              </div>
            )}
          </TabsContent>

          {device.deviceType === "EDC" && (
            <TabsContent value="apps" className="space-y-4 mt-4">
              <div className="rounded-lg border border-gray-200 bg-white dark:border-gray-700 dark:bg-slate-900">
                <div className="border-b border-gray-100 px-4 py-3 dark:border-gray-800">
                  <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                    Installed Apps
                  </h4>
                  <p className="text-xs text-gray-500">
                    Daftar aplikasi yang dilaporkan device.
                  </p>
                </div>
                <div className="max-h-[320px] overflow-auto">
                  <table className="w-full text-xs">
                    <thead className="bg-gray-50 text-left uppercase text-[11px] text-gray-500 dark:bg-slate-800">
                      <tr>
                        <th className="px-4 py-2">App</th>
                        <th className="px-4 py-2">Package</th>
                        <th className="px-4 py-2">Version</th>
                        <th className="px-4 py-2">Type</th>
                      </tr>
                    </thead>
                    <tbody>
                      {installedApps.length === 0 ? (
                        <tr>
                          <td className="px-4 py-4 text-gray-500" colSpan={4}>
                            Belum ada data aplikasi terinstal.
                          </td>
                        </tr>
                      ) : (
                        installedApps.map((app, idx) => (
                          <tr
                            key={`${app.packageName || app.name || "app"}-${idx}`}
                            className="border-t border-gray-100 dark:border-gray-800"
                          >
                            <td className="px-4 py-2 font-medium text-gray-900 dark:text-gray-100">
                              {app.name || "-"}
                            </td>
                            <td className="px-4 py-2 text-gray-600 dark:text-gray-300 break-all">
                              {app.packageName || "-"}
                            </td>
                            <td className="px-4 py-2 text-gray-600 dark:text-gray-300">
                              {app.versionName || "-"}
                            </td>
                            <td className="px-4 py-2 text-gray-600 dark:text-gray-300">
                              {app.isSystemApp ? "System" : "User"}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </TabsContent>
          )}
        </Tabs>
      </DialogContent>
    </Dialog>
  );
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
    <div className="p-3 rounded-lg bg-gray-50 dark:bg-gray-800">
      <div className="flex items-center gap-2 text-xs text-gray-500 mb-1">
        <Icon icon={icon} className="w-4 h-4" />
        {label}
      </div>
      <p
        className={`font-bold text-gray-900 dark:text-gray-100 ${wrap ? "whitespace-normal break-words" : "truncate"}`}
        title={wrap ? undefined : value}
      >
        {value}
      </p>
    </div>
  );
}

function CellTowerCard({
  label,
  value,
  tooltip,
}: {
  label: string;
  value?: number;
  tooltip: string;
}) {
  return (
    <div
      className="p-2 rounded bg-gray-100 dark:bg-gray-700 text-center"
      title={tooltip}
    >
      <p className="text-[10px] text-gray-500 dark:text-gray-400">{label}</p>
      <p className="text-sm font-mono font-bold text-gray-900 dark:text-gray-100">
        {value ?? "-"}
      </p>
    </div>
  );
}

function SectionList({
  title,
  emptyText,
  items,
}: {
  title: string;
  emptyText: string;
  items: Array<{
    key: string;
    title: string;
    status: string;
    detail: string;
    isWarning: boolean;
  }>;
}) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-slate-900">
      <h4 className="mb-3 text-sm font-semibold text-gray-900 dark:text-gray-100">
        {title}
      </h4>
      {items.length === 0 ? (
        <p className="text-xs text-gray-500">{emptyText}</p>
      ) : (
        <div className="space-y-3">
          {items.map((item) => (
            <div
              key={item.key}
              className="rounded-lg border border-gray-100 bg-gray-50 p-3 dark:border-gray-800 dark:bg-gray-800"
            >
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                  {item.title}
                </p>
                <span
                  className={`rounded-full px-2 py-1 text-[11px] font-semibold ${item.isWarning ? "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300" : "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300"}`}
                >
                  {item.status}
                </span>
              </div>
              <p className="mt-1 text-xs text-gray-600 dark:text-gray-300">
                {item.detail}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
