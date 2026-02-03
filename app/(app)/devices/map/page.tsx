"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Icon } from "@iconify/react";
import Link from "next/link";

type Device = {
  id: string;
  deviceCode: string;
  serialNumber: string;
  model?: string;
  status: string;
  firmware?: string;
  batteryLevel?: number;
  charging?: boolean;
  signal?: number;
  commode?: string;
  ipAddress?: string;
  lastSeenAt?: string;
  merchant?: { name: string };
  carrier?: string;
  latitude?: number;
  longitude?: number;
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

export default function DeviceMapPage() {
  const [devices, setDevices] = useState<Device[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDevice, setSelectedDevice] = useState<Device | null>(null);
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);

  useEffect(() => {
    loadDevices();
  }, []);

  useEffect(() => {
    // Load Leaflet
    if (!document.querySelector('link[href*="leaflet.css"]')) {
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
      document.head.appendChild(link);
    }

    const loadLeaflet = async () => {
      if (!(window as any).L) {
        await new Promise<void>((resolve) => {
          const script = document.createElement("script");
          script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
          script.onload = () => resolve();
          document.head.appendChild(script);
        });
      }
      initMap();
    };

    loadLeaflet();

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (mapInstanceRef.current && devices.length > 0) {
      updateMarkers();
    }
  }, [devices]);

  const loadDevices = async () => {
    try {
      const res = await fetch("/api/devices");
      if (res.ok) {
        const data = await res.json();
        setDevices(data);
      }
    } catch (error) {
      console.error("Error loading devices:", error);
    } finally {
      setLoading(false);
    }
  };

  const initMap = () => {
    if (!mapRef.current || mapInstanceRef.current) return;

    const L = (window as any).L;
    if (!L) return;

    // Default ke Indonesia
    mapInstanceRef.current = L.map(mapRef.current).setView([-2.5, 118], 5);

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    }).addTo(mapInstanceRef.current);
  };

  const updateMarkers = () => {
    const L = (window as any).L;
    if (!L || !mapInstanceRef.current) return;

    // Clear existing markers
    markersRef.current.forEach((marker) => marker.remove());
    markersRef.current = [];

    const bounds: [number, number][] = [];

    devices.forEach((device) => {
      if (device.latitude && device.longitude) {
        const online = isOnline(device.lastSeenAt);

        // Custom icon berdasarkan status
        const iconHtml = `
          <div class="relative">
            <div class="w-8 h-8 rounded-full ${online ? "bg-green-500" : "bg-red-500"} border-2 border-white shadow-lg flex items-center justify-center">
              <svg class="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M17,19H7V5H17M17,1H7C5.89,1 5,1.89 5,3V21A2,2 0 0,0 7,23H17A2,2 0 0,0 19,21V3C19,1.89 18.1,1 17,1Z"/>
              </svg>
            </div>
            ${online ? '<div class="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full animate-ping"></div>' : ""}
          </div>
        `;

        const customIcon = L.divIcon({
          html: iconHtml,
          className: "custom-device-marker",
          iconSize: [32, 32],
          iconAnchor: [16, 32],
          popupAnchor: [0, -32],
        });

        const marker = L.marker([device.latitude, device.longitude], {
          icon: customIcon,
        }).addTo(mapInstanceRef.current).bindPopup(`
            <div class="min-w-[200px]">
              <div class="font-bold text-sm mb-2">${device.deviceCode}</div>
              <div class="text-xs space-y-1">
                <div><span class="text-gray-500">SN:</span> ${device.serialNumber}</div>
                <div><span class="text-gray-500">Status:</span> 
                  <span class="${online ? "text-green-600" : "text-red-600"} font-medium">
                    ${online ? "ONLINE" : "OFFLINE"}
                  </span>
                </div>
                <div><span class="text-gray-500">Merchant:</span> ${device.merchant?.name || "-"}</div>
                <div><span class="text-gray-500">Battery:</span> ${device.batteryLevel ?? "-"}%</div>
                <div><span class="text-gray-500">Signal:</span> ${device.signal ?? "-"} dBm</div>
                <div><span class="text-gray-500">Carrier:</span> ${device.carrier || "-"}</div>
              </div>
            </div>
          `);

        marker.on("click", () => setSelectedDevice(device));
        markersRef.current.push(marker);
        bounds.push([device.latitude, device.longitude]);
      }
    });

    // Fit bounds jika ada markers
    if (bounds.length > 0) {
      mapInstanceRef.current.fitBounds(bounds, {
        padding: [50, 50],
        maxZoom: 15,
      });
    }
  };

  const devicesWithLocation = devices.filter((d) => d.latitude && d.longitude);
  const onlineDevices = devices.filter((d) => isOnline(d.lastSeenAt));

  return (
    <div className="h-[calc(100vh-120px)] flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Icon
              icon="mdi:map-marker-multiple"
              className="w-7 h-7 text-blue-500"
            />
            Device Map
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Lokasi semua device dalam peta
          </p>
        </div>
        <Link href="/devices">
          <Button variant="outline">
            <Icon icon="mdi:view-list" className="w-4 h-4 mr-2" />
            List View
          </Button>
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-4">
        <StatCard
          icon="mdi:devices"
          label="Total Devices"
          value={devices.length}
          color="blue"
        />
        <StatCard
          icon="mdi:map-marker"
          label="With Location"
          value={devicesWithLocation.length}
          color="green"
        />
        <StatCard
          icon="mdi:circle"
          label="Online"
          value={onlineDevices.length}
          color="emerald"
        />
        <StatCard
          icon="mdi:circle-off-outline"
          label="Offline"
          value={devices.length - onlineDevices.length}
          color="red"
        />
      </div>

      {/* Map Container */}
      <div className="flex-1 flex gap-4">
        {/* Map */}
        <div className="flex-1 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700 relative">
          {loading && (
            <div className="absolute inset-0 bg-gray-100 dark:bg-gray-800 flex items-center justify-center z-10">
              <div className="text-center">
                <Icon
                  icon="mdi:loading"
                  className="w-8 h-8 animate-spin text-blue-500 mx-auto"
                />
                <p className="text-sm text-gray-500 mt-2">Loading devices...</p>
              </div>
            </div>
          )}
          <div ref={mapRef} className="w-full h-full" />
        </div>

        {/* Sidebar - Device List */}
        <div className="w-80 bg-white dark:bg-slate-900 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden flex flex-col">
          <div className="p-3 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-slate-800">
            <h3 className="font-semibold text-sm flex items-center gap-2">
              <Icon icon="mdi:format-list-bulleted" className="w-4 h-4" />
              Device List ({devicesWithLocation.length} with location)
            </h3>
          </div>
          <div className="flex-1 overflow-y-auto">
            {devicesWithLocation.length === 0 ? (
              <div className="p-4 text-center text-gray-500 text-sm">
                <Icon
                  icon="mdi:map-marker-off"
                  className="w-8 h-8 mx-auto mb-2 opacity-50"
                />
                <p>Belum ada device dengan data lokasi</p>
              </div>
            ) : (
              devicesWithLocation.map((device) => {
                const online = isOnline(device.lastSeenAt);
                const isSelected = selectedDevice?.id === device.id;
                return (
                  <div
                    key={device.id}
                    onClick={() => {
                      setSelectedDevice(device);
                      if (
                        mapInstanceRef.current &&
                        device.latitude &&
                        device.longitude
                      ) {
                        mapInstanceRef.current.setView(
                          [device.latitude, device.longitude],
                          15,
                        );
                      }
                    }}
                    className={`p-3 border-b border-gray-100 dark:border-gray-800 cursor-pointer transition-colors ${
                      isSelected
                        ? "bg-blue-50 dark:bg-blue-900/30"
                        : "hover:bg-gray-50 dark:hover:bg-slate-800"
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-medium text-sm text-gray-900 dark:text-white">
                          {device.deviceCode}
                        </p>
                        <p className="text-xs text-gray-500 mt-0.5">
                          {device.merchant?.name || "No Merchant"}
                        </p>
                      </div>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          online
                            ? "bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300"
                            : "bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300"
                        }`}
                      >
                        {online ? "ONLINE" : "OFFLINE"}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
                      <span className="flex items-center gap-1">
                        <Icon icon="mdi:battery" className="w-3 h-3" />
                        {device.batteryLevel ?? "-"}%
                      </span>
                      <span className="flex items-center gap-1">
                        <Icon icon="mdi:signal" className="w-3 h-3" />
                        {device.signal ?? "-"} dBm
                      </span>
                      <span className="flex items-center gap-1">
                        <Icon icon="mdi:sim" className="w-3 h-3" />
                        {device.carrier || "-"}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Custom CSS for markers */}
      <style jsx global>{`
        .custom-device-marker {
          background: transparent !important;
          border: none !important;
        }
        .leaflet-popup-content-wrapper {
          border-radius: 8px;
        }
        .leaflet-popup-content {
          margin: 12px;
        }
      `}</style>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  color,
}: {
  icon: string;
  label: string;
  value: number;
  color: string;
}) {
  const colorClasses: Record<string, string> = {
    blue: "bg-blue-50 dark:bg-blue-900/20 text-blue-600",
    green: "bg-green-50 dark:bg-green-900/20 text-green-600",
    emerald: "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600",
    red: "bg-red-50 dark:bg-red-900/20 text-red-600",
  };

  return (
    <div className={`p-4 rounded-lg ${colorClasses[color]}`}>
      <div className="flex items-center gap-3">
        <Icon icon={icon} className="w-8 h-8 opacity-80" />
        <div>
          <p className="text-2xl font-bold">{value}</p>
          <p className="text-xs opacity-70">{label}</p>
        </div>
      </div>
    </div>
  );
}
