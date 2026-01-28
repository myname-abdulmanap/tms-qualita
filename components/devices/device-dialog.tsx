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
  onClose: () => void;
  onSuccess: () => void;
};

export default function DeviceDialog({
  open,
  device,
  onClose,
  onSuccess,
}: DeviceDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{device ? "Edit Device" : "Add New Device"}</DialogTitle>
        </DialogHeader>
        <DeviceForm device={device} onSuccess={onSuccess} />
      </DialogContent>
    </Dialog>
  );
}
