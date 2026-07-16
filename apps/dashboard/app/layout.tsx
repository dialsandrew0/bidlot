import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'bidlot — Auction Intelligence OS',
  description: 'Estate sale triage, max-bid scoring, and niche valuation for serious buyers.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-zinc-950 text-zinc-100">
        <nav className="border-b border-zinc-800 px-6 py-4 flex items-center gap-6">
          <span className="font-bold text-xl tracking-tight text-orange-400">bidlot</span>
          <a href="/" className="text-sm text-zinc-400 hover:text-white">Inbox</a>
          <a href="/radar" className="text-sm text-zinc-400 hover:text-white">Radar</a>
          <a href="/deep-dives" className="text-sm text-zinc-400 hover:text-white">Deep Dives</a>
        </nav>
        <main className="max-w-6xl mx-auto px-4 py-8">{children}</main>
      </body>
    </html>
  );
}
