"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import MerchantForm from "./merchant-form";

interface Merchant {
  id: string;
  code: string;
  name: string;
  clientId: string;
}

interface MerchantDialogProps {
  isOpen: boolean;
  onClose: () => void;
  merchant?: Merchant | null;
  onSuccess: () => void;
}

export default function MerchantDialog({
  isOpen,
  onClose,
  merchant,
  onSuccess,
}: MerchantDialogProps) {
  const handleSuccess = () => {
    onSuccess();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {merchant ? "Edit Merchant" : "Create New Merchant"}
          </DialogTitle>
        </DialogHeader>
        <MerchantForm merchant={merchant} onSuccess={handleSuccess} />
      </DialogContent>
    </Dialog>
  );
}
