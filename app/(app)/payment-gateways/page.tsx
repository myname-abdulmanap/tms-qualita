"use client";

export const dynamic = "force-dynamic";

import PaymentGatewayTable from "@/components/payment-gateways/payment-gateway-table";

export default function PaymentGatewaysPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Payment Gateway Providers
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          Manage payment gateway configurations for QRIS and other payment methods
        </p>
      </div>

      <PaymentGatewayTable />
    </div>
  );
}
