import { clsx } from 'clsx';

type Decision = 'bid' | 'watch' | 'maybe' | 'skip';

interface ScoredLot {
  id: string;
  title: string;
  category: string;
  currentBid: number;
  maxBid: number;
  arv: number;
  margin: number;
  confidence: number;
  decision: Decision;
  location: string;
  timeRemaining: string;
  lotUrl: string;
  imageUrl?: string;
}

// Seed data for demo — real data comes from the extension API
const SEED_LOTS: ScoredLot[] = [
  {
    id: '1',
    title: 'Vintage 14k Gold Diamond Engagement Ring 1.2ct',
    category: 'fine_jewelry',
    currentBid: 285,
    maxBid: 520,
    arv: 1100,
    margin: 0.52,
    confidence: 0.88,
    decision: 'bid',
    location: 'Scottsdale, AZ',
    timeRemaining: '2h 14m',
    lotUrl: 'https://ctbids.com/lot/example1',
  },
  {
    id: '2',
    title: 'Tiffany & Co Sterling Silver Bracelet',
    category: 'fine_jewelry',
    currentBid: 110,
    maxBid: 180,
    arv: 420,
    margin: 0.39,
    confidence: 0.82,
    decision: 'watch',
    location: 'Naperville, IL',
    timeRemaining: '5h 48m',
    lotUrl: 'https://ctbids.com/lot/example2',
  },
  {
    id: '3',
    title: 'Lenovo ThinkPad X1 Carbon Gen 9 Laptop',
    category: 'electronics',
    currentBid: 480,
    maxBid: 510,
    arv: 900,
    margin: 0.12,
    confidence: 0.71,
    decision: 'maybe',
    location: 'Denver, CO',
    timeRemaining: '1d 3h',
    lotUrl: 'https://ctbids.com/lot/example3',
  },
  {
    id: '4',
    title: 'Assorted Costume Jewelry Lot (50+ pieces)',
    category: 'costume_jewelry',
    currentBid: 95,
    maxBid: 60,
    arv: 180,
    margin: -0.08,
    confidence: 0.55,
    decision: 'skip',
    location: 'Tampa, FL',
    timeRemaining: '3h 22m',
    lotUrl: 'https://ctbids.com/lot/example4',
  },
];

const DECISION_STYLES: Record<Decision, string> = {
  bid:   'bg-emerald-900/60 text-emerald-300 border-emerald-700',
  watch: 'bg-blue-900/60 text-blue-300 border-blue-700',
  maybe: 'bg-yellow-900/60 text-yellow-300 border-yellow-700',
  skip:  'bg-red-900/60 text-red-300 border-red-700',
};

function DecisionBadge({ decision }: { decision: Decision }) {
  return (
    <span className={clsx(
      'px-2 py-0.5 rounded text-xs font-bold uppercase border',
      DECISION_STYLES[decision]
    )}>
      {decision}
    </span>
  );
}

function LotCard({ lot }: { lot: ScoredLot }) {
  const spreadPct = Math.round(lot.margin * 100);
  return (
    <a
      href={lot.lotUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="block rounded-xl border border-zinc-800 bg-zinc-900 hover:border-zinc-600 transition-colors p-5 space-y-3"
    >
      <div className="flex items-start justify-between gap-3">
        <h3 className="font-semibold text-zinc-100 leading-snug flex-1">{lot.title}</h3>
        <DecisionBadge decision={lot.decision} />
      </div>

      <div className="grid grid-cols-3 gap-3 text-sm">
        <div>
          <p className="text-zinc-500 text-xs mb-0.5">Current Bid</p>
          <p className="font-mono font-bold text-zinc-100">${lot.currentBid.toLocaleString()}</p>
        </div>
        <div>
          <p className="text-zinc-500 text-xs mb-0.5">Max Bid</p>
          <p className={clsx('font-mono font-bold', lot.maxBid > lot.currentBid ? 'text-emerald-400' : 'text-red-400')}>
            ${lot.maxBid.toLocaleString()}
          </p>
        </div>
        <div>
          <p className="text-zinc-500 text-xs mb-0.5">Est. ARV</p>
          <p className="font-mono font-bold text-zinc-100">${lot.arv.toLocaleString()}</p>
        </div>
      </div>

      <div className="flex items-center justify-between text-xs text-zinc-500">
        <span>{lot.category.replace(/_/g, ' ')}</span>
        <span>{lot.location}</span>
        <span className={clsx('font-semibold', spreadPct > 0 ? 'text-emerald-400' : 'text-red-400')}>
          {spreadPct > 0 ? '+' : ''}{spreadPct}% spread
        </span>
        <span>Closes {lot.timeRemaining}</span>
      </div>
    </a>
  );
}

export default function InboxPage() {
  const bids   = SEED_LOTS.filter(l => l.decision === 'bid');
  const watches = SEED_LOTS.filter(l => l.decision === 'watch');
  const maybes  = SEED_LOTS.filter(l => l.decision === 'maybe');
  const skips   = SEED_LOTS.filter(l => l.decision === 'skip');

  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-2xl font-bold text-zinc-100">Inbox</h1>
        <p className="text-zinc-500 text-sm mt-1">
          {SEED_LOTS.length} lots scored — install the Chrome extension to import your CTBids watchlist.
        </p>
      </div>

      {bids.length > 0 && (
        <section>
          <h2 className="text-sm font-semibold uppercase tracking-widest text-emerald-400 mb-3">Bid Now ({bids.length})</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {bids.map(l => <LotCard key={l.id} lot={l} />)}
          </div>
        </section>
      )}

      {watches.length > 0 && (
        <section>
          <h2 className="text-sm font-semibold uppercase tracking-widest text-blue-400 mb-3">Watch ({watches.length})</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {watches.map(l => <LotCard key={l.id} lot={l} />)}
          </div>
        </section>
      )}

      {maybes.length > 0 && (
        <section>
          <h2 className="text-sm font-semibold uppercase tracking-widest text-yellow-400 mb-3">Maybe ({maybes.length})</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {maybes.map(l => <LotCard key={l.id} lot={l} />)}
          </div>
        </section>
      )}

      {skips.length > 0 && (
        <section>
          <h2 className="text-sm font-semibold uppercase tracking-widest text-red-400 mb-3">Skip ({skips.length})</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {skips.map(l => <LotCard key={l.id} lot={l} />)}
          </div>
        </section>
      )}
    </div>
  );
}
