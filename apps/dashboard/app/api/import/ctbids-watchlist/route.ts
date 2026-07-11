// bidlot — Next.js App Router API route
// apps/dashboard/app/api/import/ctbids-watchlist/route.ts
// Receives watchlist lots from the Chrome extension,
// scores them, and persists to the database.

import { NextRequest, NextResponse } from "next/server";

// -------------------------------------------------------
// Inline scoring (mirrors packages/shared/scoring.ts)
// In production import from the shared package directly.
// -------------------------------------------------------
type ShippingMode = "shippable" | "pickup_only" | "unknown";
type Category =
  | "fine_jewelry" | "costume_jewelry" | "tools" | "furniture"
  | "art_decor" | "auto_parts" | "media" | "fashion" | "unknown";
type Decision = "bid" | "watch" | "maybe" | "skip";

interface RawLot {
  source: "ctbids";
  lotUrl: string;
  title: string;
  location: string;
  postalCode?: string;
  shippingMode: ShippingMode;
  currentBid: number;
  currency: "USD";
  timeRemainingSeconds: number;
  watchlistCapturedAt: string;
}

interface ScoredLot extends RawLot {
  category: Category;
  estimatedARV: number;
  confidence: number;
  fees: number;
  logistics: number;
  risk: number;
  profitFloor: number;
  maxBid: number;
  spreadToBid: number;
  decision: Decision;
  reasons: string[];
  scoredAt: string;
}

const DEFAULTS: Record<Category, { confidence: number; feeRate: number; riskRate: number; profitRate: number; logisticsS: number; logisticsP: number }> = {
  fine_jewelry:    { confidence: 0.88, feeRate: 0.13, riskRate: 0.10, profitRate: 0.22, logisticsS: 12, logisticsP: 25 },
  costume_jewelry: { confidence: 0.58, feeRate: 0.15, riskRate: 0.24, profitRate: 0.28, logisticsS: 10, logisticsP: 22 },
  tools:           { confidence: 0.70, feeRate: 0.14, riskRate: 0.16, profitRate: 0.24, logisticsS: 18, logisticsP: 45 },
  furniture:       { confidence: 0.55, feeRate: 0.12, riskRate: 0.26, profitRate: 0.30, logisticsS: 25, logisticsP: 80 },
  art_decor:       { confidence: 0.60, feeRate: 0.14, riskRate: 0.20, profitRate: 0.25, logisticsS: 16, logisticsP: 35 },
  auto_parts:      { confidence: 0.68, feeRate: 0.14, riskRate: 0.20, profitRate: 0.25, logisticsS: 20, logisticsP: 50 },
  media:           { confidence: 0.64, feeRate: 0.15, riskRate: 0.16, profitRate: 0.22, logisticsS: 10, logisticsP: 25 },
  fashion:         { confidence: 0.52, feeRate: 0.15, riskRate: 0.22, profitRate: 0.25, logisticsS: 12, logisticsP: 28 },
  unknown:         { confidence: 0.40, feeRate: 0.15, riskRate: 0.35, profitRate: 0.30, logisticsS: 15, logisticsP: 35 },
};

function classify(title: string): Category {
  const t = title.toLowerCase();
  if (/14k|10k|karat|diamond|ring|pendant|necklace|gold|sterling/.test(t)) return "fine_jewelry";
  if (/costume jewelry|brooch|rhinestone/.test(t)) return "costume_jewelry";
  if (/drill press|matco|tools|abrasive|spray gun|wrench|saw|compressor/.test(t)) return "tools";
  if (/chair|sofa|tv on stand|stereo system|bed|dresser|furniture/.test(t)) return "furniture";
  if (/clock|lamp|lighting|flood light|decor|frame|mirror|figurine/.test(t)) return "art_decor";
  if (/ford|mustang|torino|automotive|gasket|fuel system|timing set|cluster|racing/.test(t)) return "auto_parts";
  if (/vinyl|album|cassette|book|beatles|record|cd|dvd|vhs|stamp/.test(t)) return "media";
  if (/purse|dress|clothing|briefcase|handbag|shoes|jacket/.test(t)) return "fashion";
  return "unknown";
}

function clamp(v: number, min: number, max: number) { return Math.min(max, Math.max(min, v)); }

function scoreLot(raw: RawLot): ScoredLot {
  const reasons: string[] = [];
  let cat = classify(raw.title);
  if (/14k|10k|sterling|solid gold/.test(raw.title.toLowerCase())) { cat = "fine_jewelry"; reasons.push("Precious metal detected."); }

  const d = DEFAULTS[cat];
  const arv = 120; // stub — replace with LLM call
  let confidence = d.confidence;
  let riskRate = d.riskRate;

  if (/matco|ford|mustang|beatles|pyramid|samsung/.test(raw.title.toLowerCase())) { confidence += 0.08; reasons.push("Brand signal detected."); }
  if (/assortment|miscellaneous|various|mystery/.test(raw.title.toLowerCase())) { confidence -= 0.14; riskRate += 0.10; reasons.push("Vague bundle."); }
  if (raw.shippingMode === "pickup_only") reasons.push("Pickup-only — logistics penalty.");
  if (raw.timeRemainingSeconds < 86400) reasons.push("Closing in < 24h.");

  confidence = clamp(confidence, 0.20, 0.95);
  const fees = arv * d.feeRate;
  const logistics = raw.shippingMode === "pickup_only" ? d.logisticsP : d.logisticsS;
  const risk = arv * riskRate;
  const profitFloor = arv * d.profitRate;
  const maxBid = Math.max(0, Number(((arv * confidence) - fees - logistics - risk - profitFloor).toFixed(2)));
  const spreadToBid = Number((maxBid - raw.currentBid).toFixed(2));
  const ratio = maxBid > 0 ? spreadToBid / maxBid : -1;

  let decision: Decision = "maybe";
  if (raw.currentBid > maxBid) { decision = "skip"; reasons.push("Bid exceeds max."); }
  else if (confidence < 0.60) { decision = "maybe"; reasons.push("Low confidence."); }
  else if (ratio >= 0.25) { decision = "bid"; reasons.push("Strong margin."); }
  else if (ratio >= 0.10) { decision = "watch"; reasons.push("Moderate margin."); }
  else { decision = "maybe"; reasons.push("Thin margin."); }

  return { ...raw, category: cat, estimatedARV: arv, confidence, fees, logistics, risk, profitFloor, maxBid, spreadToBid, decision, reasons, scoredAt: new Date().toISOString() };
}

// -------------------------------------------------------
// POST /api/import/ctbids-watchlist
// -------------------------------------------------------
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const lots: RawLot[] = Array.isArray(body.lots) ? body.lots : [];

    if (lots.length === 0) {
      return NextResponse.json({ error: "No lots provided" }, { status: 400 });
    }

    const scored = lots.map(scoreLot);

    // TODO: persist scored lots to Supabase
    // await supabase.from('lots').upsert(scored, { onConflict: 'lotUrl' });

    const bidCount = scored.filter((l) => l.decision === "bid").length;
    const watchCount = scored.filter((l) => l.decision === "watch").length;

    return NextResponse.json({
      received: lots.length,
      scored: scored.length,
      queued: bidCount + watchCount,
      bid: bidCount,
      watch: watchCount,
      errors: [],
      lots: scored, // return scored lots so dashboard can render immediately
    });
  } catch (err) {
    console.error("[bidlot] import error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
