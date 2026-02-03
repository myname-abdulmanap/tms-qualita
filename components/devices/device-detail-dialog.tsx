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
  model?: string;
  firmware?: string;
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
  locationSource?: string;
  locationUpdatedAt?: string;
  mcc?: number;
  mnc?: number;
  lac?: number;
  cellId?: number;
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

export default function DeviceDetailDialog({
  open,
  device,
  onClose,
}: {
  open: boolean;
  device: Device | null;
  onClose: () => void;
}) {
  if (!device) return null;

  const online = isOnline(device.lastSeenAt);
  const hasLocation = device.latitude && device.longitude;
  const hasCellTower = device.mcc || device.mnc || device.lac || device.cellId;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Icon icon="mdi:devices" className="w-5 h-5" />
            Device Detail - {device.deviceCode}
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="info" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="info">
              <Icon icon="mdi:information" className="w-4 h-4 mr-1" />
              Info
            </TabsTrigger>
            <TabsTrigger value="network">
              <Icon icon="mdi:signal" className="w-4 h-4 mr-1" />
              Network
            </TabsTrigger>
            <TabsTrigger value="location">
              <Icon icon="mdi:map-marker" className="w-4 h-4 mr-1" />
              Location
            </TabsTrigger>
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
                icon="mdi:chip"
                label="Firmware"
                value={device.firmware || "-"}
              />
              <InfoCard
                icon="mdi:store"
                label="Merchant"
                value={device.merchant?.name || "-"}
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
          </TabsContent>

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

            {/* Cell Tower Info */}
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
          </TabsContent>

          {/* ================= TAB: LOCATION ================= */}
          <TabsContent value="location" className="space-y-4 mt-4">
            {/* Map */}
            <div className="h-[250px] rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700">
              <DeviceLocationMap
                latitude={device.latitude}
                longitude={device.longitude}
                deviceName={device.deviceCode}
                className="h-full"
              />
            </div>

            {/* Location Details */}
            <div className="grid grid-cols-2 gap-4">
              <InfoCard
                icon="mdi:latitude"
                label="Latitude"
                value={device.latitude?.toFixed(6) || "-"}
              />
              <InfoCard
                icon="mdi:longitude"
                label="Longitude"
                value={device.longitude?.toFixed(6) || "-"}
              />
              <InfoCard
                icon="mdi:crosshairs-gps"
                label="Location Source"
                value={device.locationSource || "CELL_TOWER"}
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
            </div>

            {/* Cell Tower for Location */}
            {hasCellTower && (
              <div className="p-4 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
                <div className="flex items-start gap-3">
                  <Icon
                    icon="mdi:broadcast-tower"
                    className="w-5 h-5 text-amber-600 mt-0.5"
                  />
                  <div>
                    <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
                      Cell Tower Triangulation Available
                    </p>
                    <p className="text-xs text-amber-600 dark:text-amber-300 mt-1">
                      MCC: {device.mcc || 510} | MNC: {device.mnc || 0} | LAC:{" "}
                      {device.lac || 0} | Cell ID: {device.cellId || 0}
                    </p>
                    <p className="text-xs text-amber-600/70 dark:text-amber-400/70 mt-2">
                      Lokasi dapat diestimasi menggunakan data cell tower
                      melalui layanan seperti OpenCellID atau Google Geolocation
                      API.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {!hasLocation && !hasCellTower && (
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
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}

function InfoCard({
  icon,
  label,
  value,
}: {
  icon: string;
  label: string;
  value: string;
}) {
  return (
    <div className="p-3 rounded-lg bg-gray-50 dark:bg-gray-800">
      <div className="flex items-center gap-2 text-xs text-gray-500 mb-1">
        <Icon icon={icon} className="w-4 h-4" />
        {label}
      </div>
      <p
        className="font-bold text-gray-900 dark:text-gray-100 truncate"
        title={value}
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
