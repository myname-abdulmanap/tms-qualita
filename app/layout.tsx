// app/layout.tsx
import "./globals.css";
import { UiProvider } from "@/lib/ui-store";
import { Plus_Jakarta_Sans } from "next/font/google";

// load seluruh weight yg kamu butuh + set ke CSS variable
const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-jakarta-sans",
  weight: ["200","300","400","500","600","700","800"],
});

export default function Root({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning className={jakarta.variable}>
      <body>
        <UiProvider>{children}</UiProvider>
      </body>
    </html>
  );
}
