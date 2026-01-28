"use client";

export default function ReceiptClient({ trx, error, code }) {
  if (error || !trx) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#f5f5f5",
          padding: 20,
        }}
      >
        <div
          style={{
            maxWidth: 400,
            width: "100%",
            backgroundColor: "white",
            padding: 30,
            border: "2px solid #000",
            textAlign: "center",
          }}
        >
          <div style={{ fontSize: 48, marginBottom: 16 }}>✕</div>
          <h1 style={{ margin: 0, marginBottom: 8, fontSize: 20 }}>
            Struk Tidak Ditemukan
          </h1>
          <p style={{ color: "#333", margin: 0 }}>
            {error || "Terjadi kesalahan saat memuat data"}
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      <style jsx global>{`
        * {
          box-sizing: border-box;
        }
        @media print {
          @page {
            size: 80mm auto;
            margin: 0;
          }
          body {
            margin: 0;
            padding: 0;
          }
          body * {
            visibility: hidden;
          }
          #receipt-content,
          #receipt-content * {
            visibility: visible;
          }
          #receipt-content {
            position: absolute;
            left: 0;
            top: 0;
            width: 80mm;
            background: white;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>

      <div
        style={{
          minHeight: "100vh",
          backgroundColor: "#f5f5f5",
          padding: "30px 20px",
          fontFamily: "'Courier New', Courier, monospace",
        }}
      >
        <div style={{ maxWidth: 320, margin: "0 auto" }}>
          <div
            id="receipt-content"
            style={{
              backgroundColor: "white",
              border: "2px solid #000",
              padding: "20px 16px",
            }}
          >
            {/* HEADER */}
            <div
              style={{
                textAlign: "center",
                paddingBottom: 16,
                marginBottom: 16,
                borderBottom: "2px solid #000",
              }}
            >
              <div style={{ fontSize: 36, fontWeight: 700 }}>✓</div>
              <div style={{ fontSize: 14, fontWeight: 700 }}>
                PEMBAYARAN BERHASIL
              </div>
              <div style={{ fontSize: 11 }}>PAYMENT SUCCESSFUL</div>
            </div>

            {/* MERCHANT */}
            <div
              style={{
                textAlign: "center",
                paddingBottom: 16,
                marginBottom: 16,
                borderBottom: "1px dashed #000",
              }}
            >
              <div style={{ fontSize: 16, fontWeight: 700 }}>
                {trx.merchant.name}
              </div>
              <div style={{ fontSize: 11 }}>
                Device: {trx.device.deviceCode}
              </div>
            </div>

            {/* INVOICE */}
            <div
              style={{
                marginBottom: 16,
                paddingBottom: 16,
                borderBottom: "1px dashed #000",
              }}
            >
              <div style={{ fontSize: 10 }}>NO. INVOICE</div>
              <div style={{ fontSize: 14, fontWeight: 700 }}>
                {trx.transactionCode}
              </div>
            </div>

            {/* TOTAL */}
            <div
              style={{
                border: "3px double #000",
                padding: 16,
                marginBottom: 16,
                textAlign: "center",
              }}
            >
              <div style={{ fontSize: 10 }}>TOTAL PEMBAYARAN</div>
              <div style={{ fontSize: 24, fontWeight: 700 }}>
                Rp {trx.amount.toLocaleString("id-ID")}
              </div>
            </div>

            {/* DETAIL */}
            <div
              style={{
                padding: "12px 0",
                marginBottom: 16,
                borderTop: "1px solid #000",
                borderBottom: "1px solid #000",
                fontSize: 12,
              }}
            >
              {[
                { label: "Metode Pembayaran", value: trx.paymentMethod },
                { label: "Provider", value: trx.provider },
                { label: "Status", value: trx.status },
              ].map((item, idx) => (
                <div
                  key={idx}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    marginBottom: idx < 2 ? 8 : 0,
                  }}
                >
                  <span>{item.label}</span>
                  <span style={{ fontWeight: 700 }}>{item.value}</span>
                </div>
              ))}
            </div>

            {/* DATE */}
            <div
              style={{
                fontSize: 11,
                textAlign: "center",
                marginBottom: 16,
                borderBottom: "1px dashed #000",
                paddingBottom: 16,
              }}
            >
              {new Date(trx.paidAt).toLocaleString("id-ID")}
            </div>

            {/* FOOTER */}
            <div style={{ textAlign: "center", fontSize: 11 }}>
              <b>Terima kasih atas pembayaran Anda</b>
              <div style={{ fontSize: 10 }}>Thank you for your payment</div>
            </div>
          </div>

          {/* ACTIONS */}
          <div
            className="no-print"
            style={{ marginTop: 20, display: "flex", gap: 8 }}
          >
            <button
              onClick={() => window.print()}
              style={{
                flex: 1,
                backgroundColor: "#000",
                color: "#fff",
                border: "2px solid #000",
                padding: 12,
                fontSize: 11,
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              PRINT STRUK
            </button>

            <a
              href="/"
              style={{
                flex: 1,
                backgroundColor: "#fff",
                color: "#000",
                border: "2px solid #000",
                padding: 12,
                fontSize: 11,
                fontWeight: 700,
                textDecoration: "none",
                textAlign: "center",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              KEMBALI
            </a>
          </div>
        </div>
      </div>
    </>
  );
}
