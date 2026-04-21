"use client";

import { Fragment, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Icon } from "@iconify/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import DeviceDialog from "./device-dialog";
import DeviceDetailDialog from "./device-detail-dialog";

const PAGE_SIZE = 10;

type Device = {
  id: string;
  deviceCode: string;
  serialNumber: string;
  model: string;
  status: string;
  lastSeenAt?: string | null;
  telemetryUpdatedAt?: string | null;
  deviceType?: "EDC" | "SOUNDBOX";
  merchantId: string;
  merchant?: {
    id: string;
    name: string;
    clientId?: string;
  };
  createdAt?: string;
  locationName?: string | null;
  rawInfo?: Record<string, string> | null;
  healthInsights?: unknown[] | null;
  componentDiagnostics?: unknown[] | null;
  installedApps?: unknown[] | null;
  componentScore?: number | null;
};

type CurrentUser = {
  userId: string;
  clientId: string | null;
  merchantId: string | null;
  permissions: string[];
};

function formatDeviceTime(value?: string | null): string {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleString("id-ID");
}

function formatExportTimestamp(value: Date = new Date()): string {
  return value.toLocaleString("id-ID");
}

function sanitizeFileDate(value: Date = new Date()): string {
  const year = value.getFullYear();
  const month = `${value.getMonth() + 1}`.padStart(2, "0");
  const day = `${value.getDate()}`.padStart(2, "0");
  const hours = `${value.getHours()}`.padStart(2, "0");
  const minutes = `${value.getMinutes()}`.padStart(2, "0");
  return `${year}${month}${day}-${hours}${minutes}`;
}

async function loadPublicImageAsDataUrl(path: string): Promise<string | null> {
  try {
    const res = await fetch(path);
    if (!res.ok) return null;
    const blob = await res.blob();
    return await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(typeof reader.result === "string" ? reader.result : null);
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function getHeartbeatLabel(value?: string | null): string {
  if (!value) return "NO DATA";

  const ts = new Date(value).getTime();
  if (Number.isNaN(ts)) return "INVALID TIME";

  const ageMs = Date.now() - ts;
  if (ageMs <= 5 * 60 * 1000) return "LIVE";
  if (ageMs <= 30 * 60 * 1000) return "STALE";
  return "OFFLINE";
}

function formatRelativeDuration(ageMs: number): string {
  const totalMinutes = Math.max(0, Math.floor(ageMs / (60 * 1000)));
  const days = Math.floor(totalMinutes / (60 * 24));
  const hours = Math.floor((totalMinutes % (60 * 24)) / 60);
  const minutes = totalMinutes % 60;

  if (days > 0) {
    return `${days} hari${hours > 0 ? ` ${hours} jam` : ""}`;
  }

  if (hours > 0) {
    return `${hours} jam${minutes > 0 ? ` ${minutes} menit` : ""}`;
  }

  return `${Math.max(1, minutes)} menit`;
}

function getHeartbeatDescription(value?: string | null): string {
  if (!value) return "Belum ada heartbeat";

  const ts = new Date(value).getTime();
  if (Number.isNaN(ts)) return "Waktu heartbeat tidak valid";

  const ageMs = Math.max(0, Date.now() - ts);
  const label = getHeartbeatLabel(value);
  const duration = formatRelativeDuration(ageMs);

  if (label === "OFFLINE") {
    return `Offline ${duration}`;
  }

  return `Online ${duration}`;
}

function getDeviceExportRows(devices: Device[]) {
  return devices.map((device, index) => ({
    no: index + 1,
    deviceCode: device.deviceCode || "-",
    deviceType: device.deviceType || "-",
    serialNumber: device.serialNumber || "-",
    model: device.model || "-",
    merchant: device.merchant?.name || "-",
    heartbeatStatus: getHeartbeatLabel(device.lastSeenAt),
    heartbeatAt: formatDeviceTime(device.lastSeenAt),
    heartbeatDescription: getHeartbeatDescription(device.lastSeenAt),
  }));
}

function buildExportHtml(
  title: string,
  subtitle: string,
  rows: ReturnType<typeof getDeviceExportRows>,
  logoDataUrl?: string | null,
) {
  const generatedAt = escapeHtml(formatExportTimestamp());
  const logoMarkup = logoDataUrl
    ? `<img src="${logoDataUrl}" alt="Qualita Indonesia" style="width:64px;height:64px;object-fit:contain;display:block;" />`
    : "";
  const tableRows = rows
    .map(
      (row) => `
        <tr>
          <td>${row.no}</td>
          <td>${escapeHtml(row.deviceCode)}</td>
          <td>${escapeHtml(row.deviceType)}</td>
          <td>${escapeHtml(row.serialNumber)}</td>
          <td>${escapeHtml(row.model)}</td>
          <td>${escapeHtml(row.merchant)}</td>
          <td>${escapeHtml(row.heartbeatStatus)}</td>
          <td>${escapeHtml(row.heartbeatAt)}</td>
          <td>${escapeHtml(row.heartbeatDescription)}</td>
        </tr>`,
    )
    .join("");

  return `<!DOCTYPE html>
  <html>
    <head>
      <meta charset="UTF-8" />
      <title>${escapeHtml(title)}</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 0; color: #0f172a; }
        .sheet { padding: 28px; }
        .hero {
          padding: 0 0 18px 0;
          margin-bottom: 22px;
          border-bottom: 3px solid #1d4ed8;
        }
        .hero-top {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 16px;
        }
        .brand-wrap {
          display: flex;
          align-items: flex-start;
          gap: 14px;
        }
        .eyebrow { font-size: 12px; font-weight: 700; color: #1d4ed8; letter-spacing: 1px; text-transform: uppercase; }
        .title { font-size: 30px; font-weight: 700; margin-top: 6px; color: #111827; }
        .subtitle { margin-top: 6px; font-size: 14px; color: #4b5563; }
        .meta { margin-top: 4px; font-size: 12px; color: #6b7280; text-align: right; }
        table { width: 100%; border-collapse: collapse; }
        thead th {
          background: #f9fafb;
          color: #111827;
          text-align: left;
          padding: 12px;
          font-size: 12px;
          border: 1px solid #d1d5db;
          font-weight: 700;
        }
        tbody td {
          padding: 11px 12px;
          border: 1px solid #e5e7eb;
          font-size: 12px;
        }
        tbody tr:nth-child(even) { background: #fafafa; }
        .footer { margin-top: 18px; color: #64748b; font-size: 11px; }
      </style>
    </head>
    <body>
      <div class="sheet">
        <div class="hero">
          <div class="hero-top">
            <div class="brand-wrap">
              ${logoMarkup}
              <div>
                <div class="title">${escapeHtml(title)}</div>
                <div class="subtitle">${escapeHtml(subtitle)}</div>
              </div>
            </div>
            <div class="meta">Waktu unduh:<br/>${generatedAt}</div>
          </div>
        </div>
        <table>
          <thead>
            <tr>
              <th>No</th>
              <th>Device Code</th>
              <th>Type</th>
              <th>Serial Number</th>
              <th>Model</th>
              <th>Merchant</th>
              <th>Heartbeat</th>
              <th>Last Update</th>
              <th>Keterangan</th>
            </tr>
          </thead>
          <tbody>${tableRows}</tbody>
        </table>
        <div class="footer">TMS Qualita export document</div>
      </div>
    </body>
  </html>`;
}

async function exportDevicesToPdf(
  mode: "edc" | "soundbox",
  devices: Device[],
  logoDataUrl?: string | null,
) {
  const jspdfModule = await import("jspdf");
  const JsPdfCtor = (jspdfModule as { jsPDF: new (options?: unknown) => any }).jsPDF;
  const doc = new JsPdfCtor({
    orientation: "landscape",
    unit: "mm",
    format: "a4",
  });

  const rows = getDeviceExportRows(devices);
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const marginX = 10;
  const headerTop = 10;
  const tableStartY = 46;
  const rowHeight = 11;
  const colWidths = [10, 26, 18, 43, 24, 28, 20, 34, 34];
  const columns = [
    "No",
    "Device Code",
    "Type",
    "Serial Number",
    "Model",
    "Merchant",
    "Heartbeat",
    "Last Update",
    "Keterangan",
  ];
  const title = mode === "soundbox" ? "Qualita Soundbox Report" : "TMS Qualita Device Report";
  const subtitle = mode === "soundbox"
    ? "Export daftar soundbox dan heartbeat terakhir"
    : "Export daftar device EDC dan heartbeat terakhir";
  const generatedAt = formatExportTimestamp();

  const drawCellText = (value: string, x: number, y: number, width: number) => {
    const lines = doc.splitTextToSize(String(value || "-"), width - 4);
    const firstLine = Array.isArray(lines) ? String(lines[0] || "-") : String(lines || "-");
    doc.text(firstLine, x + 2, y + 6.8, { baseline: "middle" });
  };

  const drawHeader = () => {
    doc.setDrawColor(29, 78, 216);
    doc.setLineWidth(0.8);
    doc.line(marginX, headerTop + 22, pageWidth - marginX, headerTop + 22);

    if (logoDataUrl) {
      doc.addImage(logoDataUrl, "PNG", marginX, headerTop, 14, 14);
    }

    doc.setTextColor(17, 24, 39);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(19);
    doc.text(title, marginX + (logoDataUrl ? 18 : 0), headerTop + 8);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(75, 85, 99);
    doc.text(subtitle, marginX + (logoDataUrl ? 18 : 0), headerTop + 15);

    doc.setTextColor(107, 114, 128);
    doc.setFontSize(8.5);
    doc.text(`Waktu unduh: ${generatedAt}`, pageWidth - marginX, headerTop + 6, { align: "right" });
  };

  const drawTableHeader = (y: number) => {
    let x = marginX;
    doc.setDrawColor(209, 213, 219);
    doc.setTextColor(17, 24, 39);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7.5);

    columns.forEach((column, index) => {
      const width = colWidths[index];
      doc.setFillColor(249, 250, 251);
      doc.rect(x, y, width, rowHeight, "FD");
      const headerLines = doc.splitTextToSize(column, width - 4);
      const headerText = Array.isArray(headerLines)
        ? String(headerLines[0] || column)
        : String(headerLines || column);
      doc.text(headerText, x + 2, y + 6.5);
      x += width;
    });
  };

  const drawRow = (row: ReturnType<typeof getDeviceExportRows>[number], y: number, even: boolean) => {
    let x = marginX;
    doc.setDrawColor(229, 231, 235);
    doc.setTextColor(15, 23, 42);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);

    const values = [
      String(row.no),
      row.deviceCode,
      row.deviceType,
      row.serialNumber,
      row.model,
      row.merchant,
      row.heartbeatStatus,
      row.heartbeatAt,
      row.heartbeatDescription,
    ];

    values.forEach((value, index) => {
      const width = colWidths[index];
      if (even) {
        doc.setFillColor(250, 250, 250);
        doc.rect(x, y, width, rowHeight, "FD");
      } else {
        doc.rect(x, y, width, rowHeight, "S");
      }
      drawCellText(String(value), x, y, width);
      x += width;
    });
  };

  drawHeader();
  let y = tableStartY;
  drawTableHeader(y);
  y += rowHeight;

  rows.forEach((row, index) => {
    if (y + rowHeight > pageHeight - 14) {
      doc.addPage();
      drawHeader();
      y = tableStartY;
      drawTableHeader(y);
      y += rowHeight;
    }

    drawRow(row, y, index % 2 === 1);
    y += rowHeight;
  });

  doc.setTextColor(100, 116, 139);
  doc.setFontSize(8);
  doc.text("TMS Qualita export document", marginX, pageHeight - 6);
  doc.save(`tms-qualita-${mode}-report-${sanitizeFileDate()}.pdf`);
}

function getFreshnessBadge(value?: string | null) {
  if (!value) {
    return (
      <span className="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-[11px] font-semibold text-gray-700 dark:bg-slate-800 dark:text-gray-300">
        NO DATA
      </span>
    );
  }

  const ts = new Date(value).getTime();
  if (Number.isNaN(ts)) {
    return (
      <span className="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-[11px] font-semibold text-gray-700 dark:bg-slate-800 dark:text-gray-300">
        INVALID TIME
      </span>
    );
  }

  const ageMs = Date.now() - ts;
  if (ageMs <= 5 * 60 * 1000) {
    return (
      <span className="inline-flex items-center rounded-full bg-green-100 px-2 py-0.5 text-[11px] font-semibold text-green-700 dark:bg-green-900/30 dark:text-green-300">
        LIVE
      </span>
    );
  }

  if (ageMs <= 30 * 60 * 1000) {
    return (
      <span className="inline-flex items-center rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-semibold text-amber-700 dark:bg-amber-900/30 dark:text-amber-300">
        STALE
      </span>
    );
  }

  return (
    <span className="inline-flex items-center rounded-full bg-red-100 px-2 py-0.5 text-[11px] font-semibold text-red-700 dark:bg-red-900/30 dark:text-red-300">
      OFFLINE
    </span>
  );
}

function getDeviceTypeBadge(deviceType?: "EDC" | "SOUNDBOX") {
  if (deviceType === "EDC") {
    return (
      <span className="inline-flex items-center rounded-full bg-sky-100 px-2 py-0.5 text-[11px] font-semibold text-sky-700 dark:bg-sky-900/40 dark:text-sky-300">
        EDC
      </span>
    );
  }

  return (
    <span className="inline-flex items-center rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-semibold text-amber-700 dark:bg-amber-900/40 dark:text-amber-300">
      SOUNDBOX
    </span>
  );
}

export default function DeviceTable({
  mode = "edc",
  basePath = "/devices",
}: {
  mode?: "edc" | "soundbox";
  basePath?: string;
}) {
  type GroupByOption = "none" | "merchant" | "model" | "deviceType" | "heartbeat";
  type HeartbeatFilterOption = "all" | "live" | "stale" | "offline" | "no-data";

  const [devices, setDevices] = useState<Device[]>([]);
  const [open, setOpen] = useState(false);
  const [editDevice, setEditDevice] = useState<Device | null>(null);
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [loading, setLoading] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailDevice, setDetailDevice] = useState<Device | null>(null);
  const [detailLoadingId, setDetailLoadingId] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [exportingPdf, setExportingPdf] = useState(false);
  const [exportingExcel, setExportingExcel] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [groupBy, setGroupBy] = useState<GroupByOption>("none");
  const [heartbeatFilter, setHeartbeatFilter] = useState<HeartbeatFilterOption>("all");
  const router = useRouter();

  useEffect(() => {
    loadCurrentUser();
    loadDevices();
  }, [mode]);

  const loadCurrentUser = async () => {
    try {
      const res = await fetch("/api/me");
      if (res.ok) {
        const data = await res.json();
        setCurrentUser(data);
      }
    } catch (err) {
      console.error("Error loading current user:", err);
    }
  };

  const loadDevices = async () => {
    setLoading(true);
    try {
      const deviceTypeParam = mode === "soundbox" ? "SOUNDBOX" : "EDC";
      const res = await fetch(`/api/devices?deviceType=${deviceTypeParam}`);
      if (!res.ok) throw new Error("Failed to load devices");
      const data = await res.json();
      console.log("📦 Loaded devices with merchant data:", data);
      setDevices(Array.isArray(data) ? data : []);
      setPage(1);
    } catch (error) {
      console.error("Error loading devices:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Yakin hapus device ini?")) return;

    try {
      const res = await fetch(`/api/devices/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const error = await res.json();
        alert(error.message || "Gagal menghapus device");
        return;
      }
      loadDevices();
    } catch (error) {
      alert("Gagal menghapus device");
    }
  };

  const handleEdit = (device: Device) => {
    // Merchant users cannot edit devices
    if (currentUser?.merchantId) {
      alert("Anda tidak memiliki akses untuk edit device");
      return;
    }
    console.log("✏️ Editing device:", device, "Current user:", currentUser);
    setEditDevice(device);
    setOpen(true);
  };

  const handleAdd = () => {
    // Merchant users cannot create devices
    if (currentUser?.merchantId) {
      alert("Anda tidak memiliki akses untuk membuat device");
      return;
    }
    setEditDevice(null);
    setOpen(true);
  };

  const openDetail = async (device: Device) => {
    // EDC: navigate to full detail page
    if (mode === "edc") {
      router.push(`/edc/devices/${device.id}`);
      return;
    }
    setDetailLoadingId(device.id);
    try {
      const res = await fetch(`/api/devices/${device.id}`);
      if (!res.ok) throw new Error("Failed to load device detail");
      const data = await res.json();
      setDetailDevice(data);
      setDetailOpen(true);
    } catch (error) {
      console.error("Error loading device detail:", error);
      alert("Gagal memuat detail device");
    } finally {
      setDetailLoadingId(null);
    }
  };

  useEffect(() => {
    setPage(1);
  }, [searchQuery, groupBy, heartbeatFilter]);

  const normalizedSearch = searchQuery.trim().toLowerCase();
  const filteredDevices = devices.filter((device) => {
    const heartbeatLabel = getHeartbeatLabel(device.lastSeenAt).toLowerCase();
    const matchesHeartbeat = heartbeatFilter === "all"
      ? true
      : heartbeatFilter === "no-data"
        ? heartbeatLabel === "no data"
        : heartbeatLabel === heartbeatFilter;

    if (!matchesHeartbeat) return false;
    if (!normalizedSearch) return true;

    const searchable = [
      device.deviceCode,
      device.serialNumber,
      device.model,
      device.merchant?.name,
      device.deviceType,
      getHeartbeatDescription(device.lastSeenAt),
      formatDeviceTime(device.lastSeenAt),
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    return searchable.includes(normalizedSearch);
  });

  const getGroupLabel = (device: Device): string => {
    switch (groupBy) {
      case "merchant":
        return device.merchant?.name || "Tanpa Merchant";
      case "model":
        return device.model || "Tanpa Model";
      case "deviceType":
        return device.deviceType || "Unknown Type";
      case "heartbeat":
        return getHeartbeatLabel(device.lastSeenAt);
      default:
        return "";
    }
  };

  const orderedDevices = [...filteredDevices].sort((left, right) => {
    if (groupBy === "none") {
      return (left.deviceCode || "").localeCompare(right.deviceCode || "");
    }

    const groupCompare = getGroupLabel(left).localeCompare(getGroupLabel(right));
    if (groupCompare !== 0) return groupCompare;
    return (left.deviceCode || "").localeCompare(right.deviceCode || "");
  });

  const totalPages = Math.max(1, Math.ceil(orderedDevices.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const startIndex = (currentPage - 1) * PAGE_SIZE;
  const paginatedDevices = orderedDevices.slice(startIndex, startIndex + PAGE_SIZE);

  const handleExportExcel = async () => {
    try {
      setExportingExcel(true);
      const title = mode === "soundbox" ? "TMS Qualita Soundbox Report" : "TMS Qualita Device Report";
      const subtitle = mode === "soundbox"
        ? "Export daftar soundbox dan heartbeat terakhir"
        : "Export daftar device EDC dan heartbeat terakhir";
      const logoDataUrl = await loadPublicImageAsDataUrl("/qualita_indonesia_logo.png");
      const html = buildExportHtml(title, subtitle, getDeviceExportRows(orderedDevices), logoDataUrl);
      const blob = new Blob([html], {
        type: "application/vnd.ms-excel;charset=utf-8;",
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `tms-qualita-${mode}-report-${sanitizeFileDate()}.xls`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error exporting Excel:", error);
      alert("Gagal export Excel");
    } finally {
      setExportingExcel(false);
    }
  };

  const handleExportPdf = async () => {
    try {
      setExportingPdf(true);
      const logoDataUrl = await loadPublicImageAsDataUrl("/qualita_indonesia_logo.png");
      await exportDevicesToPdf(mode, orderedDevices, logoDataUrl);
    } catch (error) {
      console.error("Error exporting PDF:", error);
      alert("Gagal export PDF");
    } finally {
      setExportingPdf(false);
    }
  };

  return (
    <>
      <div className="mb-4 flex justify-between items-center">
        <div>
          <p className="text-sm text-gray-500">
            {orderedDevices.length} {mode === "soundbox" ? "soundbox" : "device"}
            {orderedDevices.length !== 1 ? "s" : ""} total
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={handleExportExcel}
            disabled={loading || devices.length === 0 || exportingExcel}
            className="border-green-200 text-green-700 hover:bg-green-50"
          >
            <Icon icon="mdi:microsoft-excel" className="mr-1 h-4 w-4" />
            {exportingExcel ? "Exporting..." : "Export Excel"}
          </Button>
          <Button
            variant="outline"
            onClick={handleExportPdf}
            disabled={loading || devices.length === 0 || exportingPdf}
            className="border-red-200 text-red-700 hover:bg-red-50"
          >
            <Icon icon="mdi:file-pdf-box" className="mr-1 h-4 w-4" />
            {exportingPdf ? "Exporting..." : "Export PDF"}
          </Button>
          <Link href={`${basePath}/map`}>
            <Button variant="outline">
              <Icon icon="mdi:map-marker-multiple" className="mr-1 w-4 h-4" />{" "}
              Map View
            </Button>
          </Link>
          {!currentUser?.merchantId && (
            <Button onClick={handleAdd}>
              <Icon icon="mdi:plus" className="mr-1" />
              {mode === "soundbox" ? "Add Soundbox" : "Add Device"}
            </Button>
          )}
        </div>
      </div>

      <div className="mb-4 grid gap-3 md:grid-cols-3">
        <label className="flex flex-col gap-1">
          <span className="text-xs font-medium uppercase tracking-wide text-gray-500">
            Search
          </span>
          <div className="relative">
            <Icon icon="mdi:magnify" className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Cari device, serial, model, merchant..."
              className="w-full rounded-md border border-gray-200 bg-white py-2 pl-9 pr-3 text-sm text-gray-900 outline-none transition focus:border-sky-400"
            />
          </div>
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-xs font-medium uppercase tracking-wide text-gray-500">
            Filter Heartbeat
          </span>
          <select
            value={heartbeatFilter}
            onChange={(event) => setHeartbeatFilter(event.target.value as HeartbeatFilterOption)}
            className="rounded-md border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 outline-none transition focus:border-sky-400"
          >
            <option value="all">Semua</option>
            <option value="live">LIVE</option>
            <option value="stale">STALE</option>
            <option value="offline">OFFLINE</option>
            <option value="no-data">NO DATA</option>
          </select>
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-xs font-medium uppercase tracking-wide text-gray-500">
            Group By
          </span>
          <select
            value={groupBy}
            onChange={(event) => setGroupBy(event.target.value as GroupByOption)}
            className="rounded-md border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 outline-none transition focus:border-sky-400"
          >
            <option value="none">Tanpa Grouping</option>
            <option value="merchant">Merchant</option>
            <option value="model">Model</option>
            <option value="deviceType">Type</option>
            <option value="heartbeat">Heartbeat</option>
          </select>
        </label>
      </div>

      {loading ? (
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          Loading devices...
        </div>
      ) : (
        <div className="rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden bg-white dark:bg-slate-900">
          <table className="w-full text-sm">
            <thead className="bg-gradient-to-r from-indigo-50 to-blue-50 dark:from-slate-800 dark:to-slate-800 border-b border-gray-200 dark:border-gray-700">
              <tr>
                <th className="p-3 text-left text-gray-900 dark:text-white font-bold">
                  Device Code
                </th>
                <th className="p-3 text-left text-gray-900 dark:text-white font-bold">
                  Serial Number
                </th>
                <th className="p-3 text-left text-gray-900 dark:text-white font-bold">
                  Model
                </th>
                <th className="p-3 text-left text-gray-900 dark:text-white font-bold">
                  Merchant
                </th>
                <th className="p-3 text-left text-gray-900 dark:text-white font-bold">
                  Heartbeat
                </th>
                <th className="p-3 text-left text-gray-900 dark:text-white font-bold">
                  Keterangan
                </th>
                <th className="p-3 text-right text-gray-900 dark:text-white font-bold">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {orderedDevices.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="p-8 text-center text-gray-500 dark:text-gray-400"
                  >
                    Tidak ada data yang cocok dengan filter atau pencarian.
                  </td>
                </tr>
              ) : (
                paginatedDevices.map((device, index) => {
                  const currentGroup = groupBy === "none" ? "" : getGroupLabel(device);
                  const previousDevice = paginatedDevices[index - 1];
                  const previousGroup =
                    groupBy === "none" || !previousDevice ? "" : getGroupLabel(previousDevice);
                  const showGroupHeader = groupBy !== "none" && currentGroup !== previousGroup;

                  return (
                    <Fragment key={`row-${device.id}-${index}`}>
                      {showGroupHeader && (
                        <tr className="border-b border-gray-200 bg-sky-50/70">
                          <td colSpan={7} className="px-3 py-2 text-sm font-semibold text-sky-800">
                            {currentGroup}
                          </td>
                        </tr>
                      )}
                      <tr
                        className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors"
                      >
                        <td className="p-3 font-medium text-gray-900 dark:text-gray-100">
                          <div className="flex flex-col gap-1">
                            <span>{device.deviceCode}</span>
                            {getDeviceTypeBadge(device.deviceType)}
                          </div>
                        </td>
                        <td className="p-3 text-gray-900 dark:text-gray-100">
                          {device.serialNumber}
                        </td>
                        <td className="p-3 text-gray-900 dark:text-gray-100">
                          {device.model}
                        </td>
                        <td className="p-3 text-gray-900 dark:text-gray-100">
                          {device.merchant?.name || "-"}
                        </td>
                        <td className="p-3 text-gray-900 dark:text-gray-100">
                          <div className="flex flex-col gap-1">
                            <div>{getFreshnessBadge(device.lastSeenAt)}</div>
                            <span className="text-sm">
                              {formatDeviceTime(device.lastSeenAt)}
                            </span>
                          </div>
                        </td>
                        <td className="p-3 text-gray-900 dark:text-gray-100">
                          <span className="text-sm">
                            {getHeartbeatDescription(device.lastSeenAt)}
                          </span>
                        </td>
                        <td className="p-3 text-right space-x-2">
                          {!currentUser?.merchantId && (
                            <>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => openDetail(device)}
                                disabled={detailLoadingId === device.id}
                              >
                                <Icon icon="mdi:eye" className="w-4 h-4" />
                              </Button>

                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleEdit(device)}
                                className="dark:text-white dark:border-gray-600 dark:hover:bg-slate-700"
                              >
                                <Icon icon="mdi:pencil" className="w-4 h-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => handleDelete(device.id)}
                                className="dark:hover:bg-red-900"
                              >
                                <Icon icon="mdi:delete" className="w-4 h-4" />
                              </Button>
                            </>
                          )}
                        </td>
                      </tr>
                    </Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      )}

      {!loading && devices.length > 0 && (
        <div className="mt-4 flex items-center justify-between gap-4">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Menampilkan {orderedDevices.length === 0 ? 0 : startIndex + 1}-{Math.min(startIndex + PAGE_SIZE, orderedDevices.length)} dari {orderedDevices.length} data
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((prev) => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
            >
              <Icon icon="mdi:chevron-left" className="mr-1 h-4 w-4" />
              Prev
            </Button>
            <span className="rounded-md border border-sky-100 bg-sky-50 px-3 py-1 text-sm font-medium text-sky-700">
              {currentPage} / {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
            >
              Next
              <Icon icon="mdi:chevron-right" className="ml-1 h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      <DeviceDetailDialog
        open={detailOpen}
        device={detailDevice}
        onClose={() => {
          setDetailOpen(false);
          setDetailDevice(null);
        }}
      />

      <DeviceDialog
        open={open}
        device={editDevice}
        mode={mode}
        onClose={() => {
          setOpen(false);
          setEditDevice(null);
        }}
        onSuccess={() => {
          setOpen(false);
          setEditDevice(null);
          loadDevices();
        }}
      />
    </>
  );
}
