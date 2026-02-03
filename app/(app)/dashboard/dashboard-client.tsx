"use client";

import React, { useEffect, useState } from "react";
import { Icon } from "@iconify/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { Cell, Pie, PieChart, Bar, BarChart, XAxis, YAxis } from "recharts";
import { useUi } from "@/lib/ui-store";
import { useRouter } from "next/navigation";

interface Device {
  id: string;
  deviceCode: string;
  serialNumber: string;
  status: string;
  batteryLevel: number | null;
  signalStrength: number | null;
  lastSeenAt: string | null;
  networkType: string | null;
  carrier: string | null;
  merchant?: { name: string } | null;
}

interface DeviceStats {
  total: number;
  online: number;
  offline: number;
  lowBattery: number;
  byNetworkType: { name: string; value: number; color: string }[];
  byCarrier: { name: string; value: number }[];
  batteryDistribution: { range: string; count: number; color: string }[];
}

const ONLINE_THRESHOLD = 5 * 60 * 1000; // 5 minutes

export default function DashboardPage() {
  const { darkMode } = useUi();
  const router = useRouter();
  const [devices, setDevices] = useState<Device[]>([]);
  const [stats, setStats] = useState<DeviceStats>({
    total: 0,
    online: 0,
    offline: 0,
    lowBattery: 0,
    byNetworkType: [],
    byCarrier: [],
    batteryDistribution: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchDevices() {
      try {
        setLoading(true);
        const response = await fetch("/api/devices");

        if (response.status === 401) {
          router.push("/login");
          return;
        }

        if (!response.ok) {
          throw new Error("Failed to fetch devices");
        }

        const data: Device[] = await response.json();
        setDevices(data);

        // Calculate stats
        const now = Date.now();
        let online = 0;
        let offline = 0;
        let lowBattery = 0;
        const networkTypeCount: Record<string, number> = {};
        const carrierCount: Record<string, number> = {};
        const batteryRanges = {
          "0-20%": 0,
          "21-50%": 0,
          "51-80%": 0,
          "81-100%": 0,
        };

        data.forEach((device) => {
          // Online/Offline check
          const lastSeen = device.lastSeenAt
            ? new Date(device.lastSeenAt).getTime()
            : 0;
          if (now - lastSeen <= ONLINE_THRESHOLD) {
            online++;
          } else {
            offline++;
          }

          // Low battery check
          if (device.batteryLevel !== null && device.batteryLevel < 20) {
            lowBattery++;
          }

          // Network type count
          const netType = device.networkType || "Unknown";
          networkTypeCount[netType] = (networkTypeCount[netType] || 0) + 1;

          // Carrier count
          const carrier = device.carrier || "Unknown";
          carrierCount[carrier] = (carrierCount[carrier] || 0) + 1;

          // Battery distribution
          if (device.batteryLevel !== null) {
            if (device.batteryLevel <= 20) batteryRanges["0-20%"]++;
            else if (device.batteryLevel <= 50) batteryRanges["21-50%"]++;
            else if (device.batteryLevel <= 80) batteryRanges["51-80%"]++;
            else batteryRanges["81-100%"]++;
          }
        });

        const networkColors: Record<string, string> = {
          "4G": "#3b82f6",
          LTE: "#6366f1",
          "3G": "#8b5cf6",
          "2G": "#a855f7",
          WiFi: "#06b6d4",
          Unknown: "#94a3b8",
        };

        setStats({
          total: data.length,
          online,
          offline,
          lowBattery,
          byNetworkType: Object.entries(networkTypeCount).map(
            ([name, value]) => ({
              name,
              value,
              color: networkColors[name] || "#94a3b8",
            }),
          ),
          byCarrier: Object.entries(carrierCount)
            .map(([name, value]) => ({ name, value }))
            .sort((a, b) => b.value - a.value)
            .slice(0, 5),
          batteryDistribution: [
            { range: "0-20%", count: batteryRanges["0-20%"], color: "#ef4444" },
            {
              range: "21-50%",
              count: batteryRanges["21-50%"],
              color: "#f59e0b",
            },
            {
              range: "51-80%",
              count: batteryRanges["51-80%"],
              color: "#3b82f6",
            },
            {
              range: "81-100%",
              count: batteryRanges["81-100%"],
              color: "#10b981",
            },
          ],
        });

        setError(null);
      } catch (err) {
        console.error("Error fetching devices:", err);
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setLoading(false);
      }
    }

    fetchDevices();
    // Refresh every 30 seconds
    const interval = setInterval(fetchDevices, 30000);
    return () => clearInterval(interval);
  }, [router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <Icon
          icon="mdi:loading"
          className="w-8 h-8 animate-spin text-indigo-500"
        />
      </div>
    );
  }

  if (error) {
    return (
      <div
        className={`p-4 rounded-xl ${darkMode ? "bg-red-500/10 text-red-400" : "bg-red-50 text-red-600"}`}
      >
        <p className="text-sm">Error: {error}</p>
      </div>
    );
  }

  const statusData = [
    { name: "Online", value: stats.online, color: "#10b981" },
    { name: "Offline", value: stats.offline, color: "#ef4444" },
  ];

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1
            className={`text-lg font-semibold ${darkMode ? "text-white" : "text-slate-900"}`}
          >
            Device Dashboard
          </h1>
          <p
            className={`text-xs ${darkMode ? "text-slate-500" : "text-slate-500"}`}
          >
            Real-time monitoring perangkat terminal
          </p>
        </div>
        <div
          className={`flex items-center gap-2 text-xs ${darkMode ? "text-slate-500" : "text-slate-400"}`}
        >
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          Live
        </div>
      </div>

      {/* Main Stats - Colorful Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Card className="bg-gradient-to-br from-indigo-500 to-indigo-600 border-0 shadow-lg shadow-indigo-500/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-indigo-100 text-xs font-medium">
                  Total Device
                </p>
                <p className="text-white text-2xl font-bold mt-1">
                  {stats.total}
                </p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                <Icon icon="mdi:devices" className="w-5 h-5 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-emerald-500 to-emerald-600 border-0 shadow-lg shadow-emerald-500/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-emerald-100 text-xs font-medium">Online</p>
                <p className="text-white text-2xl font-bold mt-1">
                  {stats.online}
                </p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                <Icon icon="mdi:wifi" className="w-5 h-5 text-white" />
              </div>
            </div>
            <div className="mt-2 flex items-center gap-1">
              <span className="text-emerald-100 text-[10px]">
                {stats.total > 0
                  ? ((stats.online / stats.total) * 100).toFixed(0)
                  : 0}
                % dari total
              </span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-rose-500 to-rose-600 border-0 shadow-lg shadow-rose-500/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-rose-100 text-xs font-medium">Offline</p>
                <p className="text-white text-2xl font-bold mt-1">
                  {stats.offline}
                </p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                <Icon icon="mdi:wifi-off" className="w-5 h-5 text-white" />
              </div>
            </div>
            <div className="mt-2 flex items-center gap-1">
              <span className="text-rose-100 text-[10px]">
                {stats.total > 0
                  ? ((stats.offline / stats.total) * 100).toFixed(0)
                  : 0}
                % dari total
              </span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-amber-500 to-amber-600 border-0 shadow-lg shadow-amber-500/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-amber-100 text-xs font-medium">
                  Low Battery
                </p>
                <p className="text-white text-2xl font-bold mt-1">
                  {stats.lowBattery}
                </p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                <Icon icon="mdi:battery-alert" className="w-5 h-5 text-white" />
              </div>
            </div>
            <div className="mt-2 flex items-center gap-1">
              <span className="text-amber-100 text-[10px]">
                Battery &lt; 20%
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        {/* Device Status Pie */}
        <Card
          className={`${darkMode ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"}`}
        >
          <CardHeader className="pb-0 pt-4 px-4">
            <CardTitle
              className={`text-sm font-medium ${darkMode ? "text-slate-200" : "text-slate-700"}`}
            >
              Status Device
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0 pb-4">
            <ChartContainer
              config={{
                online: { label: "Online", color: "#10b981" },
                offline: { label: "Offline", color: "#ef4444" },
              }}
              className="h-[140px] w-full"
            >
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={40}
                  outerRadius={60}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <ChartTooltip content={<ChartTooltipContent />} />
              </PieChart>
            </ChartContainer>
            <div className="flex justify-center gap-6 -mt-2">
              {statusData.map((item) => (
                <div key={item.name} className="flex items-center gap-2">
                  <div
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ backgroundColor: item.color }}
                  />
                  <span
                    className={`text-xs ${darkMode ? "text-slate-400" : "text-slate-600"}`}
                  >
                    {item.name}: {item.value}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Network Type */}
        <Card
          className={`${darkMode ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"}`}
        >
          <CardHeader className="pb-0 pt-4 px-4">
            <CardTitle
              className={`text-sm font-medium ${darkMode ? "text-slate-200" : "text-slate-700"}`}
            >
              Tipe Jaringan
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0 pb-4">
            <ChartContainer
              config={{
                value: { label: "Devices", color: "#6366f1" },
              }}
              className="h-[140px] w-full"
            >
              <PieChart>
                <Pie
                  data={stats.byNetworkType}
                  cx="50%"
                  cy="50%"
                  innerRadius={40}
                  outerRadius={60}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {stats.byNetworkType.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <ChartTooltip content={<ChartTooltipContent />} />
              </PieChart>
            </ChartContainer>
            <div className="flex flex-wrap justify-center gap-x-4 gap-y-1 -mt-2">
              {stats.byNetworkType.map((item) => (
                <div key={item.name} className="flex items-center gap-1.5">
                  <div
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: item.color }}
                  />
                  <span
                    className={`text-[10px] ${darkMode ? "text-slate-400" : "text-slate-600"}`}
                  >
                    {item.name}: {item.value}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Battery Distribution */}
        <Card
          className={`${darkMode ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"}`}
        >
          <CardHeader className="pb-0 pt-4 px-4">
            <CardTitle
              className={`text-sm font-medium ${darkMode ? "text-slate-200" : "text-slate-700"}`}
            >
              Distribusi Baterai
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-2 pb-4">
            <ChartContainer
              config={{
                count: { label: "Devices", color: "#6366f1" },
              }}
              className="h-[130px] w-full"
            >
              <BarChart
                data={stats.batteryDistribution}
                layout="vertical"
                margin={{ left: 0, right: 10 }}
              >
                <XAxis type="number" hide />
                <YAxis
                  dataKey="range"
                  type="category"
                  tick={{
                    fontSize: 10,
                    fill: darkMode ? "#94a3b8" : "#64748b",
                  }}
                  axisLine={false}
                  tickLine={false}
                  width={50}
                />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                  {stats.batteryDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      {/* Recent Devices List */}
      <Card
        className={`${darkMode ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"}`}
      >
        <CardHeader className="pb-2 pt-4 px-4">
          <div className="flex items-center justify-between">
            <CardTitle
              className={`text-sm font-medium ${darkMode ? "text-slate-200" : "text-slate-700"}`}
            >
              Device Terbaru
            </CardTitle>
            <button
              onClick={() => router.push("/devices")}
              className={`text-xs ${darkMode ? "text-indigo-400 hover:text-indigo-300" : "text-indigo-600 hover:text-indigo-700"}`}
            >
              Lihat Semua →
            </button>
          </div>
        </CardHeader>
        <CardContent className="pt-0 pb-3 px-4">
          <div className="space-y-2">
            {devices.slice(0, 5).map((device) => {
              const isOnline =
                device.lastSeenAt &&
                Date.now() - new Date(device.lastSeenAt).getTime() <=
                  ONLINE_THRESHOLD;
              return (
                <div
                  key={device.id}
                  className={`flex items-center justify-between p-2.5 rounded-lg ${darkMode ? "bg-slate-800/50" : "bg-slate-50"}`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-8 h-8 rounded-lg flex items-center justify-center ${isOnline ? "bg-emerald-500/10" : "bg-slate-500/10"}`}
                    >
                      <Icon
                        icon="mdi:cellphone-nfc"
                        className={`w-4 h-4 ${isOnline ? "text-emerald-500" : "text-slate-400"}`}
                      />
                    </div>
                    <div>
                      <p
                        className={`text-xs font-medium ${darkMode ? "text-white" : "text-slate-900"}`}
                      >
                        {device.deviceCode}
                      </p>
                      <p
                        className={`text-[10px] ${darkMode ? "text-slate-500" : "text-slate-500"}`}
                      >
                        {device.serialNumber}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {device.batteryLevel !== null && (
                      <div className="flex items-center gap-1">
                        <Icon
                          icon={
                            device.batteryLevel > 20
                              ? "mdi:battery"
                              : "mdi:battery-alert"
                          }
                          className={`w-3.5 h-3.5 ${device.batteryLevel > 20 ? "text-emerald-500" : "text-amber-500"}`}
                        />
                        <span
                          className={`text-[10px] ${darkMode ? "text-slate-400" : "text-slate-600"}`}
                        >
                          {device.batteryLevel}%
                        </span>
                      </div>
                    )}
                    <div
                      className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${isOnline ? "bg-emerald-500/10 text-emerald-500" : "bg-slate-500/10 text-slate-400"}`}
                    >
                      {isOnline ? "Online" : "Offline"}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
