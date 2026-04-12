"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import DeviceForm from "./device-form";

type Device = {
  id: string;
  deviceCode: string;
  serialNumber: string;
  model: string;
  status: string;
  merchantId: string;
  merchant?: {
    id: string;
    name: string;
  };
};

type DeviceDialogProps = {
  open: boolean;
  device?: Device | null;
  mode?: "edc" | "soundbox";
  onClose: () => void;
  onSuccess: () => void;
};

export default function DeviceDialog({
  open,
  device,
  mode = "edc",
  onClose,
  onSuccess,
}: DeviceDialogProps) {
  const label = mode === "soundbox" ? "Soundbox" : "Device";

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{device ? `Edit ${label}` : `Add New ${label}`}</DialogTitle>
        </DialogHeader>
        <DeviceForm mode={mode} device={device} onSuccess={onSuccess} />
      </DialogContent>
    </Dialog>
  );
}
