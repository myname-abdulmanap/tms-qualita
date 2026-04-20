"use client";

import { useEffect, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
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
interface AvailableApk {
  id: string;
  appName: string;
  version: string;
  description: string | null;
  filesize: number;
  downloadUrl: string;
  installed: boolean;
  installedAt: string | null;
  status: string; // AVAILABLE | NOTIFIED | INSTALLED
}

// ============ HELPERS ============
function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "-";
  return new Date(dateStr).toLocaleString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// ============ COMPONENT ============
interface EdcApkListProps {
  deviceSn: string; // Device serial number
  currentVersion?: string; // Current installed version
  onDownloadComplete?: (apkId: string, version: string) => void;
}

export default function EdcApkList({
  deviceSn,
  currentVersion,
  onDownloadComplete,
}: EdcApkListProps) {
  const [apks, setApks] = useState<AvailableApk[]>([]);
  const [loading, setLoading] = useState(true);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [downloadProgress, setDownloadProgress] = useState(0);

  // ============ DATA FETCHING ============
  const fetchApks = useCallback(async () => {
    try {
      const res = await fetch(
        `/api/apk/device/list?sn=${encodeURIComponent(deviceSn)}`,
      );
      if (res.ok) {
        const data = await res.json();
        setApks(data.data || []);
      }
    } catch (e) {
      console.error("Fetch APKs error:", e);
    } finally {
      setLoading(false);
    }
  }, [deviceSn]);

  useEffect(() => {
    fetchApks();
  }, [fetchApks]);

  // ============ DOWNLOAD LOGIC ============
  async function handleDownload(apk: AvailableApk) {
    setDownloadingId(apk.id);
    setDownloadProgress(0);

    try {
      const response = await fetch(apk.downloadUrl);

      if (!response.ok) {
        alert("Failed to download APK");
        setDownloadingId(null);
        return;
      }

      const contentLength = parseInt(
        response.headers.get("content-length") || "0",
        10,
      );
      const reader = response.body?.getReader();

      if (!reader) {
        alert("Failed to download APK");
        setDownloadingId(null);
        return;
      }

      const chunks: Uint8Array[] = [];
      let receivedLength = 0;

      while (true) {
        const { done, value } = await reader.read();

        if (done) break;

        chunks.push(value);
        receivedLength += value.length;

        if (contentLength > 0) {
          setDownloadProgress(
            Math.round((receivedLength / contentLength) * 100),
          );
        }
      }

      // Create blob and trigger download
      const blob = new Blob(chunks, {
        type: "application/vnd.android.package-archive",
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${apk.appName}-${apk.version}.apk`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      // Notify backend of download completion
      // In a real mobile app, this would be triggered after installation
      await reportDownloadComplete(apk, "SUCCESS");
      setDownloadingId(null);
      setDownloadProgress(0);

      if (onDownloadComplete) {
        onDownloadComplete(apk.id, apk.version);
      }
    } catch (e) {
      console.error("Download error:", e);
      alert("Download failed");
      setDownloadingId(null);
    }
  }

  async function reportDownloadComplete(apk: AvailableApk, status: string) {
    try {
      await fetch("/api/apk/device/report-result", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sn: deviceSn,
          version: apk.version,
          status: status === "SUCCESS" ? "SUCCESS" : "FAILED",
        }),
      });
    } catch (e) {
      console.error("Report error:", e);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Available Applications</h3>
          <p className="text-sm text-gray-600">
            Download and install the latest version of your agent app
          </p>
        </div>
        <Button size="sm" variant="outline" onClick={fetchApks}>
          <Icon icon="lucide:refresh-cw" className="mr-2 h-4 w-4" />
          Refresh
        </Button>
      </div>

      {loading ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8 text-gray-500">Loading...</div>
          </CardContent>
        </Card>
      ) : apks.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8 text-gray-500">
              No applications available
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {apks.map((apk) => {
            const isDownloading = downloadingId === apk.id;
            const needsUpdate =
              !apk.installed &&
              currentVersion &&
              apk.version !== currentVersion;

            return (
              <Card key={apk.id} className="overflow-hidden">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <Icon icon="lucide:package" className="h-4 w-4 text-sky-600" />
                        <CardTitle className="text-base">
                          {apk.appName}
                        </CardTitle>
                        <Badge variant="outline" className="text-xs">
                          v{apk.version}
                        </Badge>
                        {apk.installed && (
                          <Badge
                            variant="outline"
                            className="bg-green-100 text-green-800 border-green-300 text-xs"
                          >
                            <Icon
                              icon="lucide:check"
                              className="mr-1 h-3 w-3"
                            />
                            Installed
                          </Badge>
                        )}
                        {needsUpdate && (
                          <Badge
                            variant="outline"
                            className="bg-blue-100 text-blue-800 border-blue-300 text-xs"
                          >
                            <Icon
                              icon="lucide:alert-circle"
                              className="mr-1 h-3 w-3"
                            />
                            Update Available
                          </Badge>
                        )}
                      </div>
                      {apk.description && (
                        <p className="text-sm text-gray-600 mt-2">
                          {apk.description}
                        </p>
                      )}
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  {/* File info */}
                  <div className="flex items-center gap-4 text-sm text-gray-600">
                    <div className="flex items-center gap-1">
                      <Icon icon="lucide:file" className="h-4 w-4" />
                      {formatFileSize(apk.filesize)}
                    </div>
                    {apk.installedAt && (
                      <div className="flex items-center gap-1">
                        <Icon icon="lucide:calendar" className="h-4 w-4" />
                        {formatDate(apk.installedAt)}
                      </div>
                    )}
                  </div>

                  {/* Download progress */}
                  {isDownloading && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span>Downloading...</span>
                        <span className="font-semibold">
                          {downloadProgress}%
                        </span>
                      </div>
                      <Progress value={downloadProgress} className="h-2" />
                    </div>
                  )}

                  {/* Action button */}
                  <div className="flex gap-2">
                    {apk.installed ? (
                      <Button disabled className="flex-1">
                        <Icon icon="lucide:check" className="mr-2 h-4 w-4" />
                        Already Installed
                      </Button>
                    ) : (
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            className="flex-1"
                            disabled={isDownloading}
                            variant={needsUpdate ? "default" : "outline"}
                          >
                            <Icon
                              icon={
                                isDownloading
                                  ? "lucide:download"
                                  : "lucide:download"
                              }
                              className="mr-2 h-4 w-4"
                            />
                            {isDownloading
                              ? `Downloading... ${downloadProgress}%`
                              : "Download"}
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>
                              Download Application
                            </AlertDialogTitle>
                            <AlertDialogDescription>
                              {apk.appName} v{apk.version} (
                              {formatFileSize(apk.filesize)})
                              {needsUpdate &&
                                ` - New update from v${currentVersion}`}
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDownload(apk)}
                              className="bg-blue-600 hover:bg-blue-700"
                            >
                              Download
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
