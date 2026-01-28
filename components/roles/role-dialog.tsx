"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import RoleForm from "./role-form";

interface Permission {
  id: string;
  key: string;
  description: string;
}

interface Role {
  id: string;
  name: string;
  scope: string;
  clientId: string | null;
  permissions: { permission: Permission }[];
}

interface RoleDialogProps {
  isOpen: boolean;
  onClose: () => void;
  role?: Role | null;
  onSuccess: () => void;
}

export default function RoleDialog({
  isOpen,
  onClose,
  role,
  onSuccess,
}: RoleDialogProps) {
  const handleSuccess = () => {
    onSuccess();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{role ? "Edit Role" : "Create New Role"}</DialogTitle>
        </DialogHeader>
        <RoleForm
          role={role}
          clientId={role?.clientId || ""}
          onSuccess={handleSuccess}
        />
      </DialogContent>
    </Dialog>
  );
}
