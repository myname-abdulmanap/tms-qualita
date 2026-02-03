"use client";

import { useEffect, useRef } from "react";

type DeviceLocationMapProps = {
  latitude?: number;
  longitude?: number;
  deviceName?: string;
  className?: string;
};

export default function DeviceLocationMap({
  latitude,
  longitude,
  deviceName = "Device",
  className = "",
}: DeviceLocationMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markerRef = useRef<any>(null);

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
    if (mapInstanceRef.current && latitude && longitude) {
      const L = (window as any).L;
      const latlng = [latitude, longitude];

      mapInstanceRef.current.setView(latlng, 15);

      if (markerRef.current) {
        markerRef.current.setLatLng(latlng);
      } else {
        markerRef.current = L.marker(latlng)
          .addTo(mapInstanceRef.current)
          .bindPopup(
            `<b>${deviceName}</b><br/>Lat: ${latitude}<br/>Lng: ${longitude}`,
          )
          .openPopup();
      }
    }
  }, [latitude, longitude, deviceName]);

  const initMap = () => {
    if (!mapRef.current || mapInstanceRef.current) return;

    const L = (window as any).L;
    if (!L) return;

    // Default ke Indonesia jika tidak ada koordinat
    const defaultLat = latitude || -6.2088;
    const defaultLng = longitude || 106.8456;
    const hasLocation = latitude && longitude;

    mapInstanceRef.current = L.map(mapRef.current).setView(
      [defaultLat, defaultLng],
      hasLocation ? 15 : 5,
    );

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    }).addTo(mapInstanceRef.current);

    if (hasLocation) {
      markerRef.current = L.marker([defaultLat, defaultLng])
        .addTo(mapInstanceRef.current)
        .bindPopup(
          `<b>${deviceName}</b><br/>Lat: ${latitude}<br/>Lng: ${longitude}`,
        )
        .openPopup();
    }
  };

  const hasLocation = latitude && longitude;

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
            <p className="text-xs mt-1">
              Data cell tower akan digunakan untuk estimasi lokasi
            </p>
          </div>
        </div>
      )}
      <div
        ref={mapRef}
        className={`w-full h-full rounded-lg ${!hasLocation ? "opacity-30" : ""}`}
        style={{ minHeight: "200px" }}
      />
    </div>
  );
}
