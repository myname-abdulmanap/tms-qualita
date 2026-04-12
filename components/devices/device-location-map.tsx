"use client";

import { useEffect, useRef, useCallback } from "react";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type LeafletMap = any;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type LeafletMarker = any;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type LeafletCircle = any;

type DeviceLocationMapProps = {
  latitude?: number;
  longitude?: number;
  accuracy?: number; // meters
  locationSource?: string;
  locationName?: string;
  deviceName?: string;
  className?: string;
};

// Get source display info
function getSourceInfo(source?: string): {
  label: string;
  icon: string;
  color: string;
} {
  const sourceMap: Record<
    string,
    { label: string; icon: string; color: string }
  > = {
    GPS: { label: "GPS", icon: "📍", color: "#22c55e" },
    CELL_TOWER: { label: "Cell Tower", icon: "📡", color: "#f59e0b" },
    WIFI: { label: "WiFi", icon: "📶", color: "#3b82f6" },
    GOOGLE: { label: "Google", icon: "🌐", color: "#4285f4" },
    OPENCELLID: { label: "OpenCellID", icon: "🌐", color: "#8b5cf6" },
    UNWIREDLABS: { label: "UnwiredLabs", icon: "🌐", color: "#8b5cf6" },
    MOZILLA_MLS: { label: "Mozilla MLS", icon: "🌐", color: "#06b6d4" },
    FALLBACK_MCC_MNC: {
      label: "Estimasi (Carrier)",
      icon: "⚠️",
      color: "#ef4444",
    },
    FALLBACK_COUNTRY: {
      label: "Estimasi (Negara)",
      icon: "⚠️",
      color: "#ef4444",
    },
  };
  return (
    sourceMap[source || ""] || {
      label: source || "Unknown",
      icon: "❓",
      color: "#6b7280",
    }
  );
}

// Get accuracy message
function getAccuracyMessage(locationSource?: string): string {
  if (!locationSource)
    return "Data cell tower atau WiFi akan digunakan untuk estimasi lokasi";

  switch (locationSource) {
    case "GPS":
      return "Lokasi dari GPS device (akurasi tinggi)";
    case "CELL_TOWER":
    case "OPENCELLID":
    case "UNWIREDLABS":
    case "GOOGLE":
      return "Lokasi di-resolve dari Cell Tower (akurasi sedang)";
    case "WIFI":
    case "MOZILLA_MLS":
      return "Lokasi di-resolve dari WiFi AP (akurasi sedang)";
    case "FALLBACK_MCC_MNC":
    case "FALLBACK_COUNTRY":
      return "Lokasi estimasi dari carrier/negara (akurasi rendah)";
    default:
      return "Data cell tower atau WiFi akan digunakan untuk estimasi lokasi";
  }
}

export default function DeviceLocationMap({
  latitude,
  longitude,
  accuracy,
  locationSource,
  locationName,
  deviceName = "Device",
  className = "",
}: DeviceLocationMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<LeafletMap>(null);
  const markerRef = useRef<LeafletMarker>(null);
  const circleRef = useRef<LeafletCircle>(null);
  const initializedRef = useRef(false);

  const sourceInfo = getSourceInfo(locationSource);
  const hasLocation = latitude && longitude;

  // Initialize map
  const initMap = useCallback(() => {
    if (!mapRef.current || mapInstanceRef.current || initializedRef.current)
      return;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const L = (window as any).L;
    if (!L) return;

    initializedRef.current = true;

    // Default ke Indonesia jika tidak ada koordinat
    const defaultLat = latitude || -6.2088;
    const defaultLng = longitude || 106.8456;
    const hasLoc = latitude && longitude;

    mapInstanceRef.current = L.map(mapRef.current, {
      attributionControl: false,
    }).setView([defaultLat, defaultLng], hasLoc ? 15 : 5);

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "",
    }).addTo(mapInstanceRef.current);

    L.control
      .attribution({ prefix: "TMS Qualita" })
      .addTo(mapInstanceRef.current);

    if (hasLoc && latitude && longitude) {
      const popupContent = `
        <div style="min-width: 180px; max-width: 260px;">
          <b>${deviceName}</b><br/>
          <small style="color: ${sourceInfo.color};">
            ${sourceInfo.icon} ${sourceInfo.label}
          </small>
          <hr style="margin: 4px 0; border-color: #e5e7eb;"/>
          <span style="font-size: 11px;">
            📍 ${latitude.toFixed(6)}, ${longitude.toFixed(6)}
            ${accuracy ? `<br/>🎯 Akurasi: ~${accuracy >= 1000 ? (accuracy / 1000).toFixed(1) + " km" : accuracy + " m"}` : ""}
            ${locationName ? `<br/>🏷️ ${locationName}` : ""}
          </span>
        </div>
      `;

      const phoneIcon = L.divIcon({
        html: `<div style="width:32px;height:32px;background:#0ea5e9;border-radius:50%;border:2px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.3);display:flex;align-items:center;justify-content:center;">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="white"><path d="M17,19H7V5H17M17,1H7C5.89,1 5,1.89 5,3V21A2,2 0 0,0 7,23H17A2,2 0 0,0 19,21V3C19,1.89 18.1,1 17,1Z"/></svg>
        </div>`,
        className: "",
        iconSize: [32, 32],
        iconAnchor: [16, 16],
        popupAnchor: [0, -18],
      });

      markerRef.current = L.marker([defaultLat, defaultLng], {
        icon: phoneIcon,
      })
        .addTo(mapInstanceRef.current)
        .bindPopup(popupContent)
        .openPopup();

      // Add accuracy circle
      if (accuracy && accuracy > 0) {
        circleRef.current = L.circle([defaultLat, defaultLng], {
          radius: accuracy,
          color: sourceInfo.color,
          fillColor: sourceInfo.color,
          fillOpacity: 0.1,
          weight: 2,
        }).addTo(mapInstanceRef.current);

        // Fit bounds to show full circle if large
        if (accuracy > 100) {
          mapInstanceRef.current.fitBounds(circleRef.current.getBounds(), {
            padding: [20, 20],
          });
        }
      }
    }
  }, [latitude, longitude, accuracy, locationName, deviceName, sourceInfo]);

  // Load Leaflet and initialize map
  useEffect(() => {
    // Load Leaflet CSS
    if (!document.querySelector('link[href*="leaflet.css"]')) {
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
      document.head.appendChild(link);
    }

    // Load Leaflet JS
    const loadLeaflet = async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
        initializedRef.current = false;
      }
    };
  }, [initMap]);

  // Update map when location changes
  useEffect(() => {
    if (mapInstanceRef.current && latitude && longitude) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const L = (window as any).L;
      const latlng = [latitude, longitude];

      mapInstanceRef.current.setView(latlng, 15);

      // Update or create marker
      const popupContent = `
        <div style="min-width: 180px; max-width: 260px;">
          <b>${deviceName}</b><br/>
          <small style="color: ${sourceInfo.color};">
            ${sourceInfo.icon} ${sourceInfo.label}
          </small>
          <hr style="margin: 4px 0; border-color: #e5e7eb;"/>
          <span style="font-size: 11px;">
            📍 ${latitude.toFixed(6)}, ${longitude.toFixed(6)}
            ${accuracy ? `<br/>🎯 Akurasi: ~${accuracy >= 1000 ? (accuracy / 1000).toFixed(1) + " km" : accuracy + " m"}` : ""}
            ${locationName ? `<br/>🏷️ ${locationName}` : ""}
          </span>
        </div>
      `;

      if (markerRef.current) {
        markerRef.current.setLatLng(latlng);
        markerRef.current.bindPopup(popupContent);
      } else {
        const phoneIconUpd = L.divIcon({
          html: `<div style="width:32px;height:32px;background:#0ea5e9;border-radius:50%;border:2px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.3);display:flex;align-items:center;justify-content:center;">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="white"><path d="M17,19H7V5H17M17,1H7C5.89,1 5,1.89 5,3V21A2,2 0 0,0 7,23H17A2,2 0 0,0 19,21V3C19,1.89 18.1,1 17,1Z"/></svg>
          </div>`,
          className: "",
          iconSize: [32, 32],
          iconAnchor: [16, 16],
          popupAnchor: [0, -18],
        });

        markerRef.current = L.marker(latlng, { icon: phoneIconUpd })
          .addTo(mapInstanceRef.current)
          .bindPopup(popupContent)
          .openPopup();
      }

      // Update or create accuracy circle
      if (accuracy && accuracy > 0) {
        if (circleRef.current) {
          circleRef.current.setLatLng(latlng);
          circleRef.current.setRadius(accuracy);
        } else {
          circleRef.current = L.circle(latlng, {
            radius: accuracy,
            color: sourceInfo.color,
            fillColor: sourceInfo.color,
            fillOpacity: 0.1,
            weight: 2,
          }).addTo(mapInstanceRef.current);
        }

        // Fit bounds to show full circle
        if (accuracy > 100) {
          mapInstanceRef.current.fitBounds(circleRef.current.getBounds(), {
            padding: [20, 20],
          });
        }
      } else if (circleRef.current) {
        mapInstanceRef.current.removeLayer(circleRef.current);
        circleRef.current = null;
      }
    }
  }, [latitude, longitude, accuracy, locationName, deviceName, sourceInfo]);

  return (
    <div className={`relative ${className}`}>
      {!hasLocation && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 dark:bg-gray-800 rounded-lg z-10">
          <div className="text-center text-gray-500">
            <svg
              className="w-12 h-12 mx-auto mb-2 opacity-50"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
            <p className="text-sm">Lokasi belum tersedia</p>
            <p className="text-xs mt-1">{getAccuracyMessage(locationSource)}</p>
          </div>
        </div>
      )}
      {/* Source badge overlay */}
      {hasLocation && locationSource && (
        <div className="absolute top-2 left-2 z-[1000] bg-white dark:bg-gray-800 rounded-lg shadow-md px-2 py-1 text-xs font-medium flex items-center gap-1">
          <span>{sourceInfo.icon}</span>
          <span style={{ color: sourceInfo.color }}>{sourceInfo.label}</span>
          {accuracy && (
            <span className="text-gray-400 ml-1">
              (~
              {accuracy >= 1000
                ? (accuracy / 1000).toFixed(1) + "km"
                : accuracy + "m"}
              )
            </span>
          )}
        </div>
      )}
      <div
        ref={mapRef}
        className={`w-full h-full rounded-lg ${!hasLocation ? "opacity-30" : ""}`}
        style={{ minHeight: 200 }}
      />
    </div>
  );
}
