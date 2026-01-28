"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import UserForm from "./user-form";

type User = {
  id: string;
  email: string;
  name: string;
  roleId: string;
  clientId?: string | null;
};

type UserDialogProps = {
  open: boolean;
  user?: User | null;
  onClose: () => void;
  onSuccess: () => void;
};

export default function UserDialog({ open, user, onClose, onSuccess }: UserDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{user ? "Edit User" : "Add New User"}</DialogTitle>
        </DialogHeader>
        <UserForm user={user} onSuccess={onSuccess} />
      </DialogContent>
    </Dialog>
  );
}