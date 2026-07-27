// bidlot — Next.js App Router API route
// apps/dashboard/app/api/import/ctbids-watchlist/route.ts
//
// Receives watchlist lots from the Chrome extension,
// scores them, persists to Supabase, and returns scored results.

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '../../../../lib/supabase';

// ---------------------------------------------------------------------------
// Scoring engine (inline — mirrors packages/shared/scoring.ts)
// ---------------------------------------------------------------------------
type ShippingMode = 'shippable' | 'pickup_only' | 'unknown';
type Category =
  | 'fine_jewelry' | 'costume_jewelry' | 'tools' | 'furniture'
  | 'art_decor' | 'auto_parts' | 'media' | 'fashion' | 'unknown';
type Decision = 'bid' | 'watch' | 'maybe' | 'skip';

interface RawLot {
  source: 'ctbids';
  lotUrl: string;
  title: string;
  location: string;
  currentBid: number;
  shippingMode: ShippingMode;
  imageUrl?: string;
  estateType?: string;
  saleDate?: string;
  timeRemaining?: string;
}

interface ScoredLot {
  source: string;
  lotUrl: string;
  title: string;
  category: Category;
  location: string;
  shippingMode: ShippingMode;
  currentBid: number;
  maxBid: number;
  arv: number;
  margin: number;
  confidence: number;
  decision: Decision;
  imageUrl?: string;
  estateType: string;
  saleDate: string;
  timeRemaining: string;
}

const DEFAULTS: Record<Category, {
  arvMult: number; feeRate: number; riskRate: number;
  logisticsS: number; logisticsP: number; profitFloor: number;
}> = {
  fine_jewelry:    { arvMult: 0.35, feeRate: 0.20, riskRate: 0.05, logisticsS: 18, logisticsP: 12, profitFloor: 40 },
  costume_jewelry: { arvMult: 0.18, feeRate: 0.22, riskRate: 0.10, logisticsS: 12, logisticsP:  8, profitFloor: 15 },
  tools:           { arvMult: 0.45, feeRate: 0.18, riskRate: 0.08, logisticsS: 25, logisticsP: 10, profitFloor: 30 },
  furniture:       { arvMult: 0.40, feeRate: 0.20, riskRate: 0.12, logisticsS: 90, logisticsP: 30, profitFloor: 80 },
  art_decor:       { arvMult: 0.30, feeRate: 0.22, riskRate: 0.15, logisticsS: 22, logisticsP: 15, profitFloor: 25 },
  auto_parts:      { arvMult: 0.38, feeRate: 0.20, riskRate: 0.10, logisticsS: 30, logisticsP: 15, profitFloor: 35 },
  media:           { arvMult: 0.20, feeRate: 0.25, riskRate: 0.05, logisticsS: 10, logisticsP:  5, profitFloor: 10 },
  fashion:         { arvMult: 0.25, feeRate: 0.22, riskRate: 0.08, logisticsS: 14, logisticsP:  8, profitFloor: 20 },
  unknown:         { arvMult: 0.25, feeRate: 0.22, riskRate: 0.12, logisticsS: 20, logisticsP: 12, profitFloor: 25 },
};

function clamp(v: number, lo: number, hi: number) { return Math.min(Math.max(v, lo), hi); }

function classify(title: string): Category {
  const t = title.toLowerCase();
  if (/\b(diamond|sapphire|emerald|ruby|14k|18k|gold|platinum|sterling|tiffany|cartier)\b/.test(t)) return 'fine_jewelry';
  if (/\b(necklace|bracelet|earring|ring|brooch|pendant|jewelry|jewellery)\b/.test(t)) return 'costume_jewelry';
  if (/\b(drill|saw|wrench|hammer|socket|dewalt|milwaukee|makita|craftsman|tool)\b/.test(t)) return 'tools';
  if (/\b(sofa|couch|dresser|armoire|cabinet|bookcase|chair|table|desk|furniture)\b/.test(t)) return 'furniture';
  if (/\b(painting|print|sculpture|vase|figurine|pottery|ceramic|art|decor|collectible)\b/.test(t)) return 'art_decor';
  if (/\b(bumper|alternator|carburetor|auto|engine|tire|wheel|rim)\b/.test(t)) return 'auto_parts';
  if (/\b(book|dvd|cd|vinyl|record|comic|magazine|bluray|media)\b/.test(t)) return 'media';
  if (/\b(jacket|coat|dress|shirt|shoes|boots|handbag|purse|fashion|clothing|apparel)\b/.test(t)) return 'fashion';
  return 'unknown';
}

function scoreLot(raw: RawLot): ScoredLot {
  const category = classify(raw.title);
  const d = DEFAULTS[category];
  const arv = raw.currentBid / d.arvMult;
  const fees = arv * d.feeRate;
  const logistics = raw.shippingMode === 'pickup_only' ? d.logisticsP : d.logisticsS;
  const risk = arv * d.riskRate;
  const confidence = clamp(
    0.95 - d.riskRate - (category === 'unknown' ? 0.15 : 0),
    0.40, 0.95
  );
  const maxBid = Math.max(0, (arv * confidence) - fees - logistics - risk - d.profitFloor);
  const spread = maxBid - raw.currentBid;
  const ratio = maxBid > 0 ? spread / maxBid : -1;
  let decision: Decision;
  if (raw.currentBid > maxBid)       decision = 'skip';
  else if (ratio >= 0.25)            decision = 'bid';
  else if (ratio >= 0.10)            decision = 'watch';
  else if (confidence < 0.60)        decision = 'maybe';
  else                               decision = 'maybe';
  const margin = arv > 0 ? (arv - raw.currentBid - fees - logistics - risk) / arv : 0;
  return {
    source: raw.source,
    lotUrl: raw.lotUrl,
    title: raw.title,
    category,
    location: raw.location,
    shippingMode: raw.shippingMode,
    currentBid: raw.currentBid,
    maxBid: Math.round(maxBid * 100) / 100,
    arv: Math.round(arv * 100) / 100,
    margin: Math.round(margin * 10000) / 10000,
    confidence: Math.round(confidence * 1000) / 1000,
    decision,
    imageUrl: raw.imageUrl,
    estateType: raw.estateType ?? '',
    saleDate: raw.saleDate ?? '',
    timeRemaining: raw.timeRemaining ?? '',
  };
}

// ---------------------------------------------------------------------------
// POST /api/import/ctbids-watchlist
// ---------------------------------------------------------------------------
export async function POST(req: NextRequest) {
  // -- Auth: verify the import secret header
  const importSecret = process.env.BIDLOT_IMPORT_SECRET;
  if (importSecret) {
    const token = req.headers.get('x-bidlot-token');
    if (token !== importSecret) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  }

  try {
    const body = await req.json();
    const lots: RawLot[] = body?.lots;

    if (!Array.isArray(lots) || lots.length === 0) {
      return NextResponse.json(
        { error: 'Request body must include a non-empty `lots` array.' },
        { status: 400 }
      );
    }

    // Score all lots
    const scored = lots.map(scoreLot);

    // Persist to Supabase (upsert on lot_url)
    const supabase = createServerClient();
    const rows = scored.map(s => ({
      lot_url:       s.lotUrl,
      source:        s.source,
      title:         s.title,
      category:      s.category,
      shipping_mode: s.shippingMode,
      current_bid:   s.currentBid,
      max_bid:       s.maxBid,
      arv:           s.arv,
      margin:        s.margin,
      confidence:    s.confidence,
      decision:      s.decision,
      location:      s.location,
      estate_type:   s.estateType,
      sale_date:     s.saleDate,
      time_remaining: s.timeRemaining,
      image_url:     s.imageUrl ?? null,
    }));

    const { error: dbError } = await supabase
      .from('lots')
      .upsert(rows, { onConflict: 'lot_url' });

    if (dbError) {
      console.error('[bidlot] Supabase upsert error:', dbError);
      // Don't fail the whole request — still return scored data
    }

    const bids   = scored.filter(l => l.decision === 'bid').length;
    const watches = scored.filter(l => l.decision === 'watch').length;

    return NextResponse.json({
      received: lots.length,
      scored: scored.length,
      persisted: !dbError,
      bids,
      watches,
      lots: scored,
    });
  } catch (err) {
    console.error('[bidlot] Import route error:', err);
    return NextResponse.json(
      { error: 'Internal server error', detail: String(err) },
      { status: 500 }
    );
  }
}
