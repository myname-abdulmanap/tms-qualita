"use client";

export default function PrintButton() {
  return (
    <button
      onClick={() => window.print()}
      className="mt-6 w-full bg-black text-white py-2 rounded"
    >
      Download / Print
    </button>
  );
}
