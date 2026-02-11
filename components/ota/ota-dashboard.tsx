"use client";

import { useEffect, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Icon } from "@iconify/react";

// ============ TYPES ============
interface OtaFirmware {
  id: string;
  version: string;
  filename: string;
  filepath: string;
  filesize: number;
  description: string | null;
  createdAt: string;
  _count: { strategies: number };
}

interface OtaStrategy {
  id: string;
  name: string;
  firmwareId: string;
  firmware: { id: string; version: string; filename: string; filesize: number };
  startAt: string;
  endAt: string;
  status: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  _count: { devices: number; downloadLogs: number };
  devices: OtaStrategyDevice[];
}

interface OtaStrategyDevice {
  id: string;
  strategyId: string;
  deviceSn: string;
  status: string;
  downloadCount: number;
  lastCheckedAt: string | null;
  updatedAt: string | null;
  createdAt: string;
}

interface OtaDownloadLog {
  id: string;
  strategyId: string;
  deviceSn: string;
  createdAt: string;
}

interface DeviceInfo {
  serialNumber: string;
  deviceCode: string;
  model: string;
  status: string;
  firmware: string | null;
  merchant: { name: string };
}

// ============ HELPERS ============
function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function toLocalDatetimeInput(isoStr: string): string {
  const d = new Date(isoStr);
  const offset = d.getTimezoneOffset();
  const local = new Date(d.getTime() - offset * 60000);
  return local.toISOString().slice(0, 16);
}

function deviceStatusBadge(status: string) {
  const map: Record<string, { color: string; label: string }> = {
    PENDING: { color: "bg-yellow-100 text-yellow-800 border-yellow-300", label: "Pending" },
    DOWNLOADING: { color: "bg-blue-100 text-blue-800 border-blue-300", label: "Downloading" },
    UPDATED: { color: "bg-green-100 text-green-800 border-green-300", label: "Updated" },
    FAILED: { color: "bg-red-100 text-red-800 border-red-300", label: "Failed" },
  };
  const s = map[status] || { color: "bg-gray-100 text-gray-600", label: status };
  return <Badge variant="outline" className={s.color}>{s.label}</Badge>;
}

function strategyStatusBadge(status: string) {
  const map: Record<string, { color: string; icon: string; label: string }> = {
    SCHEDULED: { color: "bg-blue-100 text-blue-800 border-blue-300", icon: "lucide:clock", label: "Scheduled" },
    ACTIVE: { color: "bg-green-100 text-green-800 border-green-300", icon: "lucide:radio", label: "Active" },
    EXPIRED: { color: "bg-gray-100 text-gray-500 border-gray-300", icon: "lucide:timer-off", label: "Expired" },
  };
  const s = map[status] || { color: "bg-gray-100 text-gray-600", icon: "lucide:help-circle", label: status };
  return (
    <Badge variant="outline" className={`${s.color} flex items-center gap-1`}>
      <Icon icon={s.icon} className="h-3 w-3" />
      {s.label}
    </Badge>
  );
}

function timeRemaining(endAt: string): string {
  const diff = new Date(endAt).getTime() - Date.now();
  if (diff <= 0) return "Expired";
  const h = Math.floor(diff / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  if (h > 24) {
    const d = Math.floor(h / 24);
    return `${d}d ${h % 24}h`;
  }
  return `${h}h ${m}m`;
}

// ============ COMPONENT ============
export default function OtaDashboard() {
  // Data
  const [firmwares, setFirmwares] = useState<OtaFirmware[]>([]);
  const [strategies, setStrategies] = useState<OtaStrategy[]>([]);
  const [allDevices, setAllDevices] = useState<DeviceInfo[]>([]);
  const [loading, setLoading] = useState(true);

  // Upload firmware dialog
  const [uploadOpen, setUploadOpen] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadVersion, setUploadVersion] = useState("");
  const [uploadDesc, setUploadDesc] = useState("");
  const [uploading, setUploading] = useState(false);

  // Strategy dialog
  const [strategyOpen, setStrategyOpen] = useState(false);
  const [editingStrategy, setEditingStrategy] = useState<OtaStrategy | null>(null);
  const [strategyName, setStrategyName] = useState("");
  const [strategyFirmwareId, setStrategyFirmwareId] = useState("");
  const [strategyStartAt, setStrategyStartAt] = useState("");
  const [strategyEndAt, setStrategyEndAt] = useState("");
  const [strategyActive, setStrategyActive] = useState(true);
  const [savingStrategy, setSavingStrategy] = useState(false);

  // Device binding dialog
  const [bindOpen, setBindOpen] = useState(false);
  const [bindStrategyId, setBindStrategyId] = useState("");
  const [bindStrategyName, setBindStrategyName] = useState("");
  const [boundDevices, setBoundDevices] = useState<OtaStrategyDevice[]>([]);
  const [selectedSns, setSelectedSns] = useState<string[]>([]);
  const [bindLoading, setBindLoading] = useState(false);
  const [deviceSearch, setDeviceSearch] = useState("");

  // Detail / Logs dialog
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailStrategy, setDetailStrategy] = useState<OtaStrategy | null>(null);
  const [downloadLogs, setDownloadLogs] = useState<OtaDownloadLog[]>([]);
  const [logsLoading, setLogsLoading] = useState(false);

  // ============ DATA FETCHING ============
  const fetchFirmwares = useCallback(async () => {
    try {
      const res = await fetch("/api/ota/firmware");
      if (res.ok) setFirmwares(await res.json());
    } catch (e) {
      console.error("Fetch firmware error:", e);
    }
  }, []);

  const fetchStrategies = useCallback(async () => {
    try {
      const res = await fetch("/api/ota/strategies");
      if (res.ok) setStrategies(await res.json());
    } catch (e) {
      console.error("Fetch strategies error:", e);
    }
  }, []);

  const fetchDevices = useCallback(async () => {
    try {
      const res = await fetch("/api/ota/devices");
      if (res.ok) setAllDevices(await res.json());
    } catch (e) {
      console.error("Fetch devices error:", e);
    }
  }, []);

  useEffect(() => {
    Promise.all([fetchFirmwares(), fetchStrategies(), fetchDevices()]).finally(() =>
      setLoading(false)
    );
  }, [fetchFirmwares, fetchStrategies, fetchDevices]);

  // Auto-refresh strategies every 30s to update statuses
  useEffect(() => {
    const iv = setInterval(fetchStrategies, 30000);
    return () => clearInterval(iv);
  }, [fetchStrategies]);

  // ============ FIRMWARE ACTIONS ============
  async function handleUpload() {
    if (!uploadFile || !uploadVersion) return;
    setUploading(true);
    try {
      const form = new FormData();
      form.append("file", uploadFile);
      form.append("version", uploadVersion);
      if (uploadDesc) form.append("description", uploadDesc);

      const res = await fetch("/api/ota/firmware/upload", { method: "POST", body: form });
      if (res.ok) {
        setUploadOpen(false);
        setUploadFile(null);
        setUploadVersion("");
        setUploadDesc("");
        fetchFirmwares();
      } else {
        const err = await res.json();
        alert(err.error || err.message || "Upload failed");
      }
    } finally {
      setUploading(false);
    }
  }

  async function handleDeleteFirmware(id: string) {
    try {
      await fetch(`/api/ota/firmware/${id}`, { method: "DELETE" });
      fetchFirmwares();
    } catch (e) {
      console.error("Delete firmware error:", e);
    }
  }

  // ============ STRATEGY ACTIONS ============
  function openCreateStrategy() {
    setEditingStrategy(null);
    setStrategyName("");
    setStrategyFirmwareId(firmwares[0]?.id || "");
    // Default: start now, end in 7 days
    const now = new Date();
    const end = new Date(now.getTime() + 7 * 24 * 3600000);
    setStrategyStartAt(toLocalDatetimeInput(now.toISOString()));
    setStrategyEndAt(toLocalDatetimeInput(end.toISOString()));
    setStrategyActive(true);
    setStrategyOpen(true);
  }

  function openEditStrategy(s: OtaStrategy) {
    setEditingStrategy(s);
    setStrategyName(s.name);
    setStrategyFirmwareId(s.firmwareId);
    setStrategyStartAt(toLocalDatetimeInput(s.startAt));
    setStrategyEndAt(toLocalDatetimeInput(s.endAt));
    setStrategyActive(s.isActive);
    setStrategyOpen(true);
  }

  async function handleSaveStrategy() {
    if (!strategyName || !strategyFirmwareId || !strategyStartAt || !strategyEndAt) return;
    setSavingStrategy(true);
    try {
      const body = {
        name: strategyName,
        firmwareId: strategyFirmwareId,
        startAt: new Date(strategyStartAt).toISOString(),
        endAt: new Date(strategyEndAt).toISOString(),
        isActive: strategyActive,
      };
      const url = editingStrategy
        ? `/api/ota/strategies/${editingStrategy.id}`
        : "/api/ota/strategies";
      const method = editingStrategy ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (res.ok) {
        setStrategyOpen(false);
        fetchStrategies();
      } else {
        const err = await res.json();
        alert(err.error || err.message || "Save failed");
      }
    } finally {
      setSavingStrategy(false);
    }
  }

  async function handleDeleteStrategy(id: string) {
    try {
      await fetch(`/api/ota/strategies/${id}`, { method: "DELETE" });
      fetchStrategies();
    } catch (e) {
      console.error("Delete strategy error:", e);
    }
  }

  // ============ DEVICE BINDING ACTIONS ============
  async function openBindDialog(strategyId: string, name: string) {
    setBindStrategyId(strategyId);
    setBindStrategyName(name);
    setSelectedSns([]);
    setDeviceSearch("");
    setBindLoading(true);
    setBindOpen(true);
    try {
      const res = await fetch(`/api/ota/strategies/${strategyId}/devices`);
      if (res.ok) setBoundDevices(await res.json());
    } finally {
      setBindLoading(false);
    }
  }

  async function handleBindDevices() {
    if (selectedSns.length === 0) return;
    setBindLoading(true);
    try {
      await fetch(`/api/ota/strategies/${bindStrategyId}/devices`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ serialNumbers: selectedSns }),
      });
      setSelectedSns([]);
      // Refresh bound device list
      const res = await fetch(`/api/ota/strategies/${bindStrategyId}/devices`);
      if (res.ok) setBoundDevices(await res.json());
      fetchStrategies();
    } finally {
      setBindLoading(false);
    }
  }

  async function handleUnbindDevice(deviceRecordId: string) {
    try {
      await fetch(
        `/api/ota/strategies/${bindStrategyId}/devices/${deviceRecordId}`,
        { method: "DELETE" }
      );
      setBoundDevices((d) => d.filter((x) => x.id !== deviceRecordId));
      fetchStrategies();
    } catch (e) {
      console.error("Unbind error:", e);
    }
  }

  function toggleSnSelection(sn: string) {
    setSelectedSns((prev) =>
      prev.includes(sn) ? prev.filter((x) => x !== sn) : [...prev, sn]
    );
  }

  // ============ DETAIL / LOGS ============
  async function openDetail(s: OtaStrategy) {
    setDetailStrategy(s);
    setDetailOpen(true);
    setLogsLoading(true);
    try {
      const res = await fetch(`/api/ota/strategies/${s.id}/logs`);
      if (res.ok) setDownloadLogs(await res.json());
    } finally {
      setLogsLoading(false);
    }
  }

  // ============ COMPUTED ============
  const boundSns = boundDevices.map((d) => d.deviceSn);
  const availableDevices = allDevices.filter(
    (d) =>
      !boundSns.includes(d.serialNumber) &&
      (deviceSearch === "" ||
        d.serialNumber.toLowerCase().includes(deviceSearch.toLowerCase()) ||
        d.merchant?.name?.toLowerCase().includes(deviceSearch.toLowerCase()))
  );

  // Stats
  const totalDownloads = strategies.reduce((a, s) => a + (s._count?.downloadLogs || 0), 0);
  const activeCount = strategies.filter((s) => s.status === "ACTIVE").length;
  const scheduledCount = strategies.filter((s) => s.status === "SCHEDULED").length;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Icon icon="lucide:loader-2" className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* ===== STATS CARDS ===== */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-blue-100 p-2">
                <Icon icon="lucide:hard-drive" className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Firmware</p>
                <p className="text-2xl font-bold">{firmwares.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-green-100 p-2">
                <Icon icon="lucide:radio" className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Active</p>
                <p className="text-2xl font-bold">{activeCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-yellow-100 p-2">
                <Icon icon="lucide:clock" className="h-5 w-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Scheduled</p>
                <p className="text-2xl font-bold">{scheduledCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-purple-100 p-2">
                <Icon icon="lucide:download" className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Downloads</p>
                <p className="text-2xl font-bold">{totalDownloads}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ===== MAIN TABS ===== */}
      <Tabs defaultValue="strategies">
        <TabsList>
          <TabsTrigger value="strategies">
            <Icon icon="lucide:layers" className="mr-1 h-4 w-4" />
            Strategies ({strategies.length})
          </TabsTrigger>
          <TabsTrigger value="firmware">
            <Icon icon="lucide:hard-drive" className="mr-1 h-4 w-4" />
            Firmware ({firmwares.length})
          </TabsTrigger>
        </TabsList>

        {/* ========== STRATEGIES TAB ========== */}
        <TabsContent value="strategies" className="space-y-4">
          <div className="flex justify-end">
            <Button onClick={openCreateStrategy} size="sm">
              <Icon icon="lucide:plus" className="mr-1 h-4 w-4" />
              New Strategy
            </Button>
          </div>

          {strategies.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                <Icon icon="lucide:inbox" className="mx-auto mb-2 h-10 w-10" />
                <p>No strategies yet. Create one to start deploying firmware.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {strategies.map((s) => {
                const devicesUpdated = s.devices?.filter((d) => d.status === "UPDATED").length || 0;
                const devicesTotal = s._count?.devices || 0;
                const devicesFailed = s.devices?.filter((d) => d.status === "FAILED").length || 0;
                const totalDl = s._count?.downloadLogs || 0;

                return (
                  <Card key={s.id} className={`${s.status === "EXPIRED" ? "opacity-60" : ""}`}>
                    <CardContent className="pt-6">
                      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                        {/* Left: Info */}
                        <div className="space-y-2 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="text-lg font-semibold">{s.name}</h3>
                            {strategyStatusBadge(s.status)}
                            {!s.isActive && (
                              <Badge variant="outline" className="bg-orange-100 text-orange-700 border-orange-300">
                                Disabled
                              </Badge>
                            )}
                          </div>

                          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                            <div>
                              <span className="text-muted-foreground">Firmware:</span>{" "}
                              <span className="font-medium">v{s.firmware.version}</span>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Start:</span>{" "}
                              <span className="font-medium">{formatDate(s.startAt)}</span>
                            </div>
                            <div>
                              <span className="text-muted-foreground">End:</span>{" "}
                              <span className="font-medium">{formatDate(s.endAt)}</span>
                            </div>
                            <div>
                              {s.status === "ACTIVE" ? (
                                <>
                                  <span className="text-muted-foreground">Expires in:</span>{" "}
                                  <span className="font-medium text-orange-600">{timeRemaining(s.endAt)}</span>
                                </>
                              ) : s.status === "SCHEDULED" ? (
                                <>
                                  <span className="text-muted-foreground">Starts in:</span>{" "}
                                  <span className="font-medium text-blue-600">{timeRemaining(s.startAt)}</span>
                                </>
                              ) : (
                                <>
                                  <span className="text-muted-foreground">Ended:</span>{" "}
                                  <span className="font-medium text-gray-500">{formatDate(s.endAt)}</span>
                                </>
                              )}
                            </div>
                          </div>

                          {/* Device progress bar */}
                          <div className="flex items-center gap-3 text-sm">
                            <span className="text-muted-foreground">Devices:</span>
                            <div className="flex items-center gap-2 flex-1 max-w-xs">
                              <div className="h-2 flex-1 rounded-full bg-gray-100 overflow-hidden">
                                <div
                                  className="h-full bg-green-500 rounded-full transition-all"
                                  style={{
                                    width: devicesTotal > 0 ? `${(devicesUpdated / devicesTotal) * 100}%` : "0%",
                                  }}
                                />
                              </div>
                              <span className="text-xs text-muted-foreground">
                                {devicesUpdated}/{devicesTotal} updated
                              </span>
                            </div>
                            {devicesFailed > 0 && (
                              <span className="text-xs text-red-500">{devicesFailed} failed</span>
                            )}
                            <span className="text-xs text-muted-foreground">
                              | {totalDl} downloads
                            </span>
                          </div>
                        </div>

                        {/* Right: Actions */}
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            title="Detail & Logs"
                            onClick={() => openDetail(s)}
                          >
                            <Icon icon="lucide:bar-chart-3" className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            title="Manage Devices"
                            onClick={() => openBindDialog(s.id, s.name)}
                          >
                            <Icon icon="lucide:monitor-smartphone" className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            title="Edit"
                            onClick={() => openEditStrategy(s)}
                            disabled={s.status === "EXPIRED"}
                          >
                            <Icon icon="lucide:pencil" className="h-4 w-4" />
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="icon" title="Delete">
                                <Icon icon="lucide:trash-2" className="h-4 w-4 text-red-500" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete Strategy?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Strategy &quot;{s.name}&quot; and all device bindings will be deleted.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleDeleteStrategy(s.id)}>
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        {/* ========== FIRMWARE TAB ========== */}
        <TabsContent value="firmware" className="space-y-4">
          <div className="flex justify-end">
            <Button onClick={() => setUploadOpen(true)} size="sm">
              <Icon icon="lucide:upload" className="mr-1 h-4 w-4" />
              Upload Firmware
            </Button>
          </div>

          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Version</TableHead>
                  <TableHead>Filename</TableHead>
                  <TableHead>Size</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Strategies</TableHead>
                  <TableHead>Uploaded</TableHead>
                  <TableHead className="w-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {firmwares.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                      No firmware uploaded yet
                    </TableCell>
                  </TableRow>
                ) : (
                  firmwares.map((fw) => (
                    <TableRow key={fw.id}>
                      <TableCell className="font-mono font-semibold">v{fw.version}</TableCell>
                      <TableCell className="text-sm">{fw.filename}</TableCell>
                      <TableCell className="text-sm">{formatFileSize(fw.filesize)}</TableCell>
                      <TableCell className="text-sm text-muted-foreground max-w-[200px] truncate">
                        {fw.description || "—"}
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">{fw._count.strategies}</Badge>
                      </TableCell>
                      <TableCell className="text-sm">{formatDate(fw.createdAt)}</TableCell>
                      <TableCell>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              disabled={fw._count.strategies > 0}
                              title={
                                fw._count.strategies > 0
                                  ? "Cannot delete: used by strategies"
                                  : "Delete"
                              }
                            >
                              <Icon icon="lucide:trash-2" className="h-4 w-4 text-red-500" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Firmware?</AlertDialogTitle>
                              <AlertDialogDescription>
                                v{fw.version} ({fw.filename}) will be permanently deleted.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDeleteFirmware(fw.id)}>
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>
      </Tabs>

      {/* ===== DIALOG: Upload Firmware ===== */}
      <Dialog open={uploadOpen} onOpenChange={setUploadOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Upload Firmware</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1">
              <Label>Version *</Label>
              <Input
                placeholder="e.g. 1.0.5"
                value={uploadVersion}
                onChange={(e) => setUploadVersion(e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <Label>File *</Label>
              <Input
                type="file"
                onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
              />
              {uploadFile && (
                <p className="text-xs text-muted-foreground">
                  {uploadFile.name} ({formatFileSize(uploadFile.size)})
                </p>
              )}
            </div>
            <div className="space-y-1">
              <Label>Description</Label>
              <Input
                placeholder="Optional notes"
                value={uploadDesc}
                onChange={(e) => setUploadDesc(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setUploadOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpload} disabled={uploading || !uploadFile || !uploadVersion}>
              {uploading ? (
                <>
                  <Icon icon="lucide:loader-2" className="mr-1 h-4 w-4 animate-spin" />
                  Uploading...
                </>
              ) : (
                "Upload"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ===== DIALOG: Create/Edit Strategy ===== */}
      <Dialog open={strategyOpen} onOpenChange={setStrategyOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingStrategy ? "Edit Strategy" : "New Strategy"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1">
              <Label>Name *</Label>
              <Input
                placeholder="e.g. Rollout Q1 batch"
                value={strategyName}
                onChange={(e) => setStrategyName(e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <Label>Firmware *</Label>
              <Select value={strategyFirmwareId} onValueChange={setStrategyFirmwareId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select firmware" />
                </SelectTrigger>
                <SelectContent>
                  {firmwares.map((fw) => (
                    <SelectItem key={fw.id} value={fw.id}>
                      v{fw.version} — {fw.filename}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Start At *</Label>
                <Input
                  type="datetime-local"
                  value={strategyStartAt}
                  onChange={(e) => setStrategyStartAt(e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <Label>End At *</Label>
                <Input
                  type="datetime-local"
                  value={strategyEndAt}
                  onChange={(e) => setStrategyEndAt(e.target.value)}
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={strategyActive} onCheckedChange={setStrategyActive} />
              <Label>Active</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setStrategyOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSaveStrategy}
              disabled={
                savingStrategy ||
                !strategyName ||
                !strategyFirmwareId ||
                !strategyStartAt ||
                !strategyEndAt
              }
            >
              {savingStrategy ? (
                <Icon icon="lucide:loader-2" className="mr-1 h-4 w-4 animate-spin" />
              ) : null}
              {editingStrategy ? "Save Changes" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ===== DIALOG: Device Binding ===== */}
      <Dialog open={bindOpen} onOpenChange={setBindOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              <Icon icon="lucide:monitor-smartphone" className="inline mr-2 h-5 w-5" />
              Manage Devices — {bindStrategyName}
            </DialogTitle>
          </DialogHeader>

          {/* Bound devices */}
          <div className="space-y-2">
            <h4 className="text-sm font-medium">
              Bound Devices ({boundDevices.length})
            </h4>
            {boundDevices.length === 0 ? (
              <p className="text-sm text-muted-foreground">No devices bound yet</p>
            ) : (
              <div className="max-h-[200px] overflow-y-auto border rounded">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>SN</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Downloads</TableHead>
                      <TableHead>Last Check</TableHead>
                      <TableHead className="w-12"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {boundDevices.map((d) => (
                      <TableRow key={d.id}>
                        <TableCell className="font-mono text-sm">{d.deviceSn}</TableCell>
                        <TableCell>{deviceStatusBadge(d.status)}</TableCell>
                        <TableCell className="text-sm">{d.downloadCount}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {d.lastCheckedAt ? formatDate(d.lastCheckedAt) : "—"}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleUnbindDevice(d.id)}
                          >
                            <Icon icon="lucide:x" className="h-4 w-4 text-red-500" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>

          {/* Add devices */}
          <div className="space-y-2">
            <h4 className="text-sm font-medium">Add Devices</h4>
            <Input
              placeholder="Search by SN or merchant..."
              value={deviceSearch}
              onChange={(e) => setDeviceSearch(e.target.value)}
            />
            <div className="max-h-[200px] overflow-y-auto border rounded">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-10"></TableHead>
                    <TableHead>SN</TableHead>
                    <TableHead>Model</TableHead>
                    <TableHead>Merchant</TableHead>
                    <TableHead>Current FW</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {availableDevices.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-muted-foreground text-sm">
                        No available devices
                      </TableCell>
                    </TableRow>
                  ) : (
                    availableDevices.map((d) => (
                      <TableRow
                        key={d.serialNumber}
                        className="cursor-pointer"
                        onClick={() => toggleSnSelection(d.serialNumber)}
                      >
                        <TableCell>
                          <input
                            type="checkbox"
                            checked={selectedSns.includes(d.serialNumber)}
                            readOnly
                            className="rounded"
                          />
                        </TableCell>
                        <TableCell className="font-mono text-sm">{d.serialNumber}</TableCell>
                        <TableCell className="text-sm">{d.model}</TableCell>
                        <TableCell className="text-sm">{d.merchant?.name || "—"}</TableCell>
                        <TableCell className="text-sm">{d.firmware || "—"}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
            {selectedSns.length > 0 && (
              <Button onClick={handleBindDevices} disabled={bindLoading} size="sm">
                {bindLoading ? (
                  <Icon icon="lucide:loader-2" className="mr-1 h-4 w-4 animate-spin" />
                ) : null}
                Bind {selectedSns.length} Device(s)
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* ===== DIALOG: Strategy Detail & Download Logs ===== */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          {detailStrategy && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Icon icon="lucide:bar-chart-3" className="h-5 w-5" />
                  {detailStrategy.name}
                  {strategyStatusBadge(detailStrategy.status)}
                </DialogTitle>
              </DialogHeader>

              <div className="space-y-4">
                {/* Summary cards */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="border rounded-lg p-3 text-center">
                    <p className="text-2xl font-bold">{detailStrategy._count?.devices || 0}</p>
                    <p className="text-xs text-muted-foreground">Devices</p>
                  </div>
                  <div className="border rounded-lg p-3 text-center">
                    <p className="text-2xl font-bold">{detailStrategy._count?.downloadLogs || 0}</p>
                    <p className="text-xs text-muted-foreground">Downloads</p>
                  </div>
                  <div className="border rounded-lg p-3 text-center">
                    <p className="text-2xl font-bold">
                      {detailStrategy.devices?.filter((d) => d.status === "UPDATED").length || 0}
                    </p>
                    <p className="text-xs text-muted-foreground">Updated</p>
                  </div>
                </div>

                {/* Schedule info */}
                <div className="border rounded-lg p-3 space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Firmware:</span>
                    <span className="font-mono">v{detailStrategy.firmware.version} ({formatFileSize(detailStrategy.firmware.filesize)})</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Window:</span>
                    <span>{formatDate(detailStrategy.startAt)} — {formatDate(detailStrategy.endAt)}</span>
                  </div>
                  {detailStrategy.status === "ACTIVE" && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Expires in:</span>
                      <span className="text-orange-600 font-medium">{timeRemaining(detailStrategy.endAt)}</span>
                    </div>
                  )}
                </div>

                {/* Device statuses */}
                {detailStrategy.devices && detailStrategy.devices.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium">Device Status</h4>
                    <div className="max-h-[200px] overflow-y-auto border rounded">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>SN</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Downloads</TableHead>
                            <TableHead>Last Check</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {detailStrategy.devices.map((d) => (
                            <TableRow key={d.id}>
                              <TableCell className="font-mono text-sm">{d.deviceSn}</TableCell>
                              <TableCell>{deviceStatusBadge(d.status)}</TableCell>
                              <TableCell className="text-sm">{d.downloadCount}</TableCell>
                              <TableCell className="text-sm text-muted-foreground">
                                {d.lastCheckedAt ? formatDate(d.lastCheckedAt) : "—"}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                )}

                {/* Download logs */}
                <div className="space-y-2">
                  <h4 className="text-sm font-medium">Recent Download Logs</h4>
                  {logsLoading ? (
                    <div className="flex justify-center py-4">
                      <Icon icon="lucide:loader-2" className="h-5 w-5 animate-spin text-muted-foreground" />
                    </div>
                  ) : downloadLogs.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No downloads yet</p>
                  ) : (
                    <div className="max-h-[200px] overflow-y-auto border rounded">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Device SN</TableHead>
                            <TableHead>Downloaded At</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {downloadLogs.map((log) => (
                            <TableRow key={log.id}>
                              <TableCell className="font-mono text-sm">{log.deviceSn}</TableCell>
                              <TableCell className="text-sm">{formatDate(log.createdAt)}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

