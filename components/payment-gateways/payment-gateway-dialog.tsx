"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { PaymentGatewayConfig } from "@/types/payment-gateway";


interface PaymentGatewayDialogProps {
  isOpen: boolean;
  onClose: () => void;
  gateway: PaymentGatewayConfig | null;
  onSuccess: () => void;
}

export default function PaymentGatewayDialog({
  isOpen,
  onClose,
  gateway,
  onSuccess,
}: PaymentGatewayDialogProps) {
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [form, setForm] = useState<PaymentGatewayConfig>({
    code: "",
    name: "",
    baseUrl: "",
    createOrderPath: "",
    method: "POST",
    headersTemplate: {},
    bodyTemplate: {},
    responseMapping: {},
    webhookPath: "",
    webhookEventField: "",
    webhookSuccessEvent: "",
    webhookDataField: "",
    webhookOrderIdField: "",
    webhookStatusField: "",
    webhookSuccessStatus: "",
    webhookSignatureHeader: "",
    webhookSecret: "",
    webhookSignatureAlgo: "HMAC-SHA256",
    isActive: true,
  });

  useEffect(() => {
    if (gateway) {
      setForm(gateway);
    } else {
      setForm({
        code: "",
        name: "",
        baseUrl: "",
        createOrderPath: "",
        method: "POST",
        headersTemplate: {},
        bodyTemplate: {},
        responseMapping: {},
        webhookPath: "",
        webhookEventField: "",
        webhookSuccessEvent: "",
        webhookDataField: "",
        webhookOrderIdField: "",
        webhookStatusField: "",
        webhookSuccessStatus: "",
        webhookSignatureHeader: "",
        webhookSecret: "",
        webhookSignatureAlgo: "HMAC-SHA256",
        isActive: true,
      });
    }
    setErrors({});
  }, [gateway, isOpen]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleJsonChange = (field: string, value: string) => {
    try {
      const parsed = JSON.parse(value);
      setForm((prev) => ({ ...prev, [field]: parsed }));
      setErrors((prev) => {
        const updated = { ...prev };
        delete updated[field];
        return updated;
      });
    } catch (e) {
      setErrors((prev) => ({
        ...prev,
        [field]: "Invalid JSON format",
      }));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!form.code.trim()) newErrors.code = "Code is required";
    if (!form.name.trim()) newErrors.name = "Name is required";
    if (!form.baseUrl.trim()) newErrors.baseUrl = "Base URL is required";
    if (!form.createOrderPath.trim())
      newErrors.createOrderPath = "Create order path is required";
    if (!form.method.trim()) newErrors.method = "Method is required";
    if (!form.webhookPath.trim())
      newErrors.webhookPath = "Webhook path is required";
    if (!form.webhookEventField.trim())
      newErrors.webhookEventField = "Webhook event field is required";
    if (!form.webhookSuccessEvent.trim())
      newErrors.webhookSuccessEvent = "Webhook success event is required";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setLoading(true);
    try {
      const method = gateway?.id ? "PUT" : "POST";
      const url = gateway?.id
        ? `/api/payment-gateways/${gateway.id}`
        : "/api/payment-gateways";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(
          error.message ||
            `Failed to ${gateway?.id ? "update" : "create"} gateway`,
        );
      }

      onSuccess();
      onClose();
    } catch (error) {
      alert(error instanceof Error ? error.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {gateway?.id ? "Edit Payment Gateway" : "Add Payment Gateway"}
          </DialogTitle>
          <DialogDescription>
            Configure payment gateway provider settings
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Basic Info */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Code *</label>
              <Input
                name="code"
                value={form.code}
                onChange={handleInputChange}
                placeholder="e.g., CASHI, MIDTRANS"
                disabled={!!gateway?.id}
                className={errors.code ? "border-red-500" : ""}
              />
              {errors.code && (
                <p className="text-red-500 text-xs mt-1">{errors.code}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Name *</label>
              <Input
                name="name"
                value={form.name}
                onChange={handleInputChange}
                placeholder="e.g., Cashi QRIS"
                className={errors.name ? "border-red-500" : ""}
              />
              {errors.name && (
                <p className="text-red-500 text-xs mt-1">{errors.name}</p>
              )}
            </div>
          </div>

          {/* API Configuration */}
          <div className="border-t pt-4">
            <h3 className="font-semibold mb-3">API Configuration</h3>

            <div>
              <label className="block text-sm font-medium mb-1">
                Base URL *
              </label>
              <Input
                name="baseUrl"
                value={form.baseUrl}
                onChange={handleInputChange}
                placeholder="https://api.example.com"
                className={errors.baseUrl ? "border-red-500" : ""}
              />
              {errors.baseUrl && (
                <p className="text-red-500 text-xs mt-1">{errors.baseUrl}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4 mt-3">
              <div>
                <label className="block text-sm font-medium mb-1">
                  Order Path *
                </label>
                <Input
                  name="createOrderPath"
                  value={form.createOrderPath}
                  onChange={handleInputChange}
                  placeholder="/create-order"
                  className={errors.createOrderPath ? "border-red-500" : ""}
                />
                {errors.createOrderPath && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors.createOrderPath}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Method *
                </label>
                <Select
                  value={form.method}
                  onValueChange={(value) => handleSelectChange("method", value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="POST">POST</SelectItem>
                    <SelectItem value="GET">GET</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1 mt-3">
                Headers Template (JSON)
              </label>
              <textarea
                className="w-full border rounded p-2 text-sm font-mono"
                rows={3}
                value={JSON.stringify(form.headersTemplate, null, 2)}
                onChange={(e) =>
                  handleJsonChange("headersTemplate", e.target.value)
                }
                placeholder={
                  '{"X-API-KEY": "{{apiKey}}", "Content-Type": "application/json"}'
                }
              />
              {errors.headersTemplate && (
                <p className="text-red-500 text-xs mt-1">
                  {errors.headersTemplate}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium mb-1 mt-3">
                Body Template (JSON)
              </label>
              <textarea
                className="w-full border rounded p-2 text-sm font-mono"
                rows={3}
                value={JSON.stringify(form.bodyTemplate, null, 2)}
                onChange={(e) =>
                  handleJsonChange("bodyTemplate", e.target.value)
                }
                placeholder={
                  '{"amount": "{{amount}}", "order_id": "{{orderId}}"}'
                }
              />
              {errors.bodyTemplate && (
                <p className="text-red-500 text-xs mt-1">
                  {errors.bodyTemplate}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium mb-1 mt-3">
                Response Mapping (JSON)
              </label>
              <textarea
                className="w-full border rounded p-2 text-sm font-mono"
                rows={3}
                value={JSON.stringify(form.responseMapping, null, 2)}
                onChange={(e) =>
                  handleJsonChange("responseMapping", e.target.value)
                }
                placeholder={'{"qrImageUrl": "qrUrl", "amount": "amount"}'}
              />
              {errors.responseMapping && (
                <p className="text-red-500 text-xs mt-1">
                  {errors.responseMapping}
                </p>
              )}
            </div>
          </div>

          {/* Webhook Configuration */}
          <div className="border-t pt-4">
            <h3 className="font-semibold mb-3">Webhook Configuration</h3>

            <div>
              <label className="block text-sm font-medium mb-1">
                Webhook Path *
              </label>
              <Input
                name="webhookPath"
                value={form.webhookPath}
                onChange={handleInputChange}
                placeholder="/webhook/payment"
                className={errors.webhookPath ? "border-red-500" : ""}
              />
              {errors.webhookPath && (
                <p className="text-red-500 text-xs mt-1">
                  {errors.webhookPath}
                </p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4 mt-3">
              <div>
                <label className="block text-sm font-medium mb-1">
                  Event Field *
                </label>
                <Input
                  name="webhookEventField"
                  value={form.webhookEventField}
                  onChange={handleInputChange}
                  placeholder="event"
                  className={errors.webhookEventField ? "border-red-500" : ""}
                />
                {errors.webhookEventField && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors.webhookEventField}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Success Event *
                </label>
                <Input
                  name="webhookSuccessEvent"
                  value={form.webhookSuccessEvent}
                  onChange={handleInputChange}
                  placeholder="PAYMENT_SETTLED"
                  className={errors.webhookSuccessEvent ? "border-red-500" : ""}
                />
                {errors.webhookSuccessEvent && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors.webhookSuccessEvent}
                  </p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mt-3">
              <div>
                <label className="block text-sm font-medium mb-1">
                  Data Field
                </label>
                <Input
                  name="webhookDataField"
                  value={form.webhookDataField}
                  onChange={handleInputChange}
                  placeholder="data"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Order ID Field
                </label>
                <Input
                  name="webhookOrderIdField"
                  value={form.webhookOrderIdField}
                  onChange={handleInputChange}
                  placeholder="order_id"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mt-3">
              <div>
                <label className="block text-sm font-medium mb-1">
                  Status Field
                </label>
                <Input
                  name="webhookStatusField"
                  value={form.webhookStatusField}
                  onChange={handleInputChange}
                  placeholder="status"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Success Status
                </label>
                <Input
                  name="webhookSuccessStatus"
                  value={form.webhookSuccessStatus}
                  onChange={handleInputChange}
                  placeholder="SETTLED"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mt-3">
              <div>
                <label className="block text-sm font-medium mb-1">
                  Signature Header
                </label>
                <Input
                  name="webhookSignatureHeader"
                  value={form.webhookSignatureHeader}
                  onChange={handleInputChange}
                  placeholder="x-signature"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Signature Algorithm
                </label>
                <Select
                  value={form.webhookSignatureAlgo || "HMAC-SHA256"}
                  onValueChange={(value) =>
                    handleSelectChange("webhookSignatureAlgo", value)
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="HMAC-SHA256">HMAC-SHA256</SelectItem>
                    <SelectItem value="SHA256">SHA256</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1 mt-3">
                Webhook Secret
              </label>
              <Input
                name="webhookSecret"
                value={form.webhookSecret}
                onChange={handleInputChange}
                placeholder="sk_xxxxx"
                type="password"
              />
            </div>
          </div>

          {/* Status */}
          <div className="border-t pt-4 flex items-center gap-2">
            <input
              type="checkbox"
              id="isActive"
              checked={form.isActive}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, isActive: e.target.checked }))
              }
              className="rounded"
            />
            <label htmlFor="isActive" className="text-sm font-medium">
              Active
            </label>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 border-t pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Saving..." : "Save"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
