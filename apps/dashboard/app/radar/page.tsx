import { clsx } from 'clsx';

type Decision = 'bid' | 'watch' | 'maybe' | 'skip';

interface RadarLot {
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
  saleDate: string;
  estateType: string;
}

const RADAR_LOTS: RadarLot[] = [
  {
    id: 'r1',
    title: 'Rolex Datejust 36mm Stainless Steel Watch Ref 16200',
    category: 'watches',
    currentBid: 1200,
    maxBid: 2800,
    arv: 5500,
    margin: 0.49,
    confidence: 0.85,
    decision: 'bid',
    location: 'Atlanta, GA',
    timeRemaining: '4h 30m',
    lotUrl: 'https://ctbids.com/lot/r1',
    saleDate: 'Jul 27',
    estateType: 'Estate Sale',
  },
  {
    id: 'r2',
    title: 'Signed Warhol Lithograph Limited Edition 42/250',
    category: 'art',
    currentBid: 320,
    maxBid: 900,
    arv: 2200,
    margin: 0.59,
    confidence: 0.72,
    decision: 'bid',
    location: 'Buckhead, GA',
    timeRemaining: '6h 15m',
    lotUrl: 'https://ctbids.com/lot/r2',
    saleDate: 'Jul 27',
    estateType: 'Downsizing',
  },
  {
    id: 'r3',
    title: 'Antique Persian Tabriz Rug 9x12 Hand-Knotted',
    category: 'rugs_textiles',
    currentBid: 450,
    maxBid: 820,
    arv: 1800,
    margin: 0.44,
    confidence: 0.68,
    decision: 'watch',
    location: 'Sandy Springs, GA',
    timeRemaining: '1d 2h',
    lotUrl: 'https://ctbids.com/lot/r3',
    saleDate: 'Jul 28',
    estateType: 'Estate Sale',
  },
  {
    id: 'r4',
    title: 'Pair Tiffany & Co Elsa Peretti Sterling Candlesticks',
    category: 'silver',
    currentBid: 180,
    maxBid: 440,
    arv: 900,
    margin: 0.51,
    confidence: 0.91,
    decision: 'bid',
    location: 'Dunwoody, GA',
    timeRemaining: '3h 45m',
    lotUrl: 'https://ctbids.com/lot/r4',
    saleDate: 'Jul 27',
    estateType: 'Estate Liquidation',
  },
  {
    id: 'r5',
    title: 'MCM Eames Lounge Chair & Ottoman Herman Miller Original',
    category: 'furniture',
    currentBid: 800,
    maxBid: 1400,
    arv: 3200,
    margin: 0.56,
    confidence: 0.79,
    decision: 'bid',
    location: 'Decatur, GA',
    timeRemaining: '8h 00m',
    lotUrl: 'https://ctbids.com/lot/r5',
    saleDate: 'Jul 27',
    estateType: 'Estate Sale',
  },
  {
    id: 'r6',
    title: 'Vintage Leica M6 35mm Rangefinder Camera Body',
    category: 'cameras',
    currentBid: 620,
    maxBid: 750,
    arv: 1100,
    margin: 0.18,
    confidence: 0.74,
    decision: 'maybe',
    location: 'Marietta, GA',
    timeRemaining: '12h 20m',
    lotUrl: 'https://ctbids.com/lot/r6',
    saleDate: 'Jul 27',
    estateType: 'Collector Estate',
  },
];

const DECISION_COLORS: Record<Decision, string> = {
  bid:   'border-l-emerald-500',
  watch: 'border-l-blue-500',
  maybe: 'border-l-yellow-500',
  skip:  'border-l-red-500',
};

const BADGE: Record<Decision, string> = {
  bid:   'bg-emerald-900/60 text-emerald-300 border-emerald-700',
  watch: 'bg-blue-900/60 text-blue-300 border-blue-700',
  maybe: 'bg-yellow-900/60 text-yellow-300 border-yellow-700',
  skip:  'bg-red-900/60 text-red-300 border-red-700',
};

function RadarRow({ lot }: { lot: RadarLot }) {
  const spread = Math.round(lot.margin * 100);
  const confPct = Math.round(lot.confidence * 100);
  return (
    <a
      href={lot.lotUrl}
      target="_blank"
      rel="noopener noreferrer"
      className={clsx(
        'grid grid-cols-12 gap-3 items-center px-4 py-3 rounded-lg border border-zinc-800 border-l-4 bg-zinc-900 hover:bg-zinc-800 transition-colors text-sm',
        DECISION_COLORS[lot.decision]
      )}
    >
      <div className="col-span-4">
        <p className="font-semibold text-zinc-100 leading-snug">{lot.title}</p>
        <p className="text-zinc-500 text-xs mt-0.5">{lot.category.replace(/_/g, ' ')} &middot; {lot.estateType}</p>
      </div>
      <div className="col-span-1 text-center">
        <span className={clsx('px-2 py-0.5 rounded text-xs font-bold uppercase border', BADGE[lot.decision])}>
          {lot.decision}
        </span>
      </div>
      <div className="col-span-1 text-right font-mono text-zinc-300">${lot.currentBid.toLocaleString()}</div>
      <div className={clsx('col-span-1 text-right font-mono font-bold', lot.maxBid > lot.currentBid ? 'text-emerald-400' : 'text-red-400')}>
        ${lot.maxBid.toLocaleString()}
      </div>
      <div className="col-span-1 text-right font-mono text-zinc-400">${lot.arv.toLocaleString()}</div>
      <div className={clsx('col-span-1 text-right font-semibold', spread > 30 ? 'text-emerald-400' : spread > 0 ? 'text-yellow-400' : 'text-red-400')}>
        +{spread}%
      </div>
      <div className="col-span-1 text-right">
        <div className="flex items-center justify-end gap-1">
          <div className="h-1.5 w-12 bg-zinc-700 rounded-full overflow-hidden">
            <div className="h-full bg-orange-400 rounded-full" style={{ width: `${confPct}%` }} />
          </div>
          <span className="text-zinc-500 text-xs">{confPct}%</span>
        </div>
      </div>
      <div className="col-span-1 text-right text-zinc-400">{lot.timeRemaining}</div>
      <div className="col-span-1 text-right text-zinc-500 text-xs">{lot.location}</div>
    </a>
  );
}

export default function RadarPage() {
  const bids = RADAR_LOTS.filter(l => l.decision === 'bid');
  const others = RADAR_LOTS.filter(l => l.decision !== 'bid');
  const totalSpread = RADAR_LOTS
    .filter(l => l.decision === 'bid')
    .reduce((sum, l) => sum + (l.arv - l.currentBid), 0);

  return (
    <div className="space-y-8">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-100">Radar Board</h1>
          <p className="text-zinc-500 text-sm mt-1">
            {RADAR_LOTS.length} lots tracked &mdash; {bids.length} active bid opportunities
          </p>
        </div>
        <div className="text-right">
          <p className="text-zinc-500 text-xs uppercase tracking-widest">Total Potential Spread</p>
          <p className="text-2xl font-bold text-emerald-400">
            ${totalSpread.toLocaleString()}
          </p>
        </div>
      </div>

      {/* Table header */}
      <div className="grid grid-cols-12 gap-3 px-4 py-2 text-xs uppercase tracking-widest text-zinc-500">
        <div className="col-span-4">Lot</div>
        <div className="col-span-1 text-center">Signal</div>
        <div className="col-span-1 text-right">Current</div>
        <div className="col-span-1 text-right">Max Bid</div>
        <div className="col-span-1 text-right">ARV</div>
        <div className="col-span-1 text-right">Spread</div>
        <div className="col-span-1 text-right">Conf.</div>
        <div className="col-span-1 text-right">Closes</div>
        <div className="col-span-1 text-right">Location</div>
      </div>

      <div className="space-y-2">
        {bids.map(l => <RadarRow key={l.id} lot={l} />)}
        {others.map(l => <RadarRow key={l.id} lot={l} />)}
      </div>
    </div>
  );
}
