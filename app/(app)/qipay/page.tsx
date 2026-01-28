"use client";
export const dynamic = "force-dynamic";
export const revalidate = 0;


import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import QipayTable from "@/components/qipay/qipay-table";

export default function QipayPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Qipay</h1>
        <p className="text-slate-500 mt-2">
          Manage NFC sticker devices for tap-to-pay payments
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Device Management</CardTitle>
        </CardHeader>
        <CardContent>
          <QipayTable />
        </CardContent>
      </Card>
    </div>
  );
}
