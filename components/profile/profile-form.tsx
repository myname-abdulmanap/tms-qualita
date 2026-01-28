"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Icon } from "@iconify/react";

interface UserInfo {
  userId: string;
  name: string;
  email: string;
  roleName: string;
}

export default function ProfileForm({ userInfo }: { userInfo: UserInfo }) {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [formData, setFormData] = useState({
    name: userInfo?.name || "",
    email: userInfo?.email || "",
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess(false);

    try {
      if (
        formData.newPassword &&
        formData.newPassword !== formData.confirmPassword
      ) {
        throw new Error("Password baru tidak sesuai");
      }

      const res = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          currentPassword: formData.currentPassword || undefined,
          newPassword: formData.newPassword || undefined,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || "Gagal update profil");
      }

      setSuccess(true);
      setFormData((prev) => ({
        ...prev,
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      }));

      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Main Form */}
      <div className="lg:col-span-2 space-y-6">
        {/* Info Card */}
        <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-slate-900 p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Informasi Akun
          </h2>
          <div className="space-y-2">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Role
              </p>
              <p className="text-gray-900 dark:text-white font-semibold">
                {userInfo?.roleName}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                User ID
              </p>
              <p className="text-gray-900 dark:text-white font-mono text-sm">
                {userInfo?.userId}
              </p>
            </div>
          </div>
        </div>

        {/* Edit Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {success && (
            <Alert className="bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800">
              <Icon
                icon="lucide:check-circle"
                className="h-4 w-4 text-green-600 dark:text-green-400"
              />
              <AlertDescription className="text-green-800 dark:text-green-300">
                Profil berhasil diperbarui
              </AlertDescription>
            </Alert>
          )}

          {error && (
            <Alert className="bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800">
              <Icon
                icon="lucide:alert-circle"
                className="h-4 w-4 text-red-600 dark:text-red-400"
              />
              <AlertDescription className="text-red-800 dark:text-red-300">
                {error}
              </AlertDescription>
            </Alert>
          )}

          <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-slate-900 p-6 shadow-sm space-y-4">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-4">
              Edit Profil
            </h3>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Nama Lengkap
              </label>
              <Input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="dark:bg-slate-800 dark:border-gray-600 dark:text-white"
                placeholder="Nama Anda"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Email
              </label>
              <Input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="dark:bg-slate-800 dark:border-gray-600 dark:text-white"
                placeholder="email@example.com"
              />
            </div>
          </div>

          {/* Change Password */}
          <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-slate-900 p-6 shadow-sm space-y-4">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-4">
              Ubah Password
            </h3>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Password Saat Ini
              </label>
              <Input
                type="password"
                name="currentPassword"
                value={formData.currentPassword}
                onChange={handleChange}
                className="dark:bg-slate-800 dark:border-gray-600 dark:text-white"
                placeholder="••••••••"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Password Baru
              </label>
              <Input
                type="password"
                name="newPassword"
                value={formData.newPassword}
                onChange={handleChange}
                className="dark:bg-slate-800 dark:border-gray-600 dark:text-white"
                placeholder="••••••••"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Konfirmasi Password Baru
              </label>
              <Input
                type="password"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                className="dark:bg-slate-800 dark:border-gray-600 dark:text-white"
                placeholder="••••••••"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <Button variant="outline" type="button">
              Batal
            </Button>
            <Button
              disabled={loading}
              className="bg-indigo-600 hover:bg-indigo-700"
            >
              {loading ? "Menyimpan..." : "Simpan Perubahan"}
            </Button>
          </div>
        </form>
      </div>

      {/* Sidebar Info */}
      <div className="lg:col-span-1">
        <div className="rounded-lg border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20 p-4 space-y-3">
          <div className="flex items-start gap-3">
            <Icon
              icon="lucide:info"
              className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0"
            />
            <div>
              <h4 className="font-semibold text-blue-900 dark:text-blue-300">
                Informasi Penting
              </h4>
              <ul className="text-sm text-blue-800 dark:text-blue-200 mt-2 space-y-2">
                <li>• Email digunakan untuk login</li>
                <li>• Password minimal 8 karakter</li>
                <li>• Jangan bagikan informasi login Anda</li>
                <li>• Session akan berakhir otomatis</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
