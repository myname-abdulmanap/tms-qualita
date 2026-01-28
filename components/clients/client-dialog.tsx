"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import ClientForm from "./client-form";

type Client = {
  id: string;
  code: string;
  name: string;
  type: string;
};

type ClientDialogProps = {
  open: boolean;
  client?: Client | null;
  onClose: () => void;
  onSuccess: () => void;
};

export default function ClientDialog({ open, client, onClose, onSuccess }: ClientDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{client ? "Edit Client" : "Add Client"}</DialogTitle>
        </DialogHeader>
        <ClientForm client={client} onSuccess={onSuccess} />
      </DialogContent>
    </Dialog>
  );
}