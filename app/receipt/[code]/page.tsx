import ReceiptClient from "./receipt-client";

export default async function ReceiptPage({ params }) {
  const resolvedParams = await params;
  
  // Fetch transaction data
  let trx = null;
  let error = null;
  
  try {
    const apiUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/receipt/${resolvedParams.code}`;
    const res = await fetch(apiUrl, { cache: "no-store" });
    
    if (res.ok) {
      const json = await res.json();
      trx = json.data;
    } else {
      error = `API returned status ${res.status}`;
    }
  } catch (err) {
    error = err.message;
  }

  return <ReceiptClient trx={trx} error={error} code={resolvedParams.code} />;
}