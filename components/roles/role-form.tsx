"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface Permission {
  id: string;
  key: string;
  description: string;
}

interface Client {
  id: string;
  code: string;
  name: string;
}

interface Role {
  id: string;
  name: string;
  scope: string;
  clientId: string | null;
  permissions: { permission: Permission }[];
}

interface RoleFormProps {
  role?: Role | null;
  clientId?: string;
  onSuccess: () => void;
}

export default function RoleForm({ role, clientId, onSuccess }: RoleFormProps) {
  const [name, setName] = useState("");
  const [scope, setScope] = useState("CLIENT");
  const [selectedClient, setSelectedClient] = useState(clientId || "");
  const [allPermissions, setAllPermissions] = useState<Permission[]>([]);
  const [allClients, setAllClients] = useState<Client[]>([]);
  const [selectedPermissions, setSelectedPermissions] = useState<Set<string>>(
    new Set(),
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (role) {
      setName(role.name);
      setScope(role.scope);
      setSelectedClient(role.clientId || "");
      const permKeys = new Set(role.permissions.map((p) => p.permission.key));
      setSelectedPermissions(permKeys);
    }
  }, [role]);

  useEffect(() => {
    loadPermissions();
    loadClients();
  }, []);

  const loadPermissions = async () => {
    try {
      const res = await fetch("/api/permissions");
      if (!res.ok) throw new Error("Failed to load permissions");
      const data = await res.json();
      setAllPermissions(data);
    } catch (error) {
      console.error("Error loading permissions:", error);
      setError("Failed to load permissions");
    }
  };

  const loadClients = async () => {
    try {
      const res = await fetch("/api/clients");
      if (!res.ok) throw new Error("Failed to load clients");
      const data = await res.json();
      setAllClients(data);
    } catch (error) {
      console.error("Error loading clients:", error);
    }
  };

  const handlePermissionToggle = (key: string) => {
    const newSet = new Set(selectedPermissions);
    if (newSet.has(key)) {
      newSet.delete(key);
    } else {
      newSet.add(key);
    }
    setSelectedPermissions(newSet);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    saveRole();
  };

  const saveRole = async () => {
    setLoading(true);
    setError("");

    try {
      const body = {
        name,
        scope,
        clientId: scope === "PLATFORM" ? undefined : selectedClient,
        permissionKeys: Array.from(selectedPermissions),
      };

      const url = role ? `/api/roles/${role.id}` : "/api/roles";
      const method = role ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Failed to save role");
      }

      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save role");
    } finally {
      setLoading(false);
    }
  };

  // Group permissions by prefix (device:, user:, etc)
  const groupedPermissions = allPermissions.reduce(
    (acc, perm) => {
      const prefix = perm.key.split(":")[0];
      if (!acc[prefix]) acc[prefix] = [];
      acc[prefix].push(perm);
      return acc;
    },
    {} as Record<string, Permission[]>,
  );

  return (
    <div className="flex flex-col h-full max-h-[80vh]">
      {error && (
        <Alert variant="destructive" className="mb-3">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Fixed top section - form fields */}
      <div className="space-y-3 mb-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium mb-1.5">Role Name</label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="h-9"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5">Scope</label>
            <Select value={scope} onValueChange={setScope}>
              <SelectTrigger className="h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="PLATFORM">Platform</SelectItem>
                <SelectItem value="CLIENT">Client</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {scope === "CLIENT" && (
          <div>
            <label className="block text-sm font-medium mb-1.5">Client</label>
            {clientId ? (
              <div className="h-9 px-3 py-2 bg-gray-100 border rounded-md text-sm text-gray-600">
                {allClients.find(c => c.id === clientId)?.name || clientId}
              </div>
            ) : (
              <Select value={selectedClient} onValueChange={setSelectedClient}>
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="Select client" />
                </SelectTrigger>
                <SelectContent>
                  {allClients.map((client) => (
                    <SelectItem key={client.id} value={client.id}>
                      {client.code} - {client.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
        )}
      </div>

      {/* Scrollable permissions section */}
      <div className="flex-1 overflow-hidden flex flex-col min-h-0">
        <label className="block text-sm font-medium mb-2">Permissions</label>
        <div className="border rounded-lg bg-gray-50 flex-1 overflow-y-auto">
          <div className="p-3 space-y-3">
            {Object.entries(groupedPermissions).map(([prefix, perms]) => (
              <div key={prefix} className="bg-white rounded-md p-2.5 shadow-sm">
                <h4 className="font-semibold text-sm mb-2 capitalize text-gray-700 border-b pb-1">
                  {prefix}
                </h4>
                <div className="space-y-1.5">
                  {perms.map((perm) => (
                    <label
                      key={perm.id}
                      className="flex items-start gap-2 hover:bg-gray-50 p-1.5 rounded cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={selectedPermissions.has(perm.key)}
                        onChange={() => handlePermissionToggle(perm.key)}
                        className="w-4 h-4 mt-0.5 flex-shrink-0"
                      />
                      <span className="text-sm flex-1">
                        <span className="font-medium text-gray-900">
                          {perm.key.split(":")[1]}
                        </span>
                        {perm.description && (
                          <span className="text-gray-500 text-xs ml-1.5">
                            - {perm.description}
                          </span>
                        )}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Fixed bottom section - action buttons */}
      <div className="flex gap-2 pt-4 mt-4 border-t">
        <Button onClick={handleSubmit} disabled={loading} className="min-w-32">
          {loading ? "Saving..." : role ? "Update Role" : "Create Role"}
        </Button>
        <Button
          variant="outline"
          onClick={() => setSelectedPermissions(new Set())}
          disabled={loading || selectedPermissions.size === 0}
        >
          Clear All
        </Button>
        <div className="flex-1" />
        <span className="text-sm text-gray-500 self-center">
          {selectedPermissions.size} permission(s) selected
        </span>
      </div>
    </div>
  );
}