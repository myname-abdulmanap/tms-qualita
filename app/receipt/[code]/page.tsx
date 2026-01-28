import ReceiptClient from "./receipt-client";

interface ReceiptPageProps {
  params: {
    code: string;
  };
}

export default async function ReceiptPage({ params }: ReceiptPageProps) {
  const { code } = params;

  let trx: any = null;
  let error: string | null = null;

  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_APP_URL}/api/receipt/${code}`,
      { cache: "no-store" }
    );

    if (res.ok) {
      const json = await res.json();
      trx = json.data;
    } else {
      error = `API returned status ${res.status}`;
    }
  } catch (err: any) {
    error = err.message || "Unknown error";
  }

  return (
    <ReceiptClient
      trx={trx}
      error={error}
      code={code}
    />
  );
}
