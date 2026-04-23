"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

type Config = {
  enabled: boolean;
  host: string;
  port: number;
  protocol: "tcp" | "ssl";
  username: string | null;
  password: string | null;
  topicPattern: string;
  clientIdPrefix: string;
  keepalive: number;
};

type Status = {
  connected: boolean;
  subscribedTopic: string;
  host: string;
  lastMessageAt: string | null;
};

type CommandLog = {
  id: string;
  sn: string;
  command: string;
  status: "PENDING" | "ACKED" | "TIMEOUT" | "FAILED";
  sentAt: string;
  timeoutAt: string;
  ackedAt: string | null;
  message: string | null;
};

type AclTemplate = {
  sn: string;
  username: string;
  publishTopics: string[];
  subscribeTopics: string[];
  note: string;
};

type OtaApkOption = {
  id: string;
  appName: string;
  version: string;
  packageName?: string | null;
  downloadUrl?: string | null;
  isActive?: boolean;
};

export default function MqttConfigPanel() {
  const [config, setConfig] = useState<Config | null>(null);
  const [status, setStatus] = useState<Status | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [passwordInput, setPasswordInput] = useState("");
  const [targetSn, setTargetSn] = useState("");
  const [sendingCmd, setSendingCmd] = useState(false);
  const [otaApkOptions, setOtaApkOptions] = useState<OtaApkOption[]>([]);
  const [selectedOtaApkId, setSelectedOtaApkId] = useState("");
  const [loadingOtaApkOptions, setLoadingOtaApkOptions] = useState(false);
  const [otaAppName, setOtaAppName] = useState("Qualita Agent");
  const [otaVersion, setOtaVersion] = useState("");
  const [otaPackageName, setOtaPackageName] = useState("");
  const [otaDownloadUrl, setOtaDownloadUrl] = useState("");
  const [logs, setLogs] = useState<CommandLog[]>([]);
  const [logsLoading, setLogsLoading] = useState(false);
  const [aclTemplate, setAclTemplate] = useState<AclTemplate | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/mqtt-config");
      const data = await res.json();
      if (!res.ok)
        throw new Error(data?.message || "Failed to load MQTT config");
      setConfig(data.config);
      setStatus(data.status);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const loadOtaApkOptions = async () => {
    setLoadingOtaApkOptions(true);
    try {
      const res = await fetch("/api/apk");
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Failed to load APK list");

      const list = Array.isArray(data?.data) ? data.data : [];
      const mapped = list
        .map((item: any) => ({
          id: String(item?.id || ""),
          appName: String(item?.appName || ""),
          version: String(item?.version || ""),
          packageName:
            typeof item?.packageName === "string" ? item.packageName : null,
          downloadUrl:
            typeof item?.downloadUrl === "string" ? item.downloadUrl : null,
          isActive: !!item?.isActive,
        }))
        .filter((item: OtaApkOption) => item.id && item.appName && item.version)
        .sort((a: OtaApkOption, b: OtaApkOption) => {
          if (a.isActive && !b.isActive) return -1;
          if (!a.isActive && b.isActive) return 1;
          return b.version.localeCompare(a.version, undefined, {
            numeric: true,
            sensitivity: "base",
          });
        });

      setOtaApkOptions(mapped);
    } catch (error) {
      console.error(error);
    } finally {
      setLoadingOtaApkOptions(false);
    }
  };

  useEffect(() => {
    loadOtaApkOptions();
  }, []);

  const loadLogs = async () => {
    setLogsLoading(true);
    try {
      const q = targetSn.trim()
        ? `?sn=${encodeURIComponent(targetSn.trim())}&limit=100`
        : "?limit=100";
      const res = await fetch(`/api/mqtt-command/logs${q}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || "Failed to load logs");
      setLogs(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error(error);
    } finally {
      setLogsLoading(false);
    }
  };

  const loadAclTemplate = async () => {
    if (!targetSn.trim()) {
      alert("Isi SN dulu untuk generate ACL template");
      return;
    }
    try {
      const res = await fetch(
        `/api/mqtt-config/acl-template?sn=${encodeURIComponent(targetSn.trim())}`,
      );
      const data = await res.json();
      if (!res.ok)
        throw new Error(data?.message || "Failed to generate ACL template");
      setAclTemplate(data);
    } catch (error: any) {
      alert(error?.message || "Failed to generate ACL template");
    }
  };

  useEffect(() => {
    loadLogs();
    const timer = setInterval(() => {
      loadLogs();
    }, 7000);
    return () => clearInterval(timer);
  }, [targetSn]);

  const save = async () => {
    if (!config) return;
    setSaving(true);

    try {
      const payload: Record<string, unknown> = {
        ...config,
      };
      if (passwordInput.trim()) payload.password = passwordInput.trim();

      const res = await fetch("/api/mqtt-config", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok)
        throw new Error(data?.message || "Failed to save MQTT config");

      setConfig(data.config);
      setStatus(data.status);
      setPasswordInput("");
      alert("MQTT config updated");
    } catch (error: any) {
      alert(error?.message || "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const reloadNow = async () => {
    try {
      const res = await fetch("/api/mqtt-config/reload", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || "Failed to reload");
      setStatus(data.status);
      alert("MQTT reloaded");
    } catch (error: any) {
      alert(error?.message || "Failed to reload");
    }
  };

  const sendCommand = async (
    command: string,
    payload?: Record<string, unknown>,
  ) => {
    if (!targetSn.trim()) {
      alert("SN wajib diisi untuk kirim command");
      return;
    }
    setSendingCmd(true);
    try {
      const res = await fetch("/api/mqtt-command/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sn: targetSn.trim(),
          command,
          payload: payload || {},
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || "Failed to send command");
      alert(`Command ${command} sent`);
      loadLogs();
    } catch (error: any) {
      alert(error?.message || "Failed to send command");
    } finally {
      setSendingCmd(false);
    }
  };

  const applyOtaApkSelection = (apkId: string) => {
    setSelectedOtaApkId(apkId);
    const selected = otaApkOptions.find((item) => item.id === apkId);
    if (!selected) return;

    setOtaAppName(selected.appName || "Qualita Agent");
    setOtaVersion(selected.version || "");
    setOtaPackageName(selected.packageName || "");
    setOtaDownloadUrl(selected.downloadUrl || "");
  };

  if (loading || !config) {
    return (
      <div className="rounded-lg border bg-white p-4 text-sm text-gray-500">
        Loading MQTT config...
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="rounded-lg border bg-white p-4">
        <h2 className="text-base font-semibold text-gray-900">
          MQTT Dynamic Config
        </h2>
        <p className="mt-1 text-xs text-gray-500">
          Satu topic JSON unified per SN. Payload diproses backend dan masuk
          dashboard by serial number.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <label className="rounded-lg border bg-white p-3 text-sm">
          <span className="mb-1 block text-xs text-gray-500">Enabled</span>
          <input
            type="checkbox"
            checked={config.enabled}
            onChange={(e) =>
              setConfig({ ...config, enabled: e.target.checked })
            }
          />
        </label>

        <label className="rounded-lg border bg-white p-3 text-sm">
          <span className="mb-1 block text-xs text-gray-500">Protocol</span>
          <select
            className="w-full rounded border px-2 py-1"
            value={config.protocol}
            onChange={(e) =>
              setConfig({
                ...config,
                protocol: e.target.value as "tcp" | "ssl",
              })
            }
          >
            <option value="tcp">tcp</option>
            <option value="ssl">ssl</option>
          </select>
        </label>

        <label className="rounded-lg border bg-white p-3 text-sm">
          <span className="mb-1 block text-xs text-gray-500">Host</span>
          <input
            className="w-full rounded border px-2 py-1"
            value={config.host}
            onChange={(e) => setConfig({ ...config, host: e.target.value })}
          />
        </label>

        <label className="rounded-lg border bg-white p-3 text-sm">
          <span className="mb-1 block text-xs text-gray-500">Port</span>
          <input
            className="w-full rounded border px-2 py-1"
            type="number"
            value={config.port}
            onChange={(e) =>
              setConfig({ ...config, port: Number(e.target.value) })
            }
          />
        </label>

        <label className="rounded-lg border bg-white p-3 text-sm md:col-span-2">
          <span className="mb-1 block text-xs text-gray-500">
            Topic Pattern
          </span>
          <input
            className="w-full rounded border px-2 py-1"
            value={config.topicPattern}
            onChange={(e) =>
              setConfig({ ...config, topicPattern: e.target.value })
            }
          />
        </label>

        <label className="rounded-lg border bg-white p-3 text-sm">
          <span className="mb-1 block text-xs text-gray-500">
            Client ID Prefix
          </span>
          <input
            className="w-full rounded border px-2 py-1"
            value={config.clientIdPrefix}
            onChange={(e) =>
              setConfig({ ...config, clientIdPrefix: e.target.value })
            }
          />
        </label>

        <label className="rounded-lg border bg-white p-3 text-sm">
          <span className="mb-1 block text-xs text-gray-500">
            Keepalive (sec)
          </span>
          <input
            className="w-full rounded border px-2 py-1"
            type="number"
            value={config.keepalive}
            onChange={(e) =>
              setConfig({ ...config, keepalive: Number(e.target.value) })
            }
          />
        </label>

        <label className="rounded-lg border bg-white p-3 text-sm">
          <span className="mb-1 block text-xs text-gray-500">Username</span>
          <input
            className="w-full rounded border px-2 py-1"
            value={config.username || ""}
            onChange={(e) =>
              setConfig({ ...config, username: e.target.value || null })
            }
          />
        </label>

        <label className="rounded-lg border bg-white p-3 text-sm">
          <span className="mb-1 block text-xs text-gray-500">
            Password (optional update)
          </span>
          <input
            className="w-full rounded border px-2 py-1"
            type="password"
            value={passwordInput}
            onChange={(e) => setPasswordInput(e.target.value)}
            placeholder="Kosongkan jika tidak diubah"
          />
        </label>
      </div>

      <div className="rounded-lg border bg-white p-4 text-sm">
        <p>
          Connected: <b>{status?.connected ? "YES" : "NO"}</b>
        </p>
        <p>
          Current Host: <b>{status?.host || "-"}</b>
        </p>
        <p>
          Subscribed Topic: <b>{status?.subscribedTopic || "-"}</b>
        </p>
        <p>
          Last Message At: <b>{status?.lastMessageAt || "-"}</b>
        </p>
      </div>

      <div className="rounded-lg border bg-white p-4">
        <h3 className="text-sm font-semibold text-gray-900">
          Remote Command (Dashboard -&gt; App)
        </h3>
        <p className="mt-1 text-xs text-gray-500">
          Command publish ke topic qualita/edc/{"{"}sn{"}"}/down/command.
        </p>

        <div className="mt-3 grid gap-3 md:grid-cols-2">
          <label className="text-sm">
            <span className="mb-1 block text-xs text-gray-500">Target SN</span>
            <input
              className="w-full rounded border px-2 py-1"
              placeholder="contoh: A560900Q0150006"
              value={targetSn}
              onChange={(e) => setTargetSn(e.target.value)}
            />
          </label>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <button
            className="rounded-xl border border-emerald-300 bg-emerald-50 px-4 py-3 text-left transition hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-60"
            onClick={() => sendCommand("PING")}
            disabled={sendingCmd}
          >
            <div className="text-sm font-semibold text-emerald-900">PING</div>
            <div className="mt-1 text-xs text-emerald-800">
              Cek koneksi online device secara cepat.
            </div>
          </button>

          <button
            className="rounded-xl border border-blue-300 bg-blue-50 px-4 py-3 text-left transition hover:bg-blue-100 disabled:cursor-not-allowed disabled:opacity-60"
            onClick={() => sendCommand("FORCE_REPORT")}
            disabled={sendingCmd}
          >
            <div className="text-sm font-semibold text-blue-900">
              FORCE_REPORT
            </div>
            <div className="mt-1 text-xs text-blue-800">
              Paksa device kirim telemetry sekarang.
            </div>
          </button>

          <button
            className="rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-left transition hover:bg-amber-100 disabled:cursor-not-allowed disabled:opacity-60"
            onClick={() =>
              sendCommand("UPDATE_MQTT_HOST", { host: config.host })
            }
            disabled={sendingCmd}
          >
            <div className="text-sm font-semibold text-amber-900">
              UPDATE_MQTT_HOST
            </div>
            <div className="mt-1 text-xs text-amber-800">
              Push host MQTT saat ini ke aplikasi agent.
            </div>
          </button>

          <button
            className="rounded-xl border border-rose-300 bg-rose-50 px-4 py-3 text-left transition hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-60"
            onClick={() => sendCommand("RESTART_AGENT")}
            disabled={sendingCmd}
          >
            <div className="text-sm font-semibold text-rose-900">
              RESTART_AGENT
            </div>
            <div className="mt-1 text-xs text-rose-800">
              Restart service agent di device target.
            </div>
          </button>

          <button
            className="rounded-xl border border-violet-300 bg-violet-50 px-4 py-3 text-left transition hover:bg-violet-100 disabled:cursor-not-allowed disabled:opacity-60"
            onClick={() =>
              sendCommand("APK_UPDATE_AVAILABLE", {
                appName: otaAppName.trim() || "Qualita Agent",
                version: otaVersion.trim() || "latest",
                packageName: otaPackageName.trim() || undefined,
                downloadUrl: otaDownloadUrl.trim() || undefined,
              })
            }
            disabled={sendingCmd}
          >
            <div className="text-sm font-semibold text-violet-900">
              APK_UPDATE_AVAILABLE
            </div>
            <div className="mt-1 text-xs text-violet-800">
              Push notifikasi OTA update APK ke device.
            </div>
          </button>
        </div>

        <div className="mt-3 grid gap-3 rounded-xl border border-violet-200 bg-violet-50/40 p-3 md:grid-cols-2">
          <label className="text-sm md:col-span-2">
            <span className="mb-1 block text-xs text-violet-700">
              Pilih APK dari server (autofill)
            </span>
            <div className="flex gap-2">
              <select
                className="w-full rounded border border-violet-200 bg-white px-2 py-2"
                value={selectedOtaApkId}
                onChange={(e) => applyOtaApkSelection(e.target.value)}
                disabled={loadingOtaApkOptions}
              >
                <option value="">
                  {loadingOtaApkOptions
                    ? "Memuat APK..."
                    : "Pilih APK aktif/tersedia"}
                </option>
                {otaApkOptions.map((apk) => (
                  <option key={apk.id} value={apk.id}>
                    {apk.appName} v{apk.version}
                    {apk.isActive ? " (Active)" : ""}
                  </option>
                ))}
              </select>
              <Button
                type="button"
                variant="outline"
                onClick={loadOtaApkOptions}
                disabled={loadingOtaApkOptions}
                className="shrink-0"
              >
                Refresh APK
              </Button>
            </div>
          </label>

          <label className="text-sm">
            <span className="mb-1 block text-xs text-violet-700">
              OTA App Name
            </span>
            <input
              className="w-full rounded border border-violet-200 bg-white px-2 py-1"
              placeholder="Qualita Agent"
              value={otaAppName}
              onChange={(e) => setOtaAppName(e.target.value)}
            />
          </label>

          <label className="text-sm">
            <span className="mb-1 block text-xs text-violet-700">
              OTA Version
            </span>
            <input
              className="w-full rounded border border-violet-200 bg-white px-2 py-1"
              placeholder="contoh: 1.2.0"
              value={otaVersion}
              onChange={(e) => setOtaVersion(e.target.value)}
            />
          </label>

          <label className="text-sm">
            <span className="mb-1 block text-xs text-violet-700">
              Package Name (optional)
            </span>
            <input
              className="w-full rounded border border-violet-200 bg-white px-2 py-1"
              placeholder="com.qualitaindonesia.qualitatms"
              value={otaPackageName}
              onChange={(e) => setOtaPackageName(e.target.value)}
            />
          </label>

          <label className="text-sm">
            <span className="mb-1 block text-xs text-violet-700">
              Download URL (optional)
            </span>
            <input
              className="w-full rounded border border-violet-200 bg-white px-2 py-1"
              placeholder="https://.../apk/id/download?sn=..."
              value={otaDownloadUrl}
              onChange={(e) => setOtaDownloadUrl(e.target.value)}
            />
          </label>
        </div>

        <p className="mt-3 text-xs text-gray-500">
          {sendingCmd
            ? "Mengirim command ke device..."
            : "Klik salah satu tombol command di atas untuk eksekusi cepat."}
        </p>
      </div>

      <div className="rounded-lg border bg-white p-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-900">
            ACK Tracking & Command Logs
          </h3>
          <button
            className="rounded border px-2 py-1 text-xs"
            onClick={loadLogs}
          >
            Refresh Logs
          </button>
        </div>
        <p className="mt-1 text-xs text-gray-500">
          Status PENDING akan otomatis berubah TIMEOUT jika melewati batas waktu
          ACK.
        </p>

        <div className="mt-3 overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="bg-gray-50 text-left text-[11px] uppercase text-gray-500">
              <tr>
                <th className="px-2 py-2">Sent At</th>
                <th className="px-2 py-2">SN</th>
                <th className="px-2 py-2">Command</th>
                <th className="px-2 py-2">Status</th>
                <th className="px-2 py-2">Ack At</th>
                <th className="px-2 py-2">Message</th>
              </tr>
            </thead>
            <tbody>
              {logsLoading ? (
                <tr>
                  <td className="px-2 py-3 text-gray-500" colSpan={6}>
                    Loading logs...
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td className="px-2 py-3 text-gray-500" colSpan={6}>
                    No command logs
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="border-t">
                    <td className="px-2 py-2">
                      {new Date(log.sentAt).toLocaleString("id-ID")}
                    </td>
                    <td className="px-2 py-2">{log.sn}</td>
                    <td className="px-2 py-2">{log.command}</td>
                    <td className="px-2 py-2 font-semibold">{log.status}</td>
                    <td className="px-2 py-2">
                      {log.ackedAt
                        ? new Date(log.ackedAt).toLocaleString("id-ID")
                        : "-"}
                    </td>
                    <td className="px-2 py-2">{log.message || "-"}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="rounded-lg border bg-white p-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-900">
            ACL Hardening Template (Per Device)
          </h3>
          <button
            className="rounded border px-2 py-1 text-xs"
            onClick={loadAclTemplate}
          >
            Generate
          </button>
        </div>
        <p className="mt-1 text-xs text-gray-500">
          Gunakan template ini di broker ACL agar credential device SN hanya
          bisa akses topic miliknya.
        </p>

        {aclTemplate && (
          <div className="mt-3 rounded border bg-gray-50 p-3 text-xs">
            <p>
              <b>SN:</b> {aclTemplate.sn}
            </p>
            <p>
              <b>Username:</b> {aclTemplate.username}
            </p>
            <p className="mt-2 font-semibold">Publish Topics:</p>
            {aclTemplate.publishTopics.map((t) => (
              <p key={t} className="font-mono">
                {t}
              </p>
            ))}
            <p className="mt-2 font-semibold">Subscribe Topics:</p>
            {aclTemplate.subscribeTopics.map((t) => (
              <p key={t} className="font-mono">
                {t}
              </p>
            ))}
            <p className="mt-2 text-gray-600">{aclTemplate.note}</p>
          </div>
        )}
      </div>

      <div className="flex gap-2">
        <button
          className="rounded bg-indigo-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
          onClick={save}
          disabled={saving}
        >
          {saving ? "Saving..." : "Save Config"}
        </button>
        <button
          className="rounded border px-4 py-2 text-sm font-semibold"
          onClick={reloadNow}
        >
          Reload MQTT
        </button>
        <button className="rounded border px-4 py-2 text-sm" onClick={load}>
          Refresh
        </button>
      </div>
    </div>
  );
}
