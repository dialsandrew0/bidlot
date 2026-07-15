import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "bidlot — Auction Intelligence OS",
  description: "Estate sale triage, max-bid scoring, and niche valuation.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
