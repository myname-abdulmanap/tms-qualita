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

function getHeartbeatRangeFilterKey(
  value?: string | null,
): "0-1" | "2-7" | "8-14" | "15-30" | ">30" | "no-data" {
  if (!value) return "no-data";

  const ts = new Date(value).getTime();
  if (Number.isNaN(ts)) return "no-data";

  const dayMs = 24 * 60 * 60 * 1000;
  const ageDays = Math.floor(Math.max(0, Date.now() - ts) / dayMs);

  if (ageDays <= 1) return "0-1";
  if (ageDays <= 7) return "2-7";
  if (ageDays <= 14) return "8-14";
  if (ageDays <= 30) return "15-30";
  return ">30";
}

function getHeartbeatSummaryLabel(value?: string | null): string {
  const rangeKey = getHeartbeatRangeFilterKey(value);

  switch (rangeKey) {
    case "2-7":
      return "Last Heartbeat 2-7 hari";
    case "8-14":
      return "Last Heartbeat 8-14 hari";
    case "15-30":
      return "Last Heartbeat 15-30 hari";
    case ">30":
      return "Last Heartbeat > 30 Hari";
    case "0-1": {
      const date = value ? new Date(value) : null;
      const dateLabel = date && !Number.isNaN(date.getTime())
        ? date.toLocaleDateString("id-ID", {
          day: "numeric",
          month: "long",
          year: "numeric",
        })
        : "tidak valid";
      return `Heartbeat ${dateLabel}`;
    }
    default:
      return "Belum ada heartbeat";
  }
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

type HeartbeatSummaryRow = {
  label: string;
  total: number;
};

function getHeartbeatSummaryRows(devices: Device[]): HeartbeatSummaryRow[] {
  const summaryMap = new Map<string, number>();

  for (const device of devices) {
    const label = getHeartbeatSummaryLabel(device.lastSeenAt);
    summaryMap.set(label, (summaryMap.get(label) ?? 0) + 1);
  }

  const priority = (label: string) => {
    if (label === "Last Heartbeat 2-7 hari") return 1;
    if (label === "Last Heartbeat 8-14 hari") return 2;
    if (label === "Last Heartbeat 15-30 hari") return 3;
    if (label === "Last Heartbeat > 30 Hari") return 4;
    if (label.startsWith("Heartbeat ")) return 5;
    if (label === "Belum ada heartbeat") return 6;
    return 7;
  };

  return Array.from(summaryMap.entries())
    .map(([label, total]) => ({ label, total }))
    .sort((a, b) => {
      const pa = priority(a.label);
      const pb = priority(b.label);
      if (pa !== pb) return pa - pb;
      return a.label.localeCompare(b.label);
    });
}

function getHeartbeatFilterDisplayLabel(filter: string): string {
  switch (filter) {
    case "0-1":
      return "Heartbeat 0-1 hari";
    case "2-7":
      return "Last Heartbeat 2-7 hari";
    case "8-14":
      return "Last Heartbeat 8-14 hari";
    case "15-30":
      return "Last Heartbeat 15-30 hari";
    case ">30":
      return "Last Heartbeat > 30 Hari";
    case "no-data":
      return "No Data";
    default:
      return "Semua";
  }
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

function buildSummaryExportHtml(
  title: string,
  subtitle: string,
  rows: HeartbeatSummaryRow[],
  grandTotal: number,
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
          <td>${escapeHtml(row.label)}</td>
          <td style="text-align:right;">${row.total}</td>
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
        .grand-row td {
          background: #e2e8f0;
          font-weight: 700;
        }
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
              <th>Summary</th>
              <th style="text-align:right;">Jumlah</th>
            </tr>
          </thead>
          <tbody>
            ${tableRows}
            <tr class="grand-row">
              <td>Grand Total</td>
              <td style="text-align:right;">${grandTotal}</td>
            </tr>
          </tbody>
        </table>
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

async function exportSummaryToPdf(
  mode: "edc" | "soundbox",
  rows: HeartbeatSummaryRow[],
  grandTotal: number,
  filterLabel: string,
  logoDataUrl?: string | null,
) {
  const jspdfModule = await import("jspdf");
  const JsPdfCtor = (jspdfModule as { jsPDF: new (options?: unknown) => any }).jsPDF;
  const doc = new JsPdfCtor({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const marginX = 14;
  const headerTop = 10;
  const tableStartY = 48;
  const rowHeight = 10;
  const colWidths = [130, 42];
  const title = mode === "soundbox"
    ? "TMS Qualita Summary Heartbeat Soundbox"
    : "TMS Qualita Summary Heartbeat Device";
  const subtitle = `Ringkasan heartbeat (filter: ${filterLabel})`;
  const generatedAt = formatExportTimestamp();

  const drawHeader = () => {
    doc.setDrawColor(29, 78, 216);
    doc.setLineWidth(0.8);
    doc.line(marginX, headerTop + 22, pageWidth - marginX, headerTop + 22);

    if (logoDataUrl) {
      doc.addImage(logoDataUrl, "PNG", marginX, headerTop, 14, 14);
    }

    doc.setTextColor(17, 24, 39);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(15);
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
    doc.setFontSize(9);

    ["Summary", "Jumlah"].forEach((column, index) => {
      const width = colWidths[index];
      doc.setFillColor(249, 250, 251);
      doc.rect(x, y, width, rowHeight, "FD");
      doc.text(column, index === 1 ? x + width - 4 : x + 2, y + 6.2, {
        align: index === 1 ? "right" : "left",
      });
      x += width;
    });
  };

  const drawRow = (label: string, total: number, y: number, even: boolean, bold = false) => {
    let x = marginX;
    doc.setDrawColor(229, 231, 235);
    doc.setFont("helvetica", bold ? "bold" : "normal");
    doc.setTextColor(15, 23, 42);
    doc.setFontSize(9);

    const values = [label, String(total)];
    values.forEach((value, index) => {
      const width = colWidths[index];
      if (bold) {
        doc.setFillColor(226, 232, 240);
        doc.rect(x, y, width, rowHeight, "FD");
      } else if (even) {
        doc.setFillColor(250, 250, 250);
        doc.rect(x, y, width, rowHeight, "FD");
      } else {
        doc.rect(x, y, width, rowHeight, "S");
      }

      doc.text(value, index === 1 ? x + width - 4 : x + 2, y + 6.2, {
        align: index === 1 ? "right" : "left",
      });
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

    drawRow(row.label, row.total, y, index % 2 === 1);
    y += rowHeight;
  });

  if (y + rowHeight > pageHeight - 14) {
    doc.addPage();
    drawHeader();
    y = tableStartY;
    drawTableHeader(y);
    y += rowHeight;
  }

  drawRow("Grand Total", grandTotal, y, false, true);
  doc.save(`tms-qualita-${mode}-summary-${sanitizeFileDate()}.pdf`);
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
  type HeartbeatFilterOption = "all" | "0-1" | "2-7" | "8-14" | "15-30" | ">30" | "no-data";
  type ViewTabOption = "table" | "summary";
  type ExportTargetOption = "device" | "summary";
  type ExportFormatOption = "excel" | "pdf";

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
  const [exportOpen, setExportOpen] = useState(false);
  const [exportTarget, setExportTarget] = useState<ExportTargetOption>("device");
  const [exportFormat, setExportFormat] = useState<ExportFormatOption>("excel");
  const [exportHeartbeatFilter, setExportHeartbeatFilter] = useState<HeartbeatFilterOption>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [groupBy, setGroupBy] = useState<GroupByOption>("none");
  const [heartbeatFilter, setHeartbeatFilter] = useState<HeartbeatFilterOption>("all");
  const [viewTab, setViewTab] = useState<ViewTabOption>("table");
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
  const searchFilteredDevices = devices.filter((device) => {
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

  const filteredDevices = searchFilteredDevices.filter((device) => {
    if (heartbeatFilter === "all") return true;
    return getHeartbeatRangeFilterKey(device.lastSeenAt) === heartbeatFilter;
  });

  const heartbeatSummaryRows = getHeartbeatSummaryRows(searchFilteredDevices);

  const exportScopedDevices = exportHeartbeatFilter === "all"
    ? searchFilteredDevices
    : searchFilteredDevices.filter(
      (device) => getHeartbeatRangeFilterKey(device.lastSeenAt) === exportHeartbeatFilter,
    );

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

  const downloadExcelFile = (html: string, filename: string) => {
    const blob = new Blob([html], {
      type: "application/vnd.ms-excel;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleOpenExportModal = () => {
    setExportHeartbeatFilter(heartbeatFilter);
    setExportOpen(true);
  };

  const handleRunExport = async () => {
    try {
      if (exportFormat === "excel") {
        setExportingExcel(true);
      } else {
        setExportingPdf(true);
      }

      const filterLabel = getHeartbeatFilterDisplayLabel(exportHeartbeatFilter);
      const logoDataUrl = await loadPublicImageAsDataUrl("/qualita_indonesia_logo.png");

      if (exportTarget === "device") {
        const title = mode === "soundbox" ? "TMS Qualita Soundbox Report" : "TMS Qualita Device Report";
        const subtitle = mode === "soundbox"
          ? `Export daftar soundbox dan heartbeat terakhir (filter: ${filterLabel})`
          : `Export daftar device EDC dan heartbeat terakhir (filter: ${filterLabel})`;

        if (exportFormat === "excel") {
          const html = buildExportHtml(
            title,
            subtitle,
            getDeviceExportRows(exportScopedDevices),
            logoDataUrl,
          );
          downloadExcelFile(html, `tms-qualita-${mode}-report-${sanitizeFileDate()}.xls`);
        } else {
          await exportDevicesToPdf(mode, exportScopedDevices, logoDataUrl);
        }
      } else {
        const summaryRows = getHeartbeatSummaryRows(exportScopedDevices);
        const title = mode === "soundbox"
          ? "TMS Qualita Summary Heartbeat Soundbox"
          : "TMS Qualita Summary Heartbeat Device";
        const subtitle = `Ringkasan heartbeat (filter: ${filterLabel})`;

        if (exportFormat === "excel") {
          const html = buildSummaryExportHtml(
            title,
            subtitle,
            summaryRows,
            exportScopedDevices.length,
            logoDataUrl,
          );
          downloadExcelFile(html, `tms-qualita-${mode}-summary-${sanitizeFileDate()}.xls`);
        } else {
          await exportSummaryToPdf(
            mode,
            summaryRows,
            exportScopedDevices.length,
            filterLabel,
            logoDataUrl,
          );
        }
      }

      setExportOpen(false);
    } catch (error) {
      console.error("Error exporting:", error);
      alert("Gagal export data");
    } finally {
      setExportingPdf(false);
      setExportingExcel(false);
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
            onClick={handleOpenExportModal}
            disabled={loading || devices.length === 0 || exportingExcel || exportingPdf}
            className="border-sky-200 text-sky-700 hover:bg-sky-50"
          >
            <Icon icon="mdi:download-box" className="mr-1 h-4 w-4" />
            {exportingExcel || exportingPdf ? "Exporting..." : "Export"}
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

      <div className="mb-4 inline-flex rounded-md border border-gray-200 bg-white p-1">
        <button
          type="button"
          onClick={() => setViewTab("table")}
          className={`rounded px-3 py-1.5 text-sm font-medium transition ${
            viewTab === "table"
              ? "bg-sky-600 text-white"
              : "text-gray-600 hover:bg-gray-100"
          }`}
        >
          Tabel Device
        </button>
        <button
          type="button"
          onClick={() => setViewTab("summary")}
          className={`rounded px-3 py-1.5 text-sm font-medium transition ${
            viewTab === "summary"
              ? "bg-sky-600 text-white"
              : "text-gray-600 hover:bg-gray-100"
          }`}
        >
          Summary Heartbeat
        </button>
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
            <option value="0-1">Heartbeat 0-1 hari</option>
            <option value="2-7">Last Heartbeat 2-7 hari</option>
            <option value="8-14">Last Heartbeat 8-14 hari</option>
            <option value="15-30">Last Heartbeat 15-30 hari</option>
            <option value=">30">Last Heartbeat {">"} 30 Hari</option>
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
      ) : viewTab === "summary" ? (
        <div className="rounded-lg border border-gray-200 bg-white overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="p-3 text-left font-semibold text-gray-900">Summary</th>
                <th className="p-3 text-right font-semibold text-gray-900">Jumlah</th>
              </tr>
            </thead>
            <tbody>
              {heartbeatSummaryRows.length === 0 ? (
                <tr>
                  <td colSpan={2} className="p-6 text-center text-gray-500">
                    Tidak ada data untuk summary.
                  </td>
                </tr>
              ) : (
                <>
                  {heartbeatSummaryRows.map((row) => (
                    <tr key={row.label} className="border-b border-gray-100">
                      <td className="p-3 text-gray-900">{row.label}</td>
                      <td className="p-3 text-right font-medium text-gray-900">{row.total}</td>
                    </tr>
                  ))}
                  <tr className="bg-slate-100 font-bold">
                    <td className="p-3 text-gray-900">Grand Total</td>
                    <td className="p-3 text-right text-gray-900">{searchFilteredDevices.length}</td>
                  </tr>
                </>
              )}
            </tbody>
          </table>
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

      {!loading && viewTab === "table" && devices.length > 0 && (
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

      {exportOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-md rounded-xl bg-white p-5 shadow-xl">
            <div className="mb-4 flex items-start justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Export Data</h3>
                <p className="mt-1 text-sm text-gray-500">Pilih format, filter heartbeat, dan jenis export.</p>
              </div>
              <button
                type="button"
                onClick={() => setExportOpen(false)}
                aria-label="Tutup modal export"
                title="Tutup"
                className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
              >
                <Icon icon="mdi:close" className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-3">
              <label className="flex flex-col gap-1">
                <span className="text-xs font-medium uppercase tracking-wide text-gray-500">Export</span>
                <select
                  value={exportTarget}
                  onChange={(event) => setExportTarget(event.target.value as ExportTargetOption)}
                  className="rounded-md border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 outline-none transition focus:border-sky-400"
                >
                  <option value="device">Device</option>
                  <option value="summary">Summary Heartbeat</option>
                </select>
              </label>

              <label className="flex flex-col gap-1">
                <span className="text-xs font-medium uppercase tracking-wide text-gray-500">Format</span>
                <select
                  value={exportFormat}
                  onChange={(event) => setExportFormat(event.target.value as ExportFormatOption)}
                  className="rounded-md border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 outline-none transition focus:border-sky-400"
                >
                  <option value="excel">Excel</option>
                  <option value="pdf">PDF</option>
                </select>
              </label>

              <label className="flex flex-col gap-1">
                <span className="text-xs font-medium uppercase tracking-wide text-gray-500">Filter Heartbeat</span>
                <select
                  value={exportHeartbeatFilter}
                  onChange={(event) =>
                    setExportHeartbeatFilter(event.target.value as HeartbeatFilterOption)}
                  className="rounded-md border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 outline-none transition focus:border-sky-400"
                >
                  <option value="all">Semua</option>
                  <option value="0-1">Heartbeat 0-1 hari</option>
                  <option value="2-7">Last Heartbeat 2-7 hari</option>
                  <option value="8-14">Last Heartbeat 8-14 hari</option>
                  <option value="15-30">Last Heartbeat 15-30 hari</option>
                  <option value=">30">Last Heartbeat {">"} 30 Hari</option>
                  <option value="no-data">NO DATA</option>
                </select>
              </label>

              <p className="text-xs text-gray-500">
                Data siap di-export: <span className="font-semibold text-gray-700">{exportScopedDevices.length}</span>
              </p>
            </div>

            <div className="mt-5 flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setExportOpen(false)}
              >
                Batal
              </Button>
              <Button
                type="button"
                onClick={handleRunExport}
                disabled={exportingExcel || exportingPdf}
              >
                {exportingExcel || exportingPdf ? "Exporting..." : "Export Sekarang"}
              </Button>
            </div>
          </div>
        </div>
      )}

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
