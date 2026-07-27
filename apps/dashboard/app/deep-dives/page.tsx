import { clsx } from 'clsx';

interface DeepDiveLot {
  id: string;
  title: string;
  category: string;
  currentBid: number;
  maxBid: number;
  arv: number;
  margin: number;
  confidence: number;
  location: string;
  lotUrl: string;
  comparables: { title: string; soldPrice: number; source: string; date: string }[];
  resellChannels: { name: string; avgPrice: number; fee: number; netProfit: number }[];
  notes: string;
  shippingMode: 'local_pickup' | 'ships';
  shippingEst: number;
  buyerPremium: number;
}

const DEEP_DIVES: DeepDiveLot[] = [
  {
    id: 'd1',
    title: 'Rolex Datejust 36mm Stainless Steel Watch Ref 16200',
    category: 'watches',
    currentBid: 1200,
    maxBid: 2800,
    arv: 5500,
    margin: 0.49,
    confidence: 0.85,
    location: 'Atlanta, GA',
    lotUrl: 'https://ctbids.com/lot/r1',
    shippingMode: 'ships',
    shippingEst: 45,
    buyerPremium: 0.18,
    comparables: [
      { title: 'Rolex Datejust 16200 Steel', soldPrice: 4800, source: 'eBay', date: 'Jun 2026' },
      { title: 'Rolex Datejust 36 Ref 16200 Box/Papers', soldPrice: 6200, source: 'Chrono24', date: 'May 2026' },
      { title: 'Rolex Datejust 16200 No Papers', soldPrice: 4200, source: 'WatchBox', date: 'Jul 2026' },
    ],
    resellChannels: [
      { name: 'eBay', avgPrice: 4800, fee: 0.13, netProfit: 1834 },
      { name: 'Chrono24', avgPrice: 5200, fee: 0.065, netProfit: 2350 },
      { name: 'Local/Facebook', avgPrice: 4200, fee: 0.03, netProfit: 1740 },
    ],
    notes: 'Strong demand for ref 16200 in steel. No-papers examples still trading well above $4k. Buyer premium + shipping adds ~$261 to cost basis at max bid. Best exit: Chrono24 listing at $5,200.',
  },
  {
    id: 'd2',
    title: 'MCM Eames Lounge Chair & Ottoman Herman Miller Original',
    category: 'furniture',
    currentBid: 800,
    maxBid: 1400,
    arv: 3200,
    margin: 0.56,
    confidence: 0.79,
    location: 'Decatur, GA',
    lotUrl: 'https://ctbids.com/lot/r5',
    shippingMode: 'local_pickup',
    shippingEst: 0,
    buyerPremium: 0.18,
    comparables: [
      { title: 'Herman Miller Eames Lounge 670/671 Black', soldPrice: 2800, source: 'eBay', date: 'Jul 2026' },
      { title: 'Eames Lounge Chair Santos Rosewood', soldPrice: 3800, source: '1stDibs', date: 'Jun 2026' },
      { title: 'HM Eames Lounge Chair Walnut', soldPrice: 2400, source: 'Chairish', date: 'May 2026' },
    ],
    resellChannels: [
      { name: 'eBay', avgPrice: 2800, fee: 0.13, netProfit: 1034 },
      { name: '1stDibs', avgPrice: 3500, fee: 0.20, netProfit: 1548 },
      { name: 'Chairish', avgPrice: 2600, fee: 0.20, netProfit: 1348 },
      { name: 'Facebook Marketplace', avgPrice: 2200, fee: 0.0, netProfit: 1148 },
    ],
    notes: 'Local pickup only in Decatur — need van or truck. Original HM label adds ~15% premium. Condition critical: check ottoman base and leather cracks. Best exit: 1stDibs if rosewood shell.',
  },
];

function CompsTable({ comps }: { comps: DeepDiveLot['comparables'] }) {
  return (
    <div className="rounded-lg border border-zinc-800 overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-zinc-800/50 text-zinc-400 text-xs uppercase tracking-wider">
            <th className="px-4 py-2 text-left">Comparable</th>
            <th className="px-4 py-2 text-right">Sold</th>
            <th className="px-4 py-2 text-right">Source</th>
            <th className="px-4 py-2 text-right">Date</th>
          </tr>
        </thead>
        <tbody>
          {comps.map((c, i) => (
            <tr key={i} className="border-t border-zinc-800">
              <td className="px-4 py-2 text-zinc-300">{c.title}</td>
              <td className="px-4 py-2 text-right font-mono text-emerald-400">${c.soldPrice.toLocaleString()}</td>
              <td className="px-4 py-2 text-right text-zinc-500">{c.source}</td>
              <td className="px-4 py-2 text-right text-zinc-500">{c.date}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ChannelsTable({ channels, costBasis }: { channels: DeepDiveLot['resellChannels']; costBasis: number }) {
  const best = channels.reduce((a, b) => a.netProfit > b.netProfit ? a : b);
  return (
    <div className="rounded-lg border border-zinc-800 overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-zinc-800/50 text-zinc-400 text-xs uppercase tracking-wider">
            <th className="px-4 py-2 text-left">Channel</th>
            <th className="px-4 py-2 text-right">Avg Sale</th>
            <th className="px-4 py-2 text-right">Fee</th>
            <th className="px-4 py-2 text-right">Net Profit</th>
            <th className="px-4 py-2 text-right">ROI</th>
          </tr>
        </thead>
        <tbody>
          {channels.map((ch, i) => {
            const roi = Math.round((ch.netProfit / costBasis) * 100);
            const isBest = ch.name === best.name;
            return (
              <tr key={i} className={clsx('border-t border-zinc-800', isBest && 'bg-emerald-950/30')}>
                <td className="px-4 py-2">
                  <span className="text-zinc-300">{ch.name}</span>
                  {isBest && <span className="ml-2 text-xs text-emerald-400 font-semibold">Best exit</span>}
                </td>
                <td className="px-4 py-2 text-right font-mono text-zinc-300">${ch.avgPrice.toLocaleString()}</td>
                <td className="px-4 py-2 text-right text-zinc-500">{Math.round(ch.fee * 100)}%</td>
                <td className={clsx('px-4 py-2 text-right font-mono font-bold', ch.netProfit > 0 ? 'text-emerald-400' : 'text-red-400')}>
                  ${ch.netProfit.toLocaleString()}
                </td>
                <td className={clsx('px-4 py-2 text-right font-semibold', roi > 0 ? 'text-emerald-400' : 'text-red-400')}>
                  {roi}%
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function DeepDiveCard({ lot }: { lot: DeepDiveLot }) {
  const costBasis = Math.round(lot.maxBid * (1 + lot.buyerPremium) + lot.shippingEst);
  const spreadPct = Math.round(lot.margin * 100);
  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-6 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-zinc-100">{lot.title}</h2>
          <p className="text-zinc-500 text-sm mt-1">{lot.category.replace(/_/g, ' ')} &middot; {lot.location}</p>
        </div>
        <div className="text-right shrink-0">
          <p className="text-xs text-zinc-500 uppercase tracking-widest">Spread</p>
          <p className="text-3xl font-bold text-emerald-400">+{spreadPct}%</p>
        </div>
      </div>

      {/* Key metrics */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: 'Current Bid', value: `$${lot.currentBid.toLocaleString()}`, color: 'text-zinc-100' },
          { label: 'Max Bid', value: `$${lot.maxBid.toLocaleString()}`, color: 'text-emerald-400' },
          { label: 'Est. ARV', value: `$${lot.arv.toLocaleString()}`, color: 'text-zinc-100' },
          { label: 'Cost Basis', value: `$${costBasis.toLocaleString()}`, color: 'text-orange-400' },
        ].map(m => (
          <div key={m.label} className="bg-zinc-800/50 rounded-lg p-3">
            <p className="text-zinc-500 text-xs mb-1">{m.label}</p>
            <p className={clsx('font-mono font-bold text-lg', m.color)}>{m.value}</p>
          </div>
        ))}
      </div>

      {/* Comparables */}
      <div>
        <h3 className="text-sm font-semibold text-zinc-400 uppercase tracking-widest mb-3">Market Comparables</h3>
        <CompsTable comps={lot.comparables} />
      </div>

      {/* Resell channels */}
      <div>
        <h3 className="text-sm font-semibold text-zinc-400 uppercase tracking-widest mb-3">Resell Channels</h3>
        <ChannelsTable channels={lot.resellChannels} costBasis={costBasis} />
      </div>

      {/* Notes */}
      <div className="bg-zinc-800/40 rounded-lg p-4">
        <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-widest mb-2">Analyst Notes</h3>
        <p className="text-zinc-300 text-sm leading-relaxed">{lot.notes}</p>
      </div>

      <a
        href={lot.lotUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-block px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold rounded-lg transition-colors"
      >
        View on CTBids &rarr;
      </a>
    </div>
  );
}

export default function DeepDivesPage() {
  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-2xl font-bold text-zinc-100">Deep Dives</h1>
        <p className="text-zinc-500 text-sm mt-1">
          Full valuation analysis with comparables, resell channels, and cost basis for top-priority lots.
        </p>
      </div>
      {DEEP_DIVES.map(lot => (
        <DeepDiveCard key={lot.id} lot={lot} />
      ))}
    </div>
  );
}
