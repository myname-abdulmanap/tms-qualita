// app/devices/page.tsx
"use client";
import React, { useState, useMemo } from "react";
import {
  Wifi,
  WifiOff,
  Monitor,
  Search,
  Filter,
  Download,
  Plus,
  MapPin,
  Clock,
  Activity,
  Settings,
  Trash2,
  Edit,
  RefreshCw,
  ChevronDown,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useUi } from "@/lib/ui-store";

interface Device {
  id: string;
  name: string;
  model: string;
  serial: string;
  location: string;
  status: "online" | "offline" | "maintenance";
  lastSeen: string;
  uptime: string;
  firmware: string;
  ipAddress: string;
}

export default function DevicesPage() {
  const { darkMode } = useUi();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [modelFilter, setModelFilter] = useState<string>("all");

  const devices: Device[] = [
    {
      id: "1",
      name: "Sunmi P2",
      model: "Sunmi P2",
      serial: "PB0W239G20178",
      location: "Jakarta Pusat",
      status: "online",
      lastSeen: "Just now",
      uptime: "99.9%",
      firmware: "v2.4.1",
      ipAddress: "192.168.1.101",
    },
    {
      id: "2",
      name: "Sunmi V2 Pro",
      model: "Sunmi V2 Pro",
      serial: "SN9876543210",
      location: "Jakarta Selatan",
      status: "online",
      lastSeen: "2 minutes ago",
      uptime: "98.5%",
      firmware: "v2.4.1",
      ipAddress: "192.168.1.102",
    },
    {
      id: "3",
      name: "PAX A920",
      model: "PAX A920",
      serial: "0820517793",
      location: "Bandung",
      status: "offline",
      lastSeen: "15 minutes ago",
      uptime: "95.2%",
      firmware: "v1.8.3",
      ipAddress: "192.168.1.103",
    },
    {
      id: "4",
      name: "Centerm K9",
      model: "Centerm K9",
      serial: "1234567890",
      location: "Surabaya",
      status: "online",
      lastSeen: "Just now",
      uptime: "99.7%",
      firmware: "v3.1.0",
      ipAddress: "192.168.1.104",
    },
    {
      id: "5",
      name: "PAX A80",
      model: "PAX A80",
      serial: "PAX123456789",
      location: "Medan",
      status: "online",
      lastSeen: "5 minutes ago",
      uptime: "97.8%",
      firmware: "v1.8.3",
      ipAddress: "192.168.1.105",
    },
    {
      id: "6",
      name: "Centerm K8",
      model: "Centerm K8",
      serial: "CT987654321",
      location: "Semarang",
      status: "maintenance",
      lastSeen: "1 hour ago",
      uptime: "92.4%",
      firmware: "v3.0.5",
      ipAddress: "192.168.1.106",
    },
  ];

  // Filter logic
  const filteredDevices = useMemo(() => {
    return devices.filter((device) => {
      const matchesSearch =
        device.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        device.serial.toLowerCase().includes(searchQuery.toLowerCase()) ||
        device.location.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesStatus = statusFilter === "all" || device.status === statusFilter;
      const matchesModel = modelFilter === "all" || device.model === modelFilter;

      return matchesSearch && matchesStatus && matchesModel;
    });
  }, [searchQuery, statusFilter, modelFilter]);

  // Stats
  const stats = {
    total: devices.length,
    online: devices.filter((d) => d.status === "online").length,
    offline: devices.filter((d) => d.status === "offline").length,
    maintenance: devices.filter((d) => d.status === "maintenance").length,
  };

  const uniqueModels = Array.from(new Set(devices.map((d) => d.model)));

  return (
    <div className={`min-h-screen ${darkMode ? "bg-slate-950" : "bg-gradient-to-br from-slate-50 via-purple-50 to-pink-50"} transition-colors duration-300`}>
      {/* Header */}
      <Card className={`${darkMode ? "bg-gradient-to-br from-indigo-600 to-purple-700" : "bg-gradient-to-br from-indigo-500 to-purple-600"} border-0 shadow-xl rounded-3xl mb-6`}>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-3xl font-bold text-white mb-1">Device Management</h2>
              <p className="text-sm text-white/70">Monitor and manage all EDC terminals</p>
            </div>
            <div className="relative w-[100px] h-[100px]">
            <svg xmlns="http://www.w3.org/2000/svg" width={100} height={100} viewBox="0 0 24 24"><g fill="none" fillRule="evenodd" clipRule="evenodd"><path fill="#efefef" d="M5.878 4.6a.88.88 0 0 0-.889.779a.918.918 0 0 0 1.068.878a.858.858 0 0 0 .629-1.138a.9.9 0 0 0-.808-.519m4.821 0a.88.88 0 0 0-.879.779a.918.918 0 0 0 1.068.878a.858.858 0 0 0 .63-1.138a.9.9 0 0 0-.82-.519"></path><path fill="#00ff37" d="M15.78 18.186a.38.38 0 0 0-.54 0l-1.078 1.177a32 32 0 0 1-1.327-1.108c-.23-.2-.47-.389-.709-.579l-.739-.559c-.599-.439-1.197-.858-1.766-1.287a.38.38 0 1 0-.52.549c.48.549.999 1.118 1.508 1.657q.347.339.728.639q.376.31.789.569c.475.27.97.507 1.477.708l-.349.37a.4.4 0 0 1-.18.13a1.1 1.1 0 0 1-.539-.09a8 8 0 0 1-1.108-.48c-.539-.24-1.068-.539-1.597-.838c-.529-.3-.998-.619-1.527-.998a11.2 11.2 0 0 1-1.797-1.627a.34.34 0 0 0-.469-.07a.34.34 0 0 0-.06.469a27 27 0 0 0 4.362 3.833a8.7 8.7 0 0 0 1.887.868q.286.06.579.06c.4-.05.778-.13.778-.19q.152-.064.28-.169q.269-.3.499-.629l1.457-1.896a.37.37 0 0 0-.04-.51"></path><path fill="#efefef" d="M13.144 22.039c-.549.08-.419.409-.519.489h-.679a8.6 8.6 0 0 1-1.537.09c-.238 0-.469-.077-.659-.22a.38.38 0 0 1-.16-.2c0-.17-.08-.36-.12-.529a4.2 4.2 0 0 0-.299-1.337a1.08 1.08 0 0 0-.838-.37a12 12 0 0 1-1.427-.18q-.713-.118-1.408-.319a5 5 0 0 1-.778-.26q-.356-.15-.68-.359q-.49-.315-.947-.678a3.4 3.4 0 0 1-.7-.769a1.7 1.7 0 0 1-.249-.629q-.105-.614-.09-1.238v-2.904l-.12-4.642q1.248.488 2.546.819q.664.126 1.338.18q.68.09 1.367.09c1.066.014 2.13-.086 3.174-.3a.38.38 0 1 0-.09-.749q-1.293.063-2.585-.04c-.798-.07-1.587-.2-2.385-.31c-1.158-.159-2.306-.279-3.434-.488c0-.26.07-.52.13-.769c.107-.412.275-.805.499-1.168A5.3 5.3 0 0 1 4.59 3.303a8 8 0 0 1 1.817-.68c.8-.195 1.621-.293 2.445-.289a10.4 10.4 0 0 1 2.456.27c.498.131.98.319 1.437.559q1.035.597 1.996 1.308a.38.38 0 0 0 .53-.08a.37.37 0 0 0-.08-.53a21 21 0 0 0-1.997-1.517q.247-.18.45-.409q.157-.205.269-.439c.529-.998.489-1.088.35-1.248c-.14-.16-.29-.379-1.288.5q-.145.126-.25.289a1.1 1.1 0 0 0-.18.33q-.1.29-.13.598a8 8 0 0 0-.788-.37a10 10 0 0 0-2.735-.498a9.7 9.7 0 0 0-2.785.29c-.18.05-.33.159-.509.209a2.3 2.3 0 0 0-.09-.49a1.2 1.2 0 0 0-.19-.319a1.4 1.4 0 0 0-.249-.29C4.679.179 3.931-.26 3.691.199c-.13.25 0 .22.45 1.068q.1.207.24.39q.147.173.339.3c-.24.109-.5.169-.73.299A6.14 6.14 0 0 0 1.676 4.75a4.6 4.6 0 0 0-.4 1.158c-.358 1.617.1-.28-.388 6.638c-.05.499-.09.998-.1 1.497s0 .998 0 1.497q-.007.749.11 1.488c.09.374.245.728.459 1.048q.34.465.788.828q.36.268.749.49a8 8 0 0 0-.39 1.706a5.6 5.6 0 0 0 0 1.228q.04.34.13.669c.065.178.171.339.31.469c.3.253.661.422 1.048.489c.444.06.894.06 1.337 0q.341-.08.66-.23c.828-.26 1.167-.22 1.497-1.347q.084-.202.11-.42a2 2 0 0 0 0-.429a6 6 0 0 0-.33-.878c.36 0 .719.06 1.068.06a.32.32 0 0 0 .25-.09v1.188q-.015.416.05.828c.059.251.182.482.359.67c.365.372.856.596 1.377.628a6.8 6.8 0 0 0 1.817-.21q.392-.06.769-.19a1.1 1.1 0 0 0 .459-.289c.158-.205.254-.45.28-.708c-.04-.31-.15-.58-.55-.5M6.566 20.66q-.144.494-.24.998q-.021.27 0 .54v.528a2.7 2.7 0 0 1-.538.14a3.3 3.3 0 0 1-.55 0a7 7 0 0 1-.888-.12c-.469-.11-.718 0-.848-1.926a10 10 0 0 1 0-1.068q.398.216.828.359q.447.15.909.24c.429.08.878.14 1.317.2c.03.06.01.08.01.109"></path><path fill="#00ff37" d="M23.096 8.743a2.1 2.1 0 0 0-.35-.46l-.997-1.057a25 25 0 0 0-2.486-1.877c-2.845-1.847-2.825-2.276-6.288 1.357a30 30 0 0 0-1.637 1.907c-.77.998-1.468 1.996-2.266 2.945a.34.34 0 1 0 .479.469a39 39 0 0 0 2.286-2.176c.27-.28.539-.56.798-.849c.26-.29.759-.858 1.138-1.297c.38-.44.809-.999 1.228-1.428q.731.945 1.597 1.767q.654.567 1.367 1.058c.7.49 1.428.918 2.117 1.408a.37.37 0 0 0 .529 0a.38.38 0 0 0 0-.54c-.67-.668-1.338-1.347-2.067-1.996a27 27 0 0 0-1.317-1.058c-.45-.34-1.088-.788-1.617-1.198q.47-.527.998-.998c.539.35 1.078.719 1.597 1.118s1.098.928 1.637 1.398c.36.319.719.628 1.068.998l.938.938l.15.09a2.4 2.4 0 0 1-.31.888c-.508.919-1.397 1.787-1.836 2.586a.379.379 0 1 0 .639.399c.529-.749 1.507-1.537 2.116-2.416a3.3 3.3 0 0 0 .609-1.517a.74.74 0 0 0-.12-.46"></path><path fill="#efefef" d="m7.844 14.432l-.759.33a3.8 3.8 0 0 1-1.577.1a8.7 8.7 0 0 1-2.425-.889a.38.38 0 0 0-.52.16a.37.37 0 0 0 .16.509A9.7 9.7 0 0 0 5.3 15.87a4.8 4.8 0 0 0 2.046.06q.364-.058.709-.19q.245-.094.469-.23q.21-.135.399-.3q.195-.191.35-.418a1.817 1.817 0 0 0-.11-2.416a5.24 5.24 0 0 0-2.785-1.168c-.52-.08-.999-.16-1.577-.21a10 10 0 0 0-1.079-.08a.32.32 0 0 0-.349.31a.33.33 0 0 0 .31.36q.503.06.998.18c.509.109.998.249 1.507.389c.75.16 1.442.527 1.996 1.058a.69.69 0 0 1 0 .888zm11.369-1.058a4.3 4.3 0 0 0-2.435.13q-.248.1-.47.25l-.26.2a.3.3 0 0 0-.109.09a.41.41 0 0 0-.12.358a7.5 7.5 0 0 0-.399 1.927c-.045.565.066 1.13.32 1.637c.16.296.418.528.728.659c.416.165.873.197 1.308.09a3.36 3.36 0 0 0 1.637-.939a5 5 0 0 0 .998-1.487q.179-.436.26-.898a1.8 1.8 0 0 0 0-.769a1.88 1.88 0 0 0-1.458-1.248m.24 1.947q-.09.26-.21.509c-.18.419-.43.803-.739 1.138c-.27.298-.614.518-.998.639a1.3 1.3 0 0 1-.539.06a.44.44 0 0 1-.32-.18a2.1 2.1 0 0 1-.349-1.088a6.3 6.3 0 0 1 .18-1.757q.12-.093.25-.17q.154-.089.329-.13a3.24 3.24 0 0 1 1.557 0c.42.1.809.28.889.68a1 1 0 0 1-.05.299"></path></g></svg>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard dark={darkMode} title="Total Devices" value={stats.total.toString()} icon={Monitor} from="violet-400" to="purple-500" />
        <StatCard dark={darkMode} title="Online" value={stats.online.toString()} icon={Wifi} from="emerald-400" to="teal-500" />
        <StatCard dark={darkMode} title="Offline" value={stats.offline.toString()} icon={WifiOff} from="rose-400" to="pink-500" />
        <StatCard dark={darkMode} title="Maintenance" value={stats.maintenance.toString()} icon={Settings} from="amber-400" to="orange-500" />
      </div>

      {/* Main Content */}
      <Card className={`${darkMode ? "bg-slate-800 border-slate-700" : "bg-white"} shadow-lg`}>
        <CardHeader className="pb-4">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div>
              <CardTitle className={`${darkMode ? "text-white" : "text-slate-900"} text-xl flex items-center gap-2`}>
                <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                Registered Devices
              </CardTitle>
              <CardDescription className="text-sm">
                {filteredDevices.length} of {devices.length} devices
              </CardDescription>
            </div>
            <div className="flex flex-wrap gap-2">
              <button className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-lg hover:shadow-lg transition-all duration-200 flex items-center gap-2 text-sm font-medium">
                <Plus className="w-4 h-4" />
                Add Device
              </button>
              <button className={`px-4 py-2 ${darkMode ? "bg-slate-700 hover:bg-slate-600" : "bg-slate-100 hover:bg-slate-200"} rounded-lg transition-all duration-200 flex items-center gap-2 text-sm font-medium ${darkMode ? "text-white" : "text-slate-900"}`}>
                <Download className="w-4 h-4" />
                Export
              </button>
              <button className={`px-4 py-2 ${darkMode ? "bg-slate-700 hover:bg-slate-600" : "bg-slate-100 hover:bg-slate-200"} rounded-lg transition-all duration-200 flex items-center gap-2 text-sm font-medium ${darkMode ? "text-white" : "text-slate-900"}`}>
                <RefreshCw className="w-4 h-4" />
                Refresh
              </button>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {/* Search & Filters */}
          <div className="flex flex-col lg:flex-row gap-3 mb-6">
            <div className="relative flex-1">
              <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${darkMode ? "text-slate-400" : "text-slate-500"}`} />
              <input
                type="text"
                placeholder="Search by name, serial, or location..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={`w-full pl-10 pr-4 py-2.5 rounded-lg border ${darkMode ? "bg-slate-900 border-slate-700 text-white placeholder-slate-500" : "bg-white border-slate-200 text-slate-900 placeholder-slate-400"} focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all`}
              />
            </div>

            <div className="flex gap-2">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className={`px-4 py-2.5 rounded-lg border ${darkMode ? "bg-slate-900 border-slate-700 text-white" : "bg-white border-slate-200 text-slate-900"} focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all cursor-pointer`}
              >
                <option value="all">All Status</option>
                <option value="online">Online</option>
                <option value="offline">Offline</option>
                <option value="maintenance">Maintenance</option>
              </select>

              <select
                value={modelFilter}
                onChange={(e) => setModelFilter(e.target.value)}
                className={`px-4 py-2.5 rounded-lg border ${darkMode ? "bg-slate-900 border-slate-700 text-white" : "bg-white border-slate-200 text-slate-900"} focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all cursor-pointer`}
              >
                <option value="all">All Models</option>
                {uniqueModels.map((model) => (
                  <option key={model} value={model}>
                    {model}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700">
            <table className="w-full">
              <thead className={`${darkMode ? "bg-slate-900" : "bg-slate-50"}`}>
                <tr>
                  <th className={`px-4 py-3 text-left text-xs font-semibold ${darkMode ? "text-slate-300" : "text-slate-600"} uppercase tracking-wider`}>
                    Device
                  </th>
                  <th className={`px-4 py-3 text-left text-xs font-semibold ${darkMode ? "text-slate-300" : "text-slate-600"} uppercase tracking-wider`}>
                    Status
                  </th>
                  <th className={`px-4 py-3 text-left text-xs font-semibold ${darkMode ? "text-slate-300" : "text-slate-600"} uppercase tracking-wider`}>
                    Location
                  </th>
                  <th className={`px-4 py-3 text-left text-xs font-semibold ${darkMode ? "text-slate-300" : "text-slate-600"} uppercase tracking-wider`}>
                    Last Seen
                  </th>
                  <th className={`px-4 py-3 text-left text-xs font-semibold ${darkMode ? "text-slate-300" : "text-slate-600"} uppercase tracking-wider`}>
                    Uptime
                  </th>
                  <th className={`px-4 py-3 text-left text-xs font-semibold ${darkMode ? "text-slate-300" : "text-slate-600"} uppercase tracking-wider`}>
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                {filteredDevices.map((device) => (
                  <tr key={device.id} className={`${darkMode ? "hover:bg-slate-900/50" : "hover:bg-slate-50"} transition-colors`}>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-lg ${device.status === "online" ? "bg-emerald-100" : device.status === "maintenance" ? "bg-amber-100" : "bg-slate-100"} flex items-center justify-center flex-shrink-0`}>
                          <Monitor className={`w-5 h-5 ${device.status === "online" ? "text-emerald-600" : device.status === "maintenance" ? "text-amber-600" : "text-slate-600"}`} />
                        </div>
                        <div>
                          <p className={`font-semibold text-sm ${darkMode ? "text-white" : "text-slate-900"}`}>
                            {device.name}
                          </p>
                          <p className={`text-xs ${darkMode ? "text-slate-400" : "text-slate-500"}`}>
                            {device.serial}
                          </p>
                          <p className={`text-xs ${darkMode ? "text-slate-500" : "text-slate-400"} font-mono`}>
                            {device.ipAddress}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <Badge
                        className={`${
                          device.status === "online"
                            ? "bg-emerald-100 text-emerald-700 border-emerald-200"
                            : device.status === "maintenance"
                            ? "bg-amber-100 text-amber-700 border-amber-200"
                            : "bg-slate-100 text-slate-700 border-slate-200"
                        } border px-3 py-1`}
                      >
                        <div className={`w-1.5 h-1.5 rounded-full mr-2 ${device.status === "online" ? "bg-emerald-500 animate-pulse" : device.status === "maintenance" ? "bg-amber-500" : "bg-slate-500"}`} />
                        {device.status.charAt(0).toUpperCase() + device.status.slice(1)}
                      </Badge>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2">
                        <MapPin className={`w-4 h-4 ${darkMode ? "text-slate-400" : "text-slate-500"}`} />
                        <span className={`text-sm ${darkMode ? "text-slate-300" : "text-slate-700"}`}>
                          {device.location}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2">
                        <Clock className={`w-4 h-4 ${darkMode ? "text-slate-400" : "text-slate-500"}`} />
                        <span className={`text-sm ${darkMode ? "text-slate-300" : "text-slate-700"}`}>
                          {device.lastSeen}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2">
                        <Activity className={`w-4 h-4 ${darkMode ? "text-slate-400" : "text-slate-500"}`} />
                        <span className={`text-sm font-medium ${darkMode ? "text-slate-300" : "text-slate-700"}`}>
                          {device.uptime}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2">
                        <button className={`p-2 rounded-lg ${darkMode ? "hover:bg-slate-700" : "hover:bg-slate-100"} transition-colors group`}>
                          <Edit className={`w-4 h-4 ${darkMode ? "text-slate-400 group-hover:text-blue-400" : "text-slate-500 group-hover:text-blue-600"}`} />
                        </button>
                        <button className={`p-2 rounded-lg ${darkMode ? "hover:bg-slate-700" : "hover:bg-slate-100"} transition-colors group`}>
                          <Settings className={`w-4 h-4 ${darkMode ? "text-slate-400 group-hover:text-purple-400" : "text-slate-500 group-hover:text-purple-600"}`} />
                        </button>
                        <button className={`p-2 rounded-lg ${darkMode ? "hover:bg-slate-700" : "hover:bg-slate-100"} transition-colors group`}>
                          <Trash2 className={`w-4 h-4 ${darkMode ? "text-slate-400 group-hover:text-red-400" : "text-slate-500 group-hover:text-red-600"}`} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Empty State */}
          {filteredDevices.length === 0 && (
            <div className="text-center py-12">
              <Monitor className={`w-16 h-16 mx-auto mb-4 ${darkMode ? "text-slate-600" : "text-slate-300"}`} />
              <p className={`text-lg font-medium ${darkMode ? "text-slate-300" : "text-slate-600"} mb-2`}>
                No devices found
              </p>
              <p className={`text-sm ${darkMode ? "text-slate-500" : "text-slate-400"}`}>
                Try adjusting your search or filters
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function StatCard({
  dark,
  title,
  value,
  icon: Icon,
  from,
  to,
}: {
  dark: boolean;
  title: string;
  value: string;
  icon: any;
  from: string;
  to: string;
}) {
  return (
    <Card className={`bg-gradient-to-br from-${from} to-${to} border-0 shadow-md hover:shadow-lg hover:scale-105 transition-all duration-300 cursor-pointer group rounded-2xl`}>
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 group-hover:rotate-6 transition-transform duration-300">
            <Icon className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-xs font-semibold text-white/90 mb-0.5">{title}</h3>
          </div>
        </div>
        <p className="text-2xl font-bold text-white mt-3">{value}</p>
      </CardContent>
    </Card>
  );
}