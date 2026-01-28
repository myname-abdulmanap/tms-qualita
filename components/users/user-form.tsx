"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Info } from "lucide-react";

type Role = {
  id: string;
  name: string;
  scope: string;
};

type Client = {
  id: string;
  name: string;
  code: string;
};

type User = {
  id: string;
  email: string;
  name: string;
  roleId: string;
  clientId?: string | null;
};

type CurrentUser = {
  userId: string;
  clientId: string | null;
  merchantId: string | null;
  permissions: string[];
};

type UserFormProps = {
  user?: User | null;
  onSuccess: () => void;
};

export default function UserForm({ user, onSuccess }: UserFormProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [roleId, setRoleId] = useState("");
  const [clientId, setClientId] = useState("");
  const [roles, setRoles] = useState<Role[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingRoles, setLoadingRoles] = useState(true);
  const [loadingClients, setLoadingClients] = useState(true);
  const [error, setError] = useState("");

  const isEdit = !!user;
  const isVendor = currentUser?.clientId === null;
  const isClientAdmin = currentUser?.clientId !== null;

  useEffect(() => {
    loadCurrentUser();
    loadRoles();
    loadClients();
  }, []);

  useEffect(() => {
    if (user) {
      setEmail(user.email);
      setName(user.name);
      setRoleId(String(user.roleId));
      setClientId(user.clientId ? String(user.clientId) : "");
      setPassword("");
    } else {
      resetForm();
    }
  }, [user, currentUser]);

  const loadCurrentUser = async () => {
    try {
      const res = await fetch("/api/me");
      if (res.ok) {
        const data = await res.json();
        console.log("👤 Current user:", data);
        setCurrentUser(data);

        // Auto-set clientId untuk Client Admin
        if (data.clientId && !user) {
          setClientId(String(data.clientId));
          console.log("🔧 Auto-set clientId:", data.clientId);
        }
      }
    } catch (err) {
      console.error("Error loading current user:", err);
    }
  };

  const resetForm = () => {
    setEmail("");
    setPassword("");
    setName("");
    setRoleId("");
    setError("");

    // Auto-set clientId untuk Client Admin
    if (currentUser?.clientId && isClientAdmin) {
      setClientId(String(currentUser.clientId));
    } else {
      setClientId("");
    }
  };

  const loadRoles = async () => {
    setLoadingRoles(true);
    try {
      const res = await fetch("/api/roles");
      if (!res.ok) throw new Error("Failed to load roles");
      const data = await res.json();
      
      console.log("📋 All roles from API:", data);
      
      // Filter berdasarkan scope yang valid
      let filtered = data.filter((r: Role) => 
        r.scope === "PLATFORM" || r.scope === "CLIENT"
      );

      // Client Admin hanya bisa lihat role CLIENT milik mereka
      if (currentUser?.clientId) {
        filtered = filtered.filter((r: Role) => r.scope === "CLIENT");
      }

      console.log("✅ Filtered roles:", filtered);
      setRoles(Array.isArray(filtered) ? filtered : []);
    } catch (err) {
      console.error("❌ Error loading roles:", err);
      setError("Failed to load roles");
    } finally {
      setLoadingRoles(false);
    }
  };

  const loadClients = async () => {
    setLoadingClients(true);
    try {
      const res = await fetch("/api/clients");
      if (res.ok) {
        const data = await res.json();
        console.log("🏢 Clients loaded:", data);
        setClients(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error("❌ Error loading clients:", err);
    } finally {
      setLoadingClients(false);
    }
  };

  const selectedRole = roles.find((r) => String(r.id) === roleId);
  const isClientRole = selectedRole?.scope === "CLIENT";
  const isPlatformRole = selectedRole?.scope === "PLATFORM";

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!email || !name || !roleId) {
      setError("Email, name, dan role harus diisi");
      return;
    }

    if (!isEdit && !password) {
      setError("Password harus diisi untuk user baru");
      return;
    }

    if (isClientRole && !clientId) {
      setError("Role CLIENT membutuhkan pemilihan Client");
      return;
    }

    setLoading(true);

    try {
      const payload: any = {
        email,
        name,
        roleId: String(roleId),
      };

      if (password) {
        payload.password = password;
      }

      // Set clientId
      if (isClientRole && clientId) {
        payload.clientId = String(clientId);
      } else if (isClientAdmin && currentUser?.clientId) {
        payload.clientId = String(currentUser.clientId);
      }

      console.log("📤 Submitting payload:", payload);

      const url = isEdit ? `/api/users/${user.id}` : "/api/users";
      const method = isEdit ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Gagal menyimpan user");
      }

      resetForm();
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal menyimpan user");
    } finally {
      setLoading(false);
    }
  };

  const currentClientName = clients.find((c) => String(c.id) === clientId)?.name;

  return (
    <div className="space-y-4">
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Info Box */}
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription className="text-xs space-y-1">
          {isVendor ? (
            <>
              <div>
                <strong>Super Admin:</strong> Anda bisa create user untuk semua level
              </div>
              <div>
                <strong>Client Role:</strong> User untuk admin client tertentu
              </div>
            </>
          ) : isClientAdmin ? (
            <div>
              <strong>Client Admin:</strong> Semua user yang Anda buat akan terikat ke client:
              <span className="font-bold text-blue-600"> {currentClientName || "Loading..."}</span>
            </div>
          ) : null}
        </AlertDescription>
      </Alert>

      {/* Email */}
      <div className="space-y-2">
        <label className="text-sm font-medium">
          Email <span className="text-red-500">*</span>
        </label>
        <Input
          type="email"
          placeholder="user@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          disabled={loading || isEdit}
        />
        {isEdit && <p className="text-xs text-gray-500">Email tidak bisa diubah</p>}
      </div>

      {/* Name */}
      <div className="space-y-2">
        <label className="text-sm font-medium">
          Name <span className="text-red-500">*</span>
        </label>
        <Input
          placeholder="Full name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          disabled={loading}
        />
      </div>

      {/* Password */}
      <div className="space-y-2">
        <label className="text-sm font-medium">
          Password {!isEdit && <span className="text-red-500">*</span>}
        </label>
        <Input
          type="password"
          placeholder={isEdit ? "Leave blank to keep current password" : "Minimum 6 characters"}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required={!isEdit}
          disabled={loading}
          minLength={6}
        />
        {isEdit && (
          <p className="text-xs text-gray-500">Kosongkan jika tidak ingin mengubah password</p>
        )}
      </div>

      {/* Role */}
      <div className="space-y-2">
        <label className="text-sm font-medium">
          Role <span className="text-red-500">*</span>
        </label>
        <Select
          onValueChange={(val) => {
            setRoleId(val);
            if (isVendor) {
              setClientId("");
            }
          }}
          disabled={loading || loadingRoles}
          value={roleId}
        >
          <SelectTrigger>
            <SelectValue placeholder={loadingRoles ? "Loading roles..." : "Select role"} />
          </SelectTrigger>
          <SelectContent>
            {loadingRoles ? (
              <SelectItem value="loading" disabled>
                Loading roles...
              </SelectItem>
            ) : roles.length === 0 ? (
              <SelectItem value="no-roles" disabled>
                No roles available
              </SelectItem>
            ) : (
              roles.map((r) => (
                <SelectItem key={r.id} value={String(r.id)}>
                  {r.name} ({r.scope})
                </SelectItem>
              ))
            )}
          </SelectContent>
        </Select>
        {!loadingRoles && roles.length === 0 && (
          <p className="text-xs text-red-500">
            No roles found. Please create roles first.
          </p>
        )}
      </div>

      {/* Client selector - HANYA untuk Vendor DAN role CLIENT */}
      {isVendor && isClientRole && (
        <div className="space-y-2">
          <label className="text-sm font-medium">
            Client <span className="text-red-500">*</span>
          </label>
          <Select onValueChange={setClientId} disabled={loading || loadingClients} value={clientId}>
            <SelectTrigger>
              <SelectValue placeholder={loadingClients ? "Loading..." : "Select client"} />
            </SelectTrigger>
            <SelectContent>
              {loadingClients ? (
                <SelectItem value="loading" disabled>
                  Loading clients...
                </SelectItem>
              ) : clients.length === 0 ? (
                <SelectItem value="no-client" disabled>
                  No clients available
                </SelectItem>
              ) : (
                clients.map((c) => (
                  <SelectItem key={c.id} value={String(c.id)}>
                    {c.name} ({c.code})
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
          <p className="text-xs text-gray-500">User ini akan menjadi admin untuk client yang dipilih</p>
        </div>
      )}

      {/* Info untuk Client Admin */}
      {isClientAdmin && (
        <Alert>
          <AlertDescription className="text-xs">
            <strong>Note:</strong> User ini akan otomatis terikat ke client Anda:
            <span className="font-bold"> {currentClientName}</span>
          </AlertDescription>
        </Alert>
      )}

      {/* Info untuk Platform role */}
      {isPlatformRole && (
        <Alert>
          <AlertDescription className="text-xs">
            <strong>Platform role:</strong> User ini akan memiliki akses penuh ke semua client dan merchant.
          </AlertDescription>
        </Alert>
      )}

      <Button onClick={submit} className="w-full" disabled={loading || loadingRoles}>
        {loading ? "Saving..." : isEdit ? "Update User" : "Create User"}
      </Button>
    </div>
  );
}