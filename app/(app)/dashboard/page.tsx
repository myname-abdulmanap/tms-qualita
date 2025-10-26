// app/dashboard/page.tsx
"use client";

import React, { useEffect } from "react";
import { Wifi, WifiOff, Monitor, Activity, Clock, TrendingUp } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useUi } from "@/lib/ui-store";

/** ---------- Leaflet minimal typings ---------- */
interface LeafletMap {
  setView(center: [number, number], zoom: number): LeafletMap;
  fitBounds(bounds: [number, number][], options?: { padding: [number, number] }): LeafletMap;
}
interface LeafletMarker {
  addTo(map: LeafletMap): LeafletMarker;
  bindPopup(content: string, options?: { closeButton?: boolean; className?: string }): LeafletMarker;
  on(event: string, handler: (this: LeafletMarker) => void): void;
  openPopup(): void;
}
interface LeafletTileLayer { addTo(map: LeafletMap): LeafletTileLayer; }
interface LeafletIcon {}
interface Leaflet {
  map(elementId: string): LeafletMap;
  tileLayer(url: string, options: { attribution: string; maxZoom: number }): LeafletTileLayer;
  marker(latlng: [number, number], options?: { icon?: LeafletIcon }): LeafletMarker;
  divIcon(options: {
    className?: string; html?: string; iconSize?: [number, number];
    iconAnchor?: [number, number]; popupAnchor?: [number, number];
  }): LeafletIcon;
}
declare global {
  interface Window { L?: Leaflet; }
}

/** ---------- Static gradients map (hindari class dinamis agar tidak di-purge Tailwind) ---------- */
const STAT_GRADIENTS = {
  green:  "bg-gradient-to-br from-emerald-400 to-teal-500",
  red:    "bg-gradient-to-br from-rose-400 to-pink-500",
  violet: "bg-gradient-to-br from-violet-400 to-purple-500",
  amber:  "bg-gradient-to-br from-amber-400 to-orange-500",
} as const;

export default function DashboardPage() {
  const { darkMode } = useUi();

  /** ---------- Leaflet Map ---------- */
  useEffect(() => {
    const loadLeaflet = async () => {
      if (typeof window === "undefined" || typeof document === "undefined") return;

      // CSS
      if (!document.querySelector('link[data-leaflet-css="1"]')) {
        const link = document.createElement("link");
        link.rel = "stylesheet";
        link.href = "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css";
        link.setAttribute("data-leaflet-css", "1");
        document.head.appendChild(link);
      }
      // JS
      if (!window.L) {
        await new Promise<void>((resolve) => {
          const script = document.createElement("script");
          script.src = "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.js";
          script.async = true;
          script.onload = () => resolve();
          document.body.appendChild(script);
        });
      }
      await new Promise((r) => setTimeout(r, 60));

      const mapContainer = document.getElementById("map");
      if (!mapContainer) return;

      const L = window.L;
      if (!L) return;
      if ((mapContainer as HTMLElement).dataset.mapInitialized === "1") return;
      (mapContainer as HTMLElement).dataset.mapInitialized = "1";

      const map = L.map("map").setView([-2.5, 118], 5);
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "© OpenStreetMap contributors",
        maxZoom: 19,
      }).addTo(map);

      const devices = [
        { name: "Sunmi P2",    lat: -6.1751, lng: 106.8650, location: "Jakarta Pusat",  serial: "PB0W239G20178", status: "online" },
        { name: "Sunmi V2 Pro",lat: -6.2615, lng: 106.8106, location: "Jakarta Selatan",serial: "SN9876543210",  status: "online" },
        { name: "PAX A920",    lat: -6.9175, lng: 107.6191, location: "Bandung",        serial: "0820517793",   status: "offline" },
        { name: "Centerm K9",  lat: -7.2575, lng: 112.7521, location: "Surabaya",       serial: "1234567890",   status: "online" },
        { name: "PAX A80",     lat:  3.5952, lng:  98.6722, location: "Medan",          serial: "PAX123456789", status: "online" },
        { name: "Centerm K8",  lat: -6.9667, lng: 110.4167, location: "Semarang",       serial: "CT987654321",  status: "offline" },
      ];

      const onlineIcon = L.divIcon({
        className: "custom-marker",
        html: `
          <div style="position: relative;">
            <div style="width: 40px; height: 40px; background: linear-gradient(135deg, #34d399, #14b8a6); border-radius: 50%; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 12px rgba(52, 211, 153, 0.5); border: 3px solid white; animation: pulse 2s infinite;">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="white" xmlns="http://www.w3.org/2000/svg">
                <rect x="5" y="2" width="14" height="20" rx="2" ry="2"/>
                <line x1="12" y1="18" x2="12" y2="18"/>
              </svg>
            </div>
            <div style="position: absolute; top: -2px; right: -2px; width: 12px; height: 12px; background: #10b981; border-radius: 50%; animation: ping 2s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
          </div>`,
        iconSize: [40, 40],
        iconAnchor: [20, 40],
        popupAnchor: [0, -40],
      });

      const offlineIcon = L.divIcon({
        className: "custom-marker",
        html: `
          <div style="width: 40px; height: 40px; background: linear-gradient(135deg, #94a3b8, #64748b); border-radius: 50%; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 12px rgba(148, 163, 184, 0.4); border: 3px solid white;">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="white" xmlns="http://www.w3.org/2000/svg">
              <rect x="5" y="2" width="14" height="20" rx="2" ry="2"/>
              <line x1="12" y1="18" x2="12" y2="18"/>
            </svg>
          </div>`,
        iconSize: [40, 40],
        iconAnchor: [20, 40],
        popupAnchor: [0, -40],
      });

      devices.forEach((device) => {
        const marker = L.marker([device.lat, device.lng], {
          icon: device.status === "online" ? onlineIcon : offlineIcon,
        }).addTo(map);

        const popupContent = `
          <div style="font-family: system-ui; padding: 4px;">
            <div style="font-weight: bold; font-size: 14px; margin-bottom: 6px; color: #1e293b;">${device.name}</div>
            <div style="display: flex; align-items: center; gap: 4px; margin-bottom: 4px;">
              <span style="width: 8px; height: 8px; border-radius: 50%; background: ${device.status === "online" ? "#10b981" : "#64748b"};"></span>
              <span style="font-size: 12px; color: ${device.status === "online" ? "#059669" : "#64748b"}; font-weight: 600;">
                ${device.status === "online" ? "Online" : "Offline"}
              </span>
            </div>
            <div style="font-size: 12px; color: #64748b; margin-bottom: 2px;">📍 ${device.location}</div>
            <div style="font-size: 11px; color: #94a3b8; font-family: monospace;">SN: ${device.serial}</div>
          </div>`;
        marker.bindPopup(popupContent, { closeButton: true, className: "custom-popup" });
        marker.on("mouseover", function (this: LeafletMarker) { this.openPopup(); });
      });

      const style = document.createElement("style");
      style.textContent = `
        @keyframes pulse { 0%,100%{transform:scale(1)} 50%{transform:scale(1.05)} }
        @keyframes ping { 75%,100%{transform:scale(2);opacity:0} }
        .custom-popup .leaflet-popup-content-wrapper{border-radius:12px;box-shadow:0 10px 25px rgba(0,0,0,.15);padding:8px}
        .custom-popup .leaflet-popup-tip{border-radius:2px}
        .leaflet-container{border-radius:12px}
      `;
      document.head.appendChild(style);

      const bounds: [number, number][] = devices.map(d => [d.lat, d.lng]);
      map.fitBounds(bounds, { padding: [50, 50] });
    };

    loadLeaflet();
  }, []);

  const recentActivity = [
    { device: "Sunmi P2",   action: "Device Online",    time: "2 minutes ago",  status: "success", icon: Wifi },
    { device: "PAX A920",   action: "Connection Lost",  time: "15 minutes ago", status: "error",   icon: WifiOff },
    { device: "Centerm K9", action: "Firmware Updated", time: "1 hour ago",     status: "success", icon: Activity },
  ] as const;

  return (
    <div className={`min-h-screen ${darkMode ? "bg-slate-950" : "bg-gradient-to-br from-slate-50 via-purple-50 to-pink-50"} transition-colors duration-300`}>
      {/* Welcome Card (ringkas) */}
      <Card className={`${darkMode ? "bg-gradient-to-br from-indigo-600 to-purple-700" : "bg-gradient-to-br from-indigo-500 to-purple-600"} border-0 shadow-xl rounded-3xl mb-6 overflow-hidden`}>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-3xl font-bold text-white mb-1">Welcome in,</h2>
              <h3 className="text-2xl font-semibold text-white/90 mb-3">Admin</h3>
              <p className="text-sm text-white/70">Terminal Management System | Manage EDC Devices</p>
            </div>

            {/* Hiasan simple */}
            <div className="relative w-[100px] h-[100px]">
                <svg xmlns="http://www.w3.org/2000/svg" width={100} height={100} viewBox="0 0 40 40"><g fill="none"><g clipPath="url(#SVGw9scfcdR)"><path fill="#00034a" stroke="#00034a" strokeMiterlimit={10} d="M31.967 2.682c-.441-.484-1.584-.162-2.553.72c-.969.883-1.396 1.99-.955 2.475c.26.286.387.434.648.72c.44.485 1.584.162 2.552-.72c.969-.882 1.396-1.99.955-2.474c-.26-.287-.387-.435-.647-.721Zm.396 4.93c-1.257.37-2.126 1.18-1.94 1.809c.379 1.287 1.885 1.462 3.075 1.11c1.257-.37 2.126-1.179 1.94-1.807c-.383-1.3-1.955-1.442-3.075-1.112Z" strokeWidth={1}></path><path fill="#00034a" stroke="#00034a" strokeLinecap="round" strokeMiterlimit={10} d="M34.276 13.098c-.826 0-1.497.67-1.497 1.498c0 .934 1.37 2.314 2.305 2.314c.827 0 1.497-.67 1.497-1.498c0-.934-1.37-2.314-2.305-2.314Z" strokeWidth={1}></path><path fill="#00034a" stroke="#00034a" strokeMiterlimit={10} d="M15.668 28.801c0 .66.091 1.317.272 1.953c.408.68 1.225 1.444 1.9 1.867a3.21 3.21 0 0 0 4.124-.613a9.3 9.3 0 0 0 .797-3.276a2.65 2.65 0 0 0 1.604-.749c.58-.769.919-1.693.973-2.654a3.1 3.1 0 0 0 1.302.467a2.7 2.7 0 0 0 2.372-.973c.467-.554.817-3.587.973-5.833l.029-.416c.154-2.197.348-4.979.02-5.563c-.584-1.034-1.78-2.078-3.01-2.178a3 3 0 0 0-.56.018a8.98 8.98 0 0 0-3.223-5.906l-.136-.142c.178-.295.308-.615.385-.95a1.36 1.36 0 0 0-.098-.731c-.214-.493-.89-1.07-1.317-1.37a1.35 1.35 0 0 0-1.42 0c-.315.26-.587.57-.806.914a13.6 13.6 0 0 0-3.578-.777a13.2 13.2 0 0 0-3.3.177c-.383-.54-1.008-1.221-1.67-1.36a1.33 1.33 0 0 0-.737.055a1.36 1.36 0 0 0-.827 1.186c.024.35.103.695.234 1.02a9 9 0 0 0-4.59 6.32A3.2 3.2 0 0 0 4.09 8.84a2.7 2.7 0 0 0-2.363.972c-.476.554-.817 3.578-.972 5.834l-.02.297c-.155 2.22-.352 5.067.02 5.662c.33.637 1.15 1.402 1.753 1.798c.381.25.82.398 1.276.429q.256.017.51-.009c.057.613.227 1.213.505 1.768c.332.442.961 1.025 1.422 1.356c-.076 1 .011 2.007.26 2.98c.393.687 1.218 1.46 1.892 1.881c.431.27.922.429 1.43.463a3.09 3.09 0 0 0 2.692-1.09c.397-.815.635-1.7.7-2.605l1.682.165l.793.06z" strokeWidth={1}></path><path fill="#9bff00" stroke="#00034a" strokeMiterlimit={10} d="M29.182 12.214a2.73 2.73 0 0 0-2.158-1.38a3.1 3.1 0 0 0-1.352.223a8.98 8.98 0 0 0-3.432-7.03c.185-.3.32-.628.399-.972a1.36 1.36 0 0 0-.564-1.303a1.35 1.35 0 0 0-1.42 0c-.315.26-.587.57-.806.914a13.6 13.6 0 0 0-3.578-.777a13.2 13.2 0 0 0-3.685.252a4 4 0 0 0-.632-1.089a1.33 1.33 0 0 0-1.39-.291a1.36 1.36 0 0 0-.827 1.186c.024.35.103.695.234 1.02a9 9 0 0 0-4.59 6.32A3.2 3.2 0 0 0 4.09 8.84a2.7 2.7 0 0 0-2.363.972c-.476.554-.817 3.578-.972 5.834s-.389 5.337 0 5.96a2.65 2.65 0 0 0 2.178 1.429c.468.031.937-.046 1.37-.224c-.106.955.066 1.92.496 2.78c.361.482.876.825 1.459.973a9.2 9.2 0 0 0 .223 3.364a3.08 3.08 0 0 0 2.47 1.546a3.09 3.09 0 0 0 2.693-1.09c.397-.815.635-1.7.7-2.605l1.682.165l1.682.127a7.1 7.1 0 0 0 .233 2.683a3.208 3.208 0 0 0 5.173.457a9.3 9.3 0 0 0 .797-3.276a2.65 2.65 0 0 0 1.604-.749a4.86 4.86 0 0 0 .972-2.654c.394.252.839.411 1.303.466a2.7 2.7 0 0 0 2.372-.972c.467-.554.817-3.587.972-5.833s.399-5.357.049-5.98z" strokeWidth={1}></path><path stroke="#00034a" strokeLinecap="round" strokeMiterlimit={10} d="M22.746 10.837a25.6 25.6 0 0 1-7.145.048A25.5 25.5 0 0 1 8.57 9.56m-3.402 2.547c-.146.729-.292 2.07-.477 3.937c-.184 1.867-.233 3.19-.213 3.957m20.252 1.76c.145-.749.31-2.061.466-3.889c.155-1.828.233-3.189.223-3.957" strokeWidth={1}></path><path fill="#00034a" stroke="#00034a" strokeMiterlimit={10} d="M27.322 36.756c.664 1.46 2.216 2.824 3.895 2.523c1.196-.214 1.945-.583 2.062-3.267a8 8 0 0 0 2.372-2.041c2.644.37 3.16-.33 3.578-1.488s.486-2.003-1.799-3.373a8 8 0 0 0-.126-1.566a8.7 8.7 0 0 0-.428-1.507c1.653-2.1 1.283-2.916.505-3.82c-1.385-1.61-3.023-1.897-4.942-.874a8 8 0 0 0-2.093-.886c-.666-1.461-2.217-2.813-3.896-2.527c-1.196.204-1.944.584-2.061 3.277a8.1 8.1 0 0 0-2.372 2.003c-2.635-.37-3.16.32-3.578 1.477s-.477 2.013 1.799 3.423a7.7 7.7 0 0 0 .126 1.555q.143.774.428 1.507c-1.653 2.11-1.284 2.917-.506 3.83c1.38 1.622 3.027 1.893 4.942.864a8 8 0 0 0 2.094.89Z" strokeWidth={1}></path><path fill="#fff" stroke="#00034a" strokeMiterlimit={10} d="M36.377 28.392a8 8 0 0 0-.127-1.566a8.7 8.7 0 0 0-.428-1.507c1.653-2.1 1.284-2.916.506-3.82c-.778-.905-1.517-1.42-3.889-.156a8.1 8.1 0 0 0-2.917-1.06c-.972-2.479-1.876-2.557-3.072-2.353c-1.196.205-1.944.584-2.061 3.277a8.1 8.1 0 0 0-2.372 2.003c-2.635-.37-3.16.32-3.578 1.477s-.477 2.013 1.799 3.423a7.7 7.7 0 0 0 .126 1.555c.095.515.238 1.02.428 1.507c-1.653 2.11-1.284 2.917-.506 3.83c.778.915 1.517 1.42 3.889.147a7.9 7.9 0 0 0 2.917 1.06c.972 2.488 1.876 2.566 3.072 2.352s1.944-.583 2.061-3.267a8 8 0 0 0 2.372-2.041c2.645.37 3.16-.33 3.578-1.488s.486-2.003-1.798-3.373Z" strokeWidth={1}></path><path fill="#9bff00" stroke="#00034a" strokeMiterlimit={10} d="M28.317 32.164a3.958 3.958 0 0 0 2.798-6.755a3.956 3.956 0 1 0-2.798 6.755Zm4.716-22.276c1.257-.37 2.126-1.18 1.94-1.808s-1.354-.838-2.61-.468c-1.257.37-2.126 1.18-1.94 1.809c.185.628 1.354.837 2.61.467Zm-2.021-4.732c.968-.882 1.396-1.99.955-2.474s-1.584-.162-2.553.72c-.969.883-1.396 1.99-.955 2.475c.441.484 1.584.161 2.553-.721Z" strokeWidth={1}></path><path fill="#9bff00" stroke="#00034a" strokeLinecap="round" strokeMiterlimit={10} d="M34.276 16.093a1.498 1.498 0 1 0 0-2.995a1.498 1.498 0 0 0 0 2.995Z" strokeWidth={1}></path><path fill="#00034a" d="M11.89 7.556a1.021 1.021 0 1 0-.53-1.8a1.021 1.021 0 0 0 .529 1.8zm7.5.688a1.022 1.022 0 1 0 .209-2.033a1.022 1.022 0 0 0-.209 2.033"></path></g><defs><clipPath id="SVGw9scfcdR"><path fill="#fff" d="M0 0h40v40H0z"></path></clipPath></defs></g></svg>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats mini */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard dark={darkMode} title="Active Device"  tag="@connected"    value="4"    icon={Wifi}     variant="green"  />
        <StatCard dark={darkMode} title="Offline Device" tag="@disconnected" value="2"    icon={WifiOff}  variant="red"    />
        <StatCard dark={darkMode} title="Total Device"   tag="@system"       value="6"    icon={Monitor}  variant="violet" />
        <StatCard dark={darkMode} title="Total Brands"   tag="@management"       value="50" icon={TrendingUp} variant="amber" />
      </div>

      {/* Map + side cards */}
      <div className="grid lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          <Card className={`${darkMode ? "bg-slate-800 border-slate-700" : "bg-white"} shadow-lg hover:shadow-xl transition-all duration-300`}>
            <CardHeader className="pb-3 px-4 lg:px-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div>
                  <CardTitle className={`${darkMode ? "text-white" : "text-slate-900"} text-base lg:text-lg flex items-center gap-2`}>
                    <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                    Live Device Locations
                  </CardTitle>
                  <CardDescription className="text-xs">Real-time tracking of all EDC devices</CardDescription>
                </div>
                <Badge className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white border-0 px-3 py-1 text-xs animate-pulse">
                  Live
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="px-4 lg:px-6">
              <div className="relative h-96 rounded-xl overflow-hidden border-2 border-slate-200 dark:border-slate-700">
                <div id="map" className="w-full h-full" />
                <div className={`absolute top-4 right-4 ${darkMode ? "bg-slate-800/95" : "bg-white/95"} backdrop-blur-sm px-4 py-2 rounded-lg shadow-xl border ${darkMode ? "border-slate-700" : "border-slate-200"}`}>
                  <p className={`text-xs ${darkMode ? "text-slate-400" : "text-slate-600"} mb-1`}>Active Now</p>
                  <p className={`text-2xl font-bold ${darkMode ? "text-emerald-400" : "text-emerald-600"}`}>4/6</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <Card className={`${darkMode ? "bg-slate-800 border-slate-700" : "bg-white"} shadow-lg hover:shadow-xl transition-all duration-300`}>
            <CardHeader className="pb-3 px-4">
              <CardTitle className={`text-sm ${darkMode ? "text-white" : "text-slate-900"}`}>Recent Activity</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 px-4">
              {recentActivity.map((a, idx) => {
                const IconComp = a.icon;
                return (
                  <div
                    key={idx}
                    className={`p-2.5 rounded-lg ${
                      darkMode ? "bg-slate-900/50 hover:bg-slate-900" : "bg-slate-50 hover:bg-slate-100"
                    } transition-all duration-200 hover:scale-[1.02] cursor-pointer group`}
                  >
                    <div className="flex items-start gap-2">
                      <div
                        className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                          a.status === "success" ? "bg-emerald-100" : "bg-red-100"
                        } group-hover:scale-110 group-hover:rotate-12 transition-all duration-200 flex-shrink-0`}
                      >
                        <IconComp className={`w-4 h-4 ${a.status === "success" ? "text-emerald-600" : "text-red-600"}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`font-medium text-xs ${darkMode ? "text-white" : "text-slate-900"}`}>{a.device}</p>
                        <p className={`text-xs ${darkMode ? "text-slate-400" : "text-slate-600"} truncate`}>{a.action}</p>
                        <p className="text-xs text-slate-500 mt-0.5">{a.time}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 border-0 text-white shadow-xl hover:scale-105 hover:shadow-2xl transition-all duration-300 cursor-pointer group">
            <CardContent className="p-4">
              <div className="text-center mb-3">
                <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center mx-auto mb-2 group-hover:rotate-12 group-hover:scale-110 transition-all duration-300">
                  <Activity className="w-7 h-7 text-white animate-pulse" />
                </div>
                <h3 className="text-base font-semibold mb-0.5">Connection Status</h3>
                <p className="text-xs text-white/80">Real-time monitoring</p>
              </div>
              <div className="space-y-2">
                <InfoRow icon={Wifi} label="Online Devices" value="4" />
                <InfoRow icon={Clock} label="Avg Response" value="120ms" />
                <InfoRow icon={TrendingUp} label="Uptime Today" value="99.8%" />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Animations */}
      <style jsx>{`
        @keyframes spin-slow { from { transform: rotate(0deg);} to { transform: rotate(360deg);} }
        .animate-spin-slow { animation: spin-slow 3s linear infinite; }
      `}</style>
    </div>
  );
}

/** ---------- Components ---------- */
function StatCard({
  dark, title, tag, value, icon: Icon, variant = "green",
}: {
  dark: boolean;
  title: string;
  tag: string;
  value: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  variant?: keyof typeof STAT_GRADIENTS;
}) {
  const gradient = STAT_GRADIENTS[variant] ?? STAT_GRADIENTS.green;

  return (
    <Card className={`${gradient} border-0 shadow-md hover:shadow-lg hover:scale-105 transition-all duration-300 cursor-pointer group rounded-2xl`}>
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 group-hover:rotate-6 transition-transform duration-300">
            <Icon className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-xs font-semibold text-white/90 mb-0.5">{title}</h3>
            <p className="text-xs text-white/60">{tag}</p>
          </div>
        </div>
        <p className="text-2xl font-bold text-white mt-3">{value}</p>
      </CardContent>
    </Card>
  );
}

function InfoRow({ icon: Icon, label, value }: {
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center justify-between p-2 rounded-lg bg-white/10 backdrop-blur-sm">
      <div className="flex items-center gap-2">
        <Icon className="w-4 h-4 animate-pulse" />
        <span className="text-xs font-medium">{label}</span>
      </div>
      <span className="text-sm font-bold">{value}</span>
    </div>
  );
}
