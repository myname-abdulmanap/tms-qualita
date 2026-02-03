"use client";

import { useState, useEffect, useCallback } from "react";
import { Icon } from "@iconify/react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";

export type NotificationType =
  | "device_offline"
  | "low_battery"
  | "new_transaction"
  | "settlement_pending"
  | "device_online"
  | "system";

export type Notification = {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  data?: any;
  link?: string;
};

const NOTIFICATION_ICONS: Record<NotificationType, string> = {
  device_offline: "mdi:power-plug-off",
  device_online: "mdi:power-plug",
  low_battery: "mdi:battery-alert",
  new_transaction: "mdi:cash-check",
  settlement_pending: "mdi:bank-transfer",
  system: "mdi:information",
};

const NOTIFICATION_COLORS: Record<NotificationType, string> = {
  device_offline: "text-red-500 bg-red-100 dark:bg-red-900/30",
  device_online: "text-green-500 bg-green-100 dark:bg-green-900/30",
  low_battery: "text-orange-500 bg-orange-100 dark:bg-orange-900/30",
  new_transaction: "text-blue-500 bg-blue-100 dark:bg-blue-900/30",
  settlement_pending: "text-purple-500 bg-purple-100 dark:bg-purple-900/30",
  system: "text-gray-500 bg-gray-100 dark:bg-gray-800",
};

const ONLINE_THRESHOLD = 5 * 60 * 1000; // 5 minutes

export default function NotificationBell({
  sidebarOpen = true,
  isMobile = false,
  variant = "sidebar",
  darkMode = false,
}: {
  sidebarOpen?: boolean;
  isMobile?: boolean;
  variant?: "sidebar" | "header";
  darkMode?: boolean;
}) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const fetchNotifications = useCallback(async () => {
    try {
      setLoading(true);

      // Fetch devices for offline/low battery alerts
      const devicesRes = await fetch("/api/devices");
      if (devicesRes.ok) {
        const devices = await devicesRes.json();
        const newNotifications: Notification[] = [];

        devices.forEach((device: any) => {
          const lastSeen = device.lastSeenAt
            ? new Date(device.lastSeenAt)
            : null;
          const isOffline =
            !lastSeen || Date.now() - lastSeen.getTime() > ONLINE_THRESHOLD;

          // Device offline notification
          if (isOffline && device.status === "ACTIVE") {
            newNotifications.push({
              id: `offline_${device.id}`,
              type: "device_offline",
              title: "Device Offline",
              message: `${device.deviceCode} (${device.serialNumber}) tidak aktif`,
              timestamp: lastSeen || new Date(),
              read: false,
              data: device,
              link: "/devices",
            });
          }

          // Low battery notification
          if (
            device.batteryLevel !== null &&
            device.batteryLevel < 20 &&
            !isOffline
          ) {
            newNotifications.push({
              id: `battery_${device.id}`,
              type: "low_battery",
              title: "Low Battery",
              message: `${device.deviceCode} battery ${device.batteryLevel}%`,
              timestamp: new Date(device.lastSeenAt || Date.now()),
              read: false,
              data: device,
              link: "/devices",
            });
          }
        });

        setNotifications((prev) => {
          // Merge with existing, avoiding duplicates
          const existingIds = new Set(prev.map((n) => n.id));
          const merged = [
            ...newNotifications.filter((n) => !existingIds.has(n.id)),
            ...prev.filter(
              (n) => n.type !== "device_offline" && n.type !== "low_battery",
            ),
          ];
          return merged.slice(0, 50); // Keep max 50 notifications
        });
      }

      // Could also fetch pending settlements, new transactions, etc.
    } catch (error) {
      console.error("Error fetching notifications:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNotifications();

    // Poll every 30 seconds
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const markAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n)),
    );
  };

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const clearAll = () => {
    setNotifications([]);
  };

  const formatTime = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();

    if (diff < 60000) return "Baru saja";
    if (diff < 3600000) return `${Math.floor(diff / 60000)} menit lalu`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)} jam lalu`;
    return date.toLocaleDateString("id-ID");
  };

  // Header variant styling
  if (variant === "header") {
    return (
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button
            className={`p-1.5 rounded-lg ${darkMode ? "hover:bg-slate-800" : "hover:bg-slate-100"} transition-all hover:scale-110 duration-200 relative group`}
            aria-label="Notifications"
          >
            <Icon
              icon="mdi:bell"
              className={`w-[18px] h-[18px] ${darkMode ? "text-slate-300" : "text-slate-900"} group-hover:rotate-12 transition-transform duration-200`}
            />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 min-w-[12px] h-3 px-0.5 bg-red-500 text-white text-[8px] font-bold rounded-full flex items-center justify-center animate-pulse">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </button>
        </PopoverTrigger>

        <PopoverContent
          className={`w-80 p-0 ${darkMode ? "dark bg-slate-900 border-slate-700" : ""}`}
          side="bottom"
          align="end"
        >
          {/* Header */}
          <div
            className={`flex items-center justify-between p-3 border-b ${darkMode ? "border-slate-700" : ""}`}
          >
            <h3 className="font-semibold text-sm flex items-center gap-2">
              <Icon icon="mdi:bell" className="w-4 h-4" />
              Notifikasi
              {unreadCount > 0 && (
                <span className="px-1.5 py-0.5 bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400 text-[10px] font-bold rounded-full">
                  {unreadCount}
                </span>
              )}
            </h3>
            <div className="flex items-center gap-1">
              {unreadCount > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs"
                  onClick={markAllAsRead}
                >
                  <Icon icon="mdi:check-all" className="w-4 h-4 mr-1" />
                  Read All
                </Button>
              )}
              {notifications.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs text-red-500 hover:text-red-600"
                  onClick={clearAll}
                >
                  <Icon icon="mdi:trash-can-outline" className="w-4 h-4" />
                </Button>
              )}
            </div>
          </div>

          {/* Notifications List */}
          <ScrollArea className="h-[300px]">
            {loading && notifications.length === 0 ? (
              <div className="flex items-center justify-center h-full text-gray-500">
                <Icon icon="mdi:loading" className="w-6 h-6 animate-spin" />
              </div>
            ) : notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-gray-500 py-8">
                <Icon
                  icon="mdi:bell-check"
                  className="w-12 h-12 mb-2 opacity-50"
                />
                <p className="text-sm">Tidak ada notifikasi</p>
              </div>
            ) : (
              <div
                className={`divide-y ${darkMode ? "divide-slate-700" : "divide-gray-100"}`}
              >
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    onClick={() => {
                      markAsRead(notification.id);
                      if (notification.link) {
                        window.location.href = notification.link;
                      }
                    }}
                    className={`p-3 cursor-pointer transition-colors ${darkMode ? "hover:bg-slate-800" : "hover:bg-gray-50"} ${
                      !notification.read
                        ? darkMode
                          ? "bg-blue-900/20"
                          : "bg-blue-50/50"
                        : ""
                    }`}
                  >
                    <div className="flex gap-3">
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${NOTIFICATION_COLORS[notification.type]}`}
                      >
                        <Icon
                          icon={NOTIFICATION_ICONS[notification.type]}
                          className="w-4 h-4"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <p
                            className={`text-sm font-medium truncate ${!notification.read ? (darkMode ? "text-white" : "text-gray-900") : darkMode ? "text-gray-400" : "text-gray-600"}`}
                          >
                            {notification.title}
                          </p>
                          {!notification.read && (
                            <span className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 mt-1.5" />
                          )}
                        </div>
                        <p
                          className={`text-xs truncate ${darkMode ? "text-gray-500" : "text-gray-500"}`}
                        >
                          {notification.message}
                        </p>
                        <p
                          className={`text-[10px] mt-1 ${darkMode ? "text-gray-600" : "text-gray-400"}`}
                        >
                          {formatTime(new Date(notification.timestamp))}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>

          {/* Footer */}
          {notifications.length > 0 && (
            <div
              className={`p-2 border-t text-center ${darkMode ? "border-slate-700" : ""}`}
            >
              <Button
                variant="ghost"
                size="sm"
                className="w-full text-xs"
                onClick={() => setOpen(false)}
              >
                Tutup
              </Button>
            </div>
          )}
        </PopoverContent>
      </Popover>
    );
  }

  // Sidebar variant (original)
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          className={`relative flex items-center px-2.5 py-2 rounded-lg transition-all duration-200 group
            ${!sidebarOpen && !isMobile ? "justify-center" : "gap-2.5 w-full"}
            hover:bg-white/10 text-indigo-100 hover:text-white`}
        >
          <div className="relative">
            <Icon
              icon="mdi:bell"
              className="w-[18px] h-[18px] group-hover:animate-[wiggle_0.3s_ease-in-out]"
            />
            {unreadCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 min-w-[16px] h-4 px-1 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center animate-pulse">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </div>
          {(sidebarOpen || isMobile) && (
            <span className="text-xs font-medium">Notifikasi</span>
          )}
        </button>
      </PopoverTrigger>

      <PopoverContent
        className="w-80 p-0"
        side={isMobile ? "bottom" : "right"}
        align="start"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-3 border-b">
          <h3 className="font-semibold text-sm flex items-center gap-2">
            <Icon icon="mdi:bell" className="w-4 h-4" />
            Notifikasi
            {unreadCount > 0 && (
              <span className="px-1.5 py-0.5 bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400 text-[10px] font-bold rounded-full">
                {unreadCount}
              </span>
            )}
          </h3>
          <div className="flex items-center gap-1">
            {unreadCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-xs"
                onClick={markAllAsRead}
              >
                <Icon icon="mdi:check-all" className="w-4 h-4 mr-1" />
                Read All
              </Button>
            )}
            {notifications.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-xs text-red-500 hover:text-red-600"
                onClick={clearAll}
              >
                <Icon icon="mdi:trash-can-outline" className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>

        {/* Notifications List */}
        <ScrollArea className="h-[300px]">
          {loading && notifications.length === 0 ? (
            <div className="flex items-center justify-center h-full text-gray-500">
              <Icon icon="mdi:loading" className="w-6 h-6 animate-spin" />
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-500 py-8">
              <Icon
                icon="mdi:bell-check"
                className="w-12 h-12 mb-2 opacity-50"
              />
              <p className="text-sm">Tidak ada notifikasi</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100 dark:divide-gray-800">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  onClick={() => {
                    markAsRead(notification.id);
                    if (notification.link) {
                      window.location.href = notification.link;
                    }
                  }}
                  className={`p-3 cursor-pointer transition-colors hover:bg-gray-50 dark:hover:bg-gray-800 ${
                    !notification.read
                      ? "bg-blue-50/50 dark:bg-blue-900/10"
                      : ""
                  }`}
                >
                  <div className="flex gap-3">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${NOTIFICATION_COLORS[notification.type]}`}
                    >
                      <Icon
                        icon={NOTIFICATION_ICONS[notification.type]}
                        className="w-4 h-4"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p
                          className={`text-sm font-medium truncate ${!notification.read ? "text-gray-900 dark:text-white" : "text-gray-600 dark:text-gray-400"}`}
                        >
                          {notification.title}
                        </p>
                        {!notification.read && (
                          <span className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 mt-1.5" />
                        )}
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                        {notification.message}
                      </p>
                      <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-1">
                        {formatTime(new Date(notification.timestamp))}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>

        {/* Footer */}
        {notifications.length > 0 && (
          <div className="p-2 border-t text-center">
            <Button
              variant="ghost"
              size="sm"
              className="w-full text-xs"
              onClick={() => setOpen(false)}
            >
              Lihat Semua
            </Button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
