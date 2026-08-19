import { NextRequest, NextResponse } from "next/server";

import {
  bidLotToDealInput,
  mapDecision,
  runIntelligence,
  type BidLotImport,
} from "@andysd/intelligence-core";

import { createServerClient } from "../../../../lib/supabase";

export const runtime = "nodejs";

type ShippingMode =
  | "shippable"
  | "pickup_only"
  | "unknown";

type Category =
  | "fine_jewelry"
  | "costume_jewelry"
  | "tools"
  | "furniture"
  | "art_decor"
  | "auto_parts"
  | "media"
  | "fashion"
  | "unknown";

type LegacyDecision =
  | "bid"
  | "watch"
  | "maybe"
  | "skip";

interface RawLot {
  source: "ctbids";
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

interface LegacyScoredLot {
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
  decision: LegacyDecision;
  imageUrl?: string;
  estateType: string;
  saleDate: string;
  timeRemaining: string;
}

interface IntelligenceScoredLot
  extends LegacyScoredLot {
  intelligence: ReturnType<typeof runIntelligence>;
}

/*
 * Legacy category classifier.
 *
 * This remains intentionally conservative. The Intelligence Core
 * does not use this classification as proof of market value.
 */
function classify(title: string): Category {
  const t = title.toLowerCase();

  if (
    /\b(diamond|sapphire|emerald|ruby|14k|18k|gold|platinum|sterling|tiffany|cartier)\b/.test(
      t,
    )
  ) {
    return "fine_jewelry";
  }

  if (
    /\b(necklace|bracelet|earring|ring|brooch|pendant|jewelry|jewellery)\b/.test(
      t,
    )
  ) {
    return "costume_jewelry";
  }

  if (
    /\b(drill|saw|wrench|hammer|socket|dewalt|milwaukee|makita|craftsman|tool)\b/.test(
      t,
    )
  ) {
    return "tools";
  }

  if (
    /\b(sofa|couch|dresser|armoire|cabinet|bookcase|chair|table|desk|furniture)\b/.test(
      t,
    )
  ) {
    return "furniture";
  }

  if (
    /\b(painting|print|sculpture|vase|figurine|pottery|ceramic|art|decor|collectible)\b/.test(
      t,
    )
  ) {
    return "art_decor";
  }

  if (
    /\b(bumper|alternator|carburetor|auto|engine|tire|wheel|rim)\b/.test(
      t,
    )
  ) {
    return "auto_parts";
  }

  if (
    /\b(book|dvd|cd|vinyl|record|comic|magazine|bluray|media)\b/.test(
      t,
    )
  ) {
    return "media";
  }

  if (
    /\b(jacket|coat|dress|shirt|shoes|boots|handbag|purse|fashion|clothing|apparel)\b/.test(
      t,
    )
  ) {
    return "fashion";
  }

  return "unknown";
}

/*
 * Legacy scoring is retained only for backwards compatibility
 * with the existing dashboard/extension response shape.
 *
 * The AndySD Intelligence Core is now the authoritative
 * intelligence result.
 */
const LEGACY_DEFAULTS: Record<
  Category,
  {
    arvMult: number;
    feeRate: number;
    riskRate: number;
    logisticsS: number;
    logisticsP: number;
    profitFloor: number;
  }
> = {
  fine_jewelry: {
    arvMult: 0.35,
    feeRate: 0.2,
    riskRate: 0.05,
    logisticsS: 18,
    logisticsP: 12,
    profitFloor: 40,
  },
  costume_jewelry: {
    arvMult: 0.18,
    feeRate: 0.22,
    riskRate: 0.1,
    logisticsS: 12,
    logisticsP: 8,
    profitFloor: 15,
  },
  tools: {
    arvMult: 0.45,
    feeRate: 0.18,
    riskRate: 0.08,
    logisticsS: 25,
    logisticsP: 10,
    profitFloor: 30,
  },
  furniture: {
    arvMult: 0.4,
    feeRate: 0.2,
    riskRate: 0.12,
    logisticsS: 90,
    logisticsP: 30,
    profitFloor: 80,
  },
  art_decor: {
    arvMult: 0.3,
    feeRate: 0.22,
    riskRate: 0.15,
    logisticsS: 22,
    logisticsP: 15,
    profitFloor: 25,
  },
  auto_parts: {
    arvMult: 0.38,
    feeRate: 0.2,
    riskRate: 0.1,
    logisticsS: 30,
    logisticsP: 15,
    profitFloor: 35,
  },
  media: {
    arvMult: 0.2,
    feeRate: 0.25,
    riskRate: 0.05,
    logisticsS: 10,
    logisticsP: 5,
    profitFloor: 10,
  },
  fashion: {
    arvMult: 0.25,
    feeRate: 0.22,
    riskRate: 0.08,
    logisticsS: 14,
    logisticsP: 8,
    profitFloor: 20,
  },
  unknown: {
    arvMult: 0.25,
    feeRate: 0.22,
    riskRate: 0.12,
    logisticsS: 20,
    logisticsP: 12,
    profitFloor: 25,
  },
};

function clamp(
  value: number,
  min: number,
  max: number,
): number {
  return Math.min(
    Math.max(value, min),
    max,
  );
}

function legacyScoreLot(
  raw: RawLot,
): LegacyScoredLot {
  const category = classify(raw.title);
  const defaults =
    LEGACY_DEFAULTS[category];

  const currentBid = Number.isFinite(
    raw.currentBid,
  )
    ? Math.max(0, raw.currentBid)
    : 0;

  const arv =
    defaults.arvMult > 0
      ? currentBid / defaults.arvMult
      : 0;

  const fees =
    arv * defaults.feeRate;

  const logistics =
    raw.shippingMode === "pickup_only"
      ? defaults.logisticsP
      : defaults.logisticsS;

  const risk =
    arv * defaults.riskRate;

  const confidence = clamp(
    0.95 -
      defaults.riskRate -
      (category === "unknown"
        ? 0.15
        : 0),
    0.4,
    0.95,
  );

  const maxBid = Math.max(
    0,
    arv * confidence -
      fees -
      logistics -
      risk -
      defaults.profitFloor,
  );

  const spread =
    maxBid - currentBid;

  const ratio =
    maxBid > 0
      ? spread / maxBid
      : -1;

  let decision: LegacyDecision;

  if (currentBid > maxBid) {
    decision = "skip";
  } else if (ratio >= 0.25) {
    decision = "bid";
  } else if (ratio >= 0.1) {
    decision = "watch";
  } else {
    decision = "maybe";
  }

  const margin =
    arv > 0
      ? (
          arv -
          currentBid -
          fees -
          logistics -
          risk
        ) / arv
      : 0;

  return {
    source: raw.source,
    lotUrl: raw.lotUrl,
    title: raw.title,
    category,
    location: raw.location,
    shippingMode: raw.shippingMode,
    currentBid,
    maxBid:
      Math.round(maxBid * 100) / 100,
    arv:
      Math.round(arv * 100) / 100,
    margin:
      Math.round(margin * 10000) /
      10000,
    confidence:
      Math.round(confidence * 1000) /
      1000,
    decision,
    imageUrl: raw.imageUrl,
    estateType:
      raw.estateType ?? "",
    saleDate:
      raw.saleDate ?? "",
    timeRemaining:
      raw.timeRemaining ?? "",
  };
}

function normalizeRawLot(
  value: unknown,
): RawLot | null {
  if (
    typeof value !== "object" ||
    value === null
  ) {
    return null;
  }

  const candidate =
    value as Record<string, unknown>;

  if (
    typeof candidate.lotUrl !== "string" ||
    candidate.lotUrl.trim() === ""
  ) {
    return null;
  }

  if (
    typeof candidate.title !== "string" ||
    candidate.title.trim() === ""
  ) {
    return null;
  }

  if (
    typeof candidate.location !== "string"
  ) {
    return null;
  }

  const currentBid =
    typeof candidate.currentBid ===
    "number"
      ? candidate.currentBid
      : Number(candidate.currentBid);

  if (!Number.isFinite(currentBid)) {
    return null;
  }

  const shippingMode =
    candidate.shippingMode ===
      "shippable" ||
    candidate.shippingMode ===
      "pickup_only" ||
    candidate.shippingMode ===
      "unknown"
      ? candidate.shippingMode
      : "unknown";

  return {
    source: "ctbids",
    lotUrl:
      candidate.lotUrl.trim(),
    title:
      candidate.title.trim(),
    location:
      candidate.location.trim(),
    currentBid:
      Math.max(0, currentBid),
    shippingMode,
    imageUrl:
      typeof candidate.imageUrl ===
      "string"
        ? candidate.imageUrl
        : undefined,
    estateType:
      typeof candidate.estateType ===
      "string"
        ? candidate.estateType
        : undefined,
    saleDate:
      typeof candidate.saleDate ===
      "string"
        ? candidate.saleDate
        : undefined,
    timeRemaining:
      typeof candidate.timeRemaining ===
      "string"
        ? candidate.timeRemaining
        : undefined,
  };
}

function toBidLotImport(
  lot: RawLot,
): BidLotImport {
  return {
    source: "ctbids",
    lotUrl: lot.lotUrl,
    title: lot.title,
    location: lot.location,
    currentBid: lot.currentBid,
    shippingMode: lot.shippingMode,
    imageUrl: lot.imageUrl,
    estateType: lot.estateType,
    saleDate: lot.saleDate,
    timeRemaining: lot.timeRemaining,
  };
}

function buildIntelligenceLot(
  raw: RawLot,
): IntelligenceScoredLot {
  const legacy =
    legacyScoreLot(raw);

  const deal =
    bidLotToDealInput(
      toBidLotImport(raw),
    );

  const intelligence =
    runIntelligence(deal);

  const mapped =
    mapDecision(
      intelligence.decision.decision,
    );

  /*
   * The new engine is authoritative for the decision.
   * Legacy values remain available so existing consumers
   * do not break during migration.
   */
  return {
    ...legacy,

    decision:
      mapped.bidlotDecision,

    maxBid:
      Math.round(
        intelligence.decision.economics
          .maxBuyPrice.amount * 100,
      ) / 100,

    arv:
      Math.round(
        intelligence.decision.valuation
          .midpoint.amount * 100,
      ) / 100,

    margin:
      intelligence.decision.economics
        .expectedSalePrice.amount > 0
        ? intelligence.decision.economics
            .expectedNetProfit.amount /
          intelligence.decision.economics
            .expectedSalePrice.amount
        : 0,

    confidence:
      intelligence.decision.valuation
        .confidence,

    intelligence,
  };
}

export async function POST(
  req: NextRequest,
) {
  const importSecret =
    process.env.BIDLOT_IMPORT_SECRET;

  if (importSecret) {
    const token =
      req.headers.get(
        "x-bidlot-token",
      );

    if (
      token !== importSecret
    ) {
      return NextResponse.json(
        {
          error: "Unauthorized",
        },
        {
          status: 401,
        },
      );
    }
  }

  try {
    const body: unknown =
      await req.json();

    if (
      typeof body !== "object" ||
      body === null ||
      !Array.isArray(
        (body as Record<string, unknown>)
          .lots,
      )
    ) {
      return NextResponse.json(
        {
          error:
            "Request body must include a non-empty `lots` array.",
        },
        {
          status: 400,
        },
      );
    }

    const rawLots =
      (
        body as Record<
          string,
          unknown
        >
      ).lots as unknown[];

    if (rawLots.length === 0) {
      return NextResponse.json(
        {
          error:
            "Request body must include a non-empty `lots` array.",
        },
        {
          status: 400,
        },
      );
    }

    const validLots: RawLot[] = [];
    const rejectedLots: Array<{
      index: number;
      reason: string;
    }> = [];

    rawLots.forEach(
      (candidate, index) => {
        const normalized =
          normalizeRawLot(
            candidate,
          );

        if (!normalized) {
          rejectedLots.push({
            index,
            reason:
              "Invalid CTBids lot payload.",
          });
          return;
        }

        validLots.push(
          normalized,
        );
      },
    );

    if (validLots.length === 0) {
      return NextResponse.json(
        {
          error:
            "No valid lots were supplied.",
          rejectedLots,
        },
        {
          status: 400,
        },
      );
    }

    const scored =
      validLots.map(
        buildIntelligenceLot,
      );

    const supabase =
      createServerClient();

    const rows = scored.map(
      (lot) => ({
        lot_url:
          lot.lotUrl,
        source:
          lot.source,
        title:
          lot.title,
        category:
          lot.category,
        shipping_mode:
          lot.shippingMode,
        current_bid:
          lot.currentBid,
        max_bid:
          lot.maxBid,
        arv:
          lot.arv,
        margin:
          lot.margin,
        confidence:
          lot.confidence,
        decision:
          lot.decision,
        location:
          lot.location,
        estate_type:
          lot.estateType,
        sale_date:
          lot.saleDate,
        time_remaining:
          lot.timeRemaining,
        image_url:
          lot.imageUrl ?? null,
      }),
    );

    const {
      error: dbError,
    } = await supabase
      .from("lots")
      .upsert(
        rows,
        {
          onConflict:
            "lot_url",
        },
      );

    if (dbError) {
      console.error(
        "[bidlot] Supabase upsert error:",
        dbError,
      );
    }

    const bids =
      scored.filter(
        (lot) =>
          lot.decision === "bid",
      ).length;

    const watches =
      scored.filter(
        (lot) =>
          lot.decision === "watch",
      ).length;

    const maybe =
      scored.filter(
        (lot) =>
          lot.decision === "maybe",
      ).length;

    const skips =
      scored.filter(
        (lot) =>
          lot.decision === "skip",
      ).length;

    const research =
      scored.filter(
        (lot) =>
          lot.intelligence
            .decision.decision ===
          "RESEARCH",
      ).length;

    return NextResponse.json({
      received:
        rawLots.length,

      accepted:
        validLots.length,

      rejected:
        rejectedLots.length,

      scored:
        scored.length,

      persisted:
        !dbError,

      bids,
      watches,
      maybe,
      skips,
      research,

      lots: scored,

      meta: {
        engine:
          "@andysd/intelligence-core",
        engineVersion:
          "phase-2.2",
        decisionAuthority:
          "intelligence-core",
        legacyCompatibility:
          true,
        rejectedLots,
      },
    });
  } catch (error) {
    console.error(
      "[bidlot] Import route error:",
      error,
    );

    return NextResponse.json(
      {
        error:
          "Internal server error",
        detail:
          error instanceof Error
            ? error.message
            : String(error),
      },
      {
        status: 500,
      },
    );
  }
}
