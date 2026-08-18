import { clsx } from 'clsx';

type Outcome = 'won' | 'lost' | 'passed';
type Status = 'pending_payment' | 'paid' | 'listed' | 'sold' | 'closed';

interface TrackedLot {
  id: string;
  title: string;
  category: string;
  outcome: Outcome;
  finalBid: number;
  maxBid: number;
  arv: number;
  soldPrice?: number;
  netProfit?: number;
  roi?: number;
  location: string;
  saleDate: string;
  status: Status;
  notes: string;
  lotUrl: string;
}

const TRACKED: TrackedLot[] = [
  {
    id: 't1',
    title: 'Vintage 14k Gold Diamond Engagement Ring 1.2ct',
    category: 'fine_jewelry',
    outcome: 'won',
    finalBid: 310,
    maxBid: 520,
    arv: 1100,
    soldPrice: 875,
    netProfit: 431,
    roi: 76,
    location: 'Scottsdale, AZ',
    saleDate: 'Jul 20, 2026',
    status: 'sold',
    notes: 'Sold via eBay in 4 days. Graded as VS1, boosted price.',
    lotUrl: 'https://ctbids.com/lot/example1',
  },
  {
    id: 't2',
    title: 'Tiffany & Co Sterling Silver Bracelet',
    category: 'fine_jewelry',
    outcome: 'won',
    finalBid: 125,
    maxBid: 180,
    arv: 420,
    soldPrice: 310,
    netProfit: 148,
    roi: 61,
    location: 'Naperville, IL',
    saleDate: 'Jul 18, 2026',
    status: 'sold',
    notes: 'Sold Poshmark. Polished before listing, added 12% value.',
    lotUrl: 'https://ctbids.com/lot/example2',
  },
  {
    id: 't3',
    title: 'Lenovo ThinkPad X1 Carbon Gen 9',
    category: 'electronics',
    outcome: 'lost',
    finalBid: 0,
    maxBid: 510,
    arv: 900,
    location: 'Denver, CO',
    saleDate: 'Jul 15, 2026',
    status: 'closed',
    notes: 'Outbid at $535 — $25 over my max. Would have been marginal anyway.',
    lotUrl: 'https://ctbids.com/lot/example3',
  },
  {
    id: 't4',
    title: 'Rolex Datejust 36mm Ref 16200',
    category: 'watches',
    outcome: 'won',
    finalBid: 1450,
    maxBid: 2800,
    arv: 5500,
    soldPrice: undefined,
    netProfit: undefined,
    roi: undefined,
    location: 'Atlanta, GA',
    saleDate: 'Jul 27, 2026',
    status: 'paid',
    notes: 'Won well under max bid. Listing on Chrono24 this week.',
    lotUrl: 'https://ctbids.com/lot/r1',
  },
  {
    id: 't5',
    title: 'Assorted Costume Jewelry Lot (50+ pieces)',
    category: 'costume_jewelry',
    outcome: 'passed',
    finalBid: 0,
    maxBid: 60,
    arv: 180,
    location: 'Tampa, FL',
    saleDate: 'Jul 10, 2026',
    status: 'closed',
    notes: 'Deliberately skipped — went to $120, over our ceiling. Right call.',
    lotUrl: 'https://ctbids.com/lot/example4',
  },
];

const OUTCOME_STYLES: Record<Outcome, string> = {
  won:    'bg-emerald-900/60 text-emerald-300 border-emerald-700',
  lost:   'bg-red-900/60 text-red-300 border-red-700',
  passed: 'bg-zinc-800 text-zinc-400 border-zinc-600',
};

const STATUS_LABEL: Record<Status, string> = {
  pending_payment: 'Pending Payment',
  paid:            'Paid — In Hand',
  listed:          'Listed for Sale',
  sold:            'Sold',
  closed:          'Closed',
};

const STATUS_COLOR: Record<Status, string> = {
  pending_payment: 'text-yellow-400',
  paid:            'text-blue-400',
  listed:          'text-orange-400',
  sold:            'text-emerald-400',
  closed:          'text-zinc-500',
};

function StatCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
      <p className="text-zinc-500 text-xs uppercase tracking-widest mb-1">{label}</p>
      <p className="text-2xl font-bold text-zinc-100">{value}</p>
      {sub && <p className="text-zinc-500 text-xs mt-0.5">{sub}</p>}
    </div>
  );
}

export default function WonLostPage() {
  const won    = TRACKED.filter(l => l.outcome === 'won');
  const lost   = TRACKED.filter(l => l.outcome === 'lost');
  const passed = TRACKED.filter(l => l.outcome === 'passed');
  const sold   = TRACKED.filter(l => l.status === 'sold' && l.netProfit !== undefined);

  const totalProfit  = sold.reduce((s, l) => s + (l.netProfit ?? 0), 0);
  const totalInvest  = sold.reduce((s, l) => s + Math.round(l.finalBid * 1.18), 0);
  const avgRoi       = sold.length ? Math.round(sold.reduce((s, l) => s + (l.roi ?? 0), 0) / sold.length) : 0;
  const winRate      = TRACKED.filter(l => l.outcome !== 'passed').length > 0
    ? Math.round((won.length / TRACKED.filter(l => l.outcome !== 'passed').length) * 100)
    : 0;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-zinc-100">Won / Lost</h1>
        <p className="text-zinc-500 text-sm mt-1">Track every bid outcome and real P&amp;L.</p>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard label="Total Net Profit" value={`$${totalProfit.toLocaleString()}`} sub={`${sold.length} lots sold`} />
        <StatCard label="Avg ROI" value={`${avgRoi}%`} sub="on sold lots" />
        <StatCard label="Win Rate" value={`${winRate}%`} sub={`${won.length}W / ${lost.length}L`} />
        <StatCard label="Capital Deployed" value={`$${totalInvest.toLocaleString()}`} sub="incl. buyer premium" />
      </div>

      {/* Lots table */}
      <div className="space-y-3">
        <div className="grid grid-cols-12 gap-3 px-4 py-2 text-xs uppercase tracking-widest text-zinc-500">
          <div className="col-span-4">Lot</div>
          <div className="col-span-1 text-center">Result</div>
          <div className="col-span-1 text-right">Final Bid</div>
          <div className="col-span-1 text-right">Sold For</div>
          <div className="col-span-1 text-right">Net Profit</div>
          <div className="col-span-1 text-right">ROI</div>
          <div className="col-span-2 text-right">Status</div>
          <div className="col-span-1 text-right">Date</div>
        </div>

        {TRACKED.map(lot => (
          <a
            key={lot.id}
            href={lot.lotUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="grid grid-cols-12 gap-3 items-center px-4 py-3 rounded-lg border border-zinc-800 bg-zinc-900 hover:bg-zinc-800 transition-colors text-sm"
          >
            <div className="col-span-4">
              <p className="font-semibold text-zinc-100 leading-snug">{lot.title}</p>
              <p className="text-zinc-500 text-xs mt-0.5">{lot.category.replace(/_/g, ' ')} &middot; {lot.location}</p>
            </div>
            <div className="col-span-1 text-center">
              <span className={clsx('px-2 py-0.5 rounded text-xs font-bold uppercase border', OUTCOME_STYLES[lot.outcome])}>
                {lot.outcome}
              </span>
            </div>
            <div className="col-span-1 text-right font-mono text-zinc-400">
              {lot.finalBid > 0 ? `$${lot.finalBid.toLocaleString()}` : '—'}
            </div>
            <div className="col-span-1 text-right font-mono text-zinc-300">
              {lot.soldPrice ? `$${lot.soldPrice.toLocaleString()}` : '—'}
            </div>
            <div className={clsx('col-span-1 text-right font-mono font-bold',
              lot.netProfit !== undefined ? (lot.netProfit > 0 ? 'text-emerald-400' : 'text-red-400') : 'text-zinc-600'
            )}>
              {lot.netProfit !== undefined ? `$${lot.netProfit.toLocaleString()}` : '—'}
            </div>

            <div className={clsx('col-span-1 text-right font-semibold',
              lot.roi !== undefined ? (lot.roi > 0 ? 'text-emerald-400' : 'text-red-400') : 'text-zinc-600'
            )}>
              {lot.roi !== undefined ? `${lot.roi}%` : '—'}
            </div>
            <div className={clsx('col-span-2 text-right text-xs font-semibold', STATUS_COLOR[lot.status])}>
              {STATUS_LABEL[lot.status]}
            </div>
            <div className="col-span-1 text-right text-zinc-500 text-xs">{lot.saleDate}</div>
          </a>
        ))}
      </div>

      {/* Notes panel for active lots */}
      {won.filter(l => l.status !== 'sold').map(lot => (
        <div key={lot.id} className="rounded-lg border border-blue-800 bg-blue-950/30 p-4">
          <p className="text-xs text-blue-400 font-semibold uppercase tracking-widest mb-1">Action Needed &mdash; {lot.title}</p>
          <p className="text-zinc-300 text-sm">{lot.notes}</p>
        </div>
      ))}
    </div>
  );
}
