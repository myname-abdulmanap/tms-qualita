"use client";

import { useEffect, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
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
interface EdcApk {
  id: string;
  appName: string;
  version: string;
  filename: string;
  filepath: string;
  filesize: number;
  description: string | null;
  isActive: boolean;
  createdAt: string;
  deviceCount?: number;
  notificationCount?: number;
}

interface EdcApkDevice {
  deviceSn: string;
  status: string; // AVAILABLE | NOTIFIED | INSTALLED
  downloadCount: number;
  installedAt: string | null;
}

interface EdcApkNotification {
  deviceSn: string;
  status: string; // PENDING | SENT | ACKNOWLEDGED | DISMISSED
  sentAt: string | null;
  acknowledgedAt: string | null;
}

interface EdcApkDetails extends EdcApk {
  devices: EdcApkDevice[];
  notifications: EdcApkNotification[];
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

function deviceStatusBadge(status: string) {
  const map: Record<string, { color: string; label: string }> = {
    AVAILABLE: {
      color: "bg-gray-100 text-gray-800 border-gray-300",
      label: "Available",
    },
    NOTIFIED: {
      color: "bg-blue-100 text-blue-800 border-blue-300",
      label: "Notified",
    },
    INSTALLED: {
      color: "bg-green-100 text-green-800 border-green-300",
      label: "Installed",
    },
  };
  const s = map[status] || {
    color: "bg-gray-100 text-gray-600",
    label: status,
  };
  return (
    <Badge variant="outline" className={s.color}>
      {s.label}
    </Badge>
  );
}

function notificationStatusBadge(status: string) {
  const map: Record<string, { color: string; label: string }> = {
    PENDING: {
      color: "bg-yellow-100 text-yellow-800 border-yellow-300",
      label: "Pending",
    },
    SENT: {
      color: "bg-blue-100 text-blue-800 border-blue-300",
      label: "Sent",
    },
    ACKNOWLEDGED: {
      color: "bg-green-100 text-green-800 border-green-300",
      label: "Acknowledged",
    },
    DISMISSED: {
      color: "bg-red-100 text-red-800 border-red-300",
      label: "Dismissed",
    },
  };
  const s = map[status] || {
    color: "bg-gray-100 text-gray-600",
    label: status,
  };
  return (
    <Badge variant="outline" className={s.color}>
      {s.label}
    </Badge>
  );
}

// ============ COMPONENT ============
export default function EdcApkDashboard() {
  // Data
  const [apks, setApks] = useState<EdcApk[]>([]);
  const [loading, setLoading] = useState(true);

  // Upload dialog
  const [uploadOpen, setUploadOpen] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadAppName, setUploadAppName] = useState("TMS Agent");
  const [uploadVersion, setUploadVersion] = useState("");
  const [uploadDesc, setUploadDesc] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");

  // Detail dialog
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailApk, setDetailApk] = useState<EdcApkDetails | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  // Delete confirmation
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deletingApkId, setDeletingApkId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  // ============ DATA FETCHING ============
  const fetchApks = useCallback(async () => {
    try {
      const res = await fetch("/api/apk");
      if (res.ok) {
        const data = await res.json();
        setApks(data.data || []);
      }
    } catch (e) {
      console.error("Fetch APKs error:", e);
    }
  }, []);

  useEffect(() => {
    fetchApks().finally(() => setLoading(false));
  }, [fetchApks]);

  // ============ UPLOAD ACTIONS ============
  function resetUploadForm() {
    setUploadFile(null);
    setUploadAppName("TMS Agent");
    setUploadVersion("");
    setUploadDesc("");
    setUploadError("");
    setUploading(false);
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadFile(file);
    setUploadError("");

    // Auto-extract version from filename (e.g., "app-1.2.3.apk" -> "1.2.3")
    const filename = file.name;
    const versionMatch = filename.match(/[\.-_]v?(\d+\.\d+(?:\.\d+)?)/i);
    if (versionMatch && versionMatch[1]) {
      setUploadVersion(versionMatch[1]);
    }

    // Auto-extract app name from filename (e.g., "QualitaApp2-1.0.0.apk" -> "QualitaApp2")
    const nameMatch = filename.match(/^([a-zA-Z0-9_-]+?)[\.-]/);
    if (nameMatch && nameMatch[1]) {
      setUploadAppName(nameMatch[1]);
    }
  }

  async function handleUpload() {
    if (!uploadFile || !uploadVersion) {
      setUploadError("File dan version harus diisi");
      return;
    }

    setUploading(true);
    setUploadError("");

    try {
      const form = new FormData();
      form.append("file", uploadFile);
      form.append("appName", uploadAppName);
      form.append("version", uploadVersion);
      if (uploadDesc) form.append("description", uploadDesc);

      const tokenRes = await fetch("/api/auth/token");
      const tokenData = await tokenRes.json();
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "";

      if (!backendUrl) {
        throw new Error("NEXT_PUBLIC_BACKEND_URL belum dikonfigurasi");
      }

      const headers: HeadersInit = {};
      if (tokenData.token) {
        headers.Authorization = `Bearer ${tokenData.token}`;
      }

      const res = await fetch(`${backendUrl}/apk/upload`, {
        method: "POST",
        headers,
        body: form,
      });

      const contentType = res.headers.get("content-type") || "";
      const data = contentType.includes("application/json")
        ? await res.json()
        : { error: await res.text() };

      if (res.ok) {
        setUploadOpen(false);
        resetUploadForm();
        await fetchApks();
      } else {
        const rawError = String(data?.error || "");
        const isTooLarge =
          res.status === 413 ||
          /entity too large|content too large|request entity too large|payload too large/i.test(rawError);
        setUploadError(
          isTooLarge
            ? "Ukuran file terlalu besar untuk server gateway saat ini. Hubungi admin untuk menaikkan upload limit."
            : rawError || "Upload gagal"
        );
      }
    } catch (e) {
      console.error("Upload error:", e);
      setUploadError("Error: " + String(e));
    } finally {
      setUploading(false);
    }
  }

  // ============ DETAIL ACTIONS ============
  async function handleShowDetail(apkId: string) {
    setDetailLoading(true);
    try {
      const res = await fetch(`/api/apk/${apkId}`);
      if (res.ok) {
        const data = await res.json();
        setDetailApk(data.data);
        setDetailOpen(true);
      }
    } catch (e) {
      console.error("Fetch detail error:", e);
    } finally {
      setDetailLoading(false);
    }
  }

  // ============ DELETE ACTIONS ============
  async function handleDelete() {
    if (!deletingApkId) return;

    setDeleting(true);
    try {
      const res = await fetch(`/api/apk/${deletingApkId}`, {
        method: "DELETE",
      });

      if (res.ok) {
        setDeleteOpen(false);
        setDeletingApkId(null);
        await fetchApks();
      }
    } catch (e) {
      console.error("Delete error:", e);
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-end">
        <Button onClick={() => setUploadOpen(true)}>
          <Icon icon="lucide:upload" className="mr-2 h-4 w-4" />
          Upload APK
        </Button>
      </div>

      {/* APK List */}
      <Card>
        <CardHeader>
          <CardTitle>APK Versions</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">Loading...</div>
          ) : apks.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              Belum ada APK yang diupload
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>App Name</TableHead>
                    <TableHead>Version</TableHead>
                    <TableHead>File Size</TableHead>
                    <TableHead>Devices</TableHead>
                    <TableHead>Notifications</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Uploaded At</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {apks.map((apk) => (
                    <TableRow key={apk.id}>
                      <TableCell className="font-medium">
                        {apk.appName}
                      </TableCell>
                      <TableCell>{apk.version}</TableCell>
                      <TableCell>{formatFileSize(apk.filesize)}</TableCell>
                      <TableCell>{apk.deviceCount || 0}</TableCell>
                      <TableCell>{apk.notificationCount || 0}</TableCell>
                      <TableCell>
                        {apk.isActive ? (
                          <Badge
                            variant="outline"
                            className="bg-green-100 text-green-800"
                          >
                            Active
                          </Badge>
                        ) : (
                          <Badge
                            variant="outline"
                            className="bg-gray-100 text-gray-600"
                          >
                            Inactive
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>{formatDate(apk.createdAt)}</TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleShowDetail(apk.id)}
                          >
                            <Icon icon="lucide:info" className="h-4 w-4" />
                          </Button>
                          <AlertDialog
                            open={deleteOpen && deletingApkId === apk.id}
                          >
                            <AlertDialogTrigger asChild>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setDeletingApkId(apk.id);
                                  setDeleteOpen(true);
                                }}
                              >
                                <Icon
                                  icon="lucide:trash-2"
                                  className="h-4 w-4"
                                />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete APK</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Apakah Anda yakin ingin menghapus APK ini? (
                                  {apk.appName} v{apk.version})
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel
                                  onClick={() => setDeleteOpen(false)}
                                >
                                  Cancel
                                </AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={handleDelete}
                                  disabled={deleting}
                                >
                                  {deleting ? "Deleting..." : "Delete"}
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Upload Dialog */}
      <Dialog
        open={uploadOpen}
        onOpenChange={(open) => {
          if (!open) {
            resetUploadForm();
          }
          setUploadOpen(open);
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Upload APK</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="appName">App Name</Label>
              <Input
                id="appName"
                value={uploadAppName}
                onChange={(e) => setUploadAppName(e.target.value)}
                placeholder="e.g. TMS Agent"
              />
            </div>

            <div>
              <Label htmlFor="version">Version</Label>
              <Input
                id="version"
                value={uploadVersion}
                onChange={(e) => setUploadVersion(e.target.value)}
                placeholder="e.g. 1.0.0"
              />
            </div>

            <div>
              <Label htmlFor="description">Description (Optional)</Label>
              <Input
                id="description"
                value={uploadDesc}
                onChange={(e) => setUploadDesc(e.target.value)}
                placeholder="Release notes / changelog"
              />
            </div>

            <div>
              <Label htmlFor="file">APK File</Label>
              <Input
                id="file"
                type="file"
                accept=".apk"
                onChange={handleFileChange}
              />
              {uploadFile && (
                <p className="mt-2 text-sm text-gray-600">
                  {uploadFile.name} ({formatFileSize(uploadFile.size)})
                </p>
              )}
            </div>

            {uploadError && (
              <div className="bg-red-50 border border-red-200 text-red-800 px-3 py-2 rounded text-sm">
                {uploadError}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setUploadOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleUpload}
              disabled={uploading || !uploadFile || !uploadVersion}
            >
              {uploading ? "Uploading..." : "Upload"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Detail Dialog */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {detailApk?.appName} v{detailApk?.version}
            </DialogTitle>
          </DialogHeader>

          {detailLoading ? (
            <div className="text-center py-8">Loading...</div>
          ) : detailApk ? (
            <Tabs defaultValue="devices">
              <TabsList>
                <TabsTrigger value="devices">
                  Devices ({detailApk.devices.length})
                </TabsTrigger>
                <TabsTrigger value="notifications">
                  Notifications ({detailApk.notifications.length})
                </TabsTrigger>
                <TabsTrigger value="info">Info</TabsTrigger>
              </TabsList>

              {/* Devices Tab */}
              <TabsContent value="devices">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Device SN</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Downloads</TableHead>
                        <TableHead>Installed At</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {detailApk.devices.map((device) => (
                        <TableRow key={device.deviceSn}>
                          <TableCell>{device.deviceSn}</TableCell>
                          <TableCell>
                            {deviceStatusBadge(device.status)}
                          </TableCell>
                          <TableCell>{device.downloadCount}</TableCell>
                          <TableCell>
                            {device.installedAt
                              ? formatDate(device.installedAt)
                              : "-"}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </TabsContent>

              {/* Notifications Tab */}
              <TabsContent value="notifications">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Device SN</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Sent At</TableHead>
                        <TableHead>Acknowledged At</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {detailApk.notifications.map((notif) => (
                        <TableRow key={notif.deviceSn}>
                          <TableCell>{notif.deviceSn}</TableCell>
                          <TableCell>
                            {notificationStatusBadge(notif.status)}
                          </TableCell>
                          <TableCell>
                            {notif.sentAt ? formatDate(notif.sentAt) : "-"}
                          </TableCell>
                          <TableCell>
                            {notif.acknowledgedAt
                              ? formatDate(notif.acknowledgedAt)
                              : "-"}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </TabsContent>

              {/* Info Tab */}
              <TabsContent value="info">
                <div className="space-y-3">
                  <div>
                    <strong>File Name:</strong> {detailApk.filename}
                  </div>
                  <div>
                    <strong>File Size:</strong>{" "}
                    {formatFileSize(detailApk.filesize)}
                  </div>
                  <div>
                    <strong>Description:</strong> {detailApk.description || "-"}
                  </div>
                  <div>
                    <strong>Created:</strong> {formatDate(detailApk.createdAt)}
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}
