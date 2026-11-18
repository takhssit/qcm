import type { Metadata, Viewport } from "next";
import { Atkinson_Hyperlegible } from "next/font/google";
import "./globals.css";

const atkinson = Atkinson_Hyperlegible({
  weight: ["400", "700"],
  subsets: ["latin"],
  variable: "--font-atkinson",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Pédagogie moderne — QCM",
  description:
    "Entraînement au concours de promotion interne : 324 questions de pédagogie moderne avec correction expliquée, examens blancs et suivi de progression.",
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  themeColor: "#172041",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className={`${atkinson.variable} antialiased`}>
      <body className="min-h-dvh">{children}</body>
    </html>
  );
}
