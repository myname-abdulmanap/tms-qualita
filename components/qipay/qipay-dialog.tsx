"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { QipayDevice } from "@/types/qipay";
import QipayForm from "./qipay-form";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  editData?: QipayDevice | null;
  merchantId?: string;
};

export default function QipayDialog({
  open,
  onOpenChange,
  onSuccess,
  editData,
  merchantId,
}: Props) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {editData ? "Edit QIPAY Device" : "Create QIPAY Device"}
          </DialogTitle>
        </DialogHeader>

        <QipayForm
          editData={editData}
          merchantId={merchantId}
          onSuccess={() => {
            onSuccess();
            onOpenChange(false);
          }}
          onCancel={() => onOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  );
}
