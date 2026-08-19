import type {
  DealInput,
  Decision,
  Money,
} from "../domain/types.js";

export type BidLotShippingMode =
  | "shippable"
  | "pickup_only"
  | "unknown";

export interface BidLotImport {
  source: "ctbids";
  lotUrl: string;
  title: string;
  location: string;
  currentBid: number;
  shippingMode: BidLotShippingMode;
  imageUrl?: string;
  estateType?: string;
  saleDate?: string;
  timeRemaining?: string;
}

export interface BidLotIntelligenceConfig {
  sellingFeeRate?: number;
  fixedSellingFees?: number;
  shippingCost?: number;
  otherCosts?: number;
  targetMarginRate?: number;
  riskReserveRate?: number;
  buyerPremiumRate?: number;
  buyerFixedFees?: number;
  bidIncrement?: number;
  competitionReserveRate?: number;
}

export function bidLotToDealInput(
  lot: BidLotImport,
  config: BidLotIntelligenceConfig = {},
): DealInput {
  const money = (amount: number): Money => ({
    amount: Math.max(
      0,
      Number.isFinite(amount) ? amount : 0,
    ),
    currency: "USD",
  });

  const input: DealInput = {
    itemId: lot.lotUrl,
    title: lot.title,

    acquisitionCost: money(lot.currentBid),

    /*
     * No market evidence is attached at import time.
     * The zero fallback means "valuation unavailable",
     * not "the item is worth $0".
     */
    comparables: [],

    fallbackValue: money(0),

    sellingFeeRate:
      config.sellingFeeRate ?? 0.13,

    fixedSellingFees:
      money(config.fixedSellingFees ?? 0),

    shippingCost:
      money(
        config.shippingCost ??
          (lot.shippingMode === "pickup_only"
            ? 50
            : 15),
      ),

    otherCosts:
      money(config.otherCosts ?? 0),

    targetMarginRate:
      config.targetMarginRate ?? 0.20,

    riskReserveRate:
      config.riskReserveRate ?? 0.10,

    evidence: [],
  };

  if (
    config.buyerPremiumRate !== undefined ||
    config.buyerFixedFees !== undefined ||
    config.bidIncrement !== undefined ||
    config.competitionReserveRate !== undefined
  ) {
    input.auction = {
      currentBid: money(lot.currentBid),

      buyerPremiumRate:
        config.buyerPremiumRate ?? 0,

      buyerFixedFees:
        money(config.buyerFixedFees ?? 0),

      bidIncrement:
        money(config.bidIncrement ?? 1),

      competitionReserveRate:
        config.competitionReserveRate ?? 0.10,
    };
  }

  return input;
}

export interface BidLotDecisionMapping {
  intelligenceDecision: Decision;
  bidlotDecision:
    | "bid"
    | "watch"
    | "maybe"
    | "skip";
}

export function mapDecision(
  decision: Decision,
): BidLotDecisionMapping {
  switch (decision) {
    case "BUY":
      return {
        intelligenceDecision: decision,
        bidlotDecision: "bid",
      };

    case "BID":
      return {
        intelligenceDecision: decision,
        bidlotDecision: "bid",
      };

    case "WATCH":
      return {
        intelligenceDecision: decision,
        bidlotDecision: "watch",
      };

    case "RESEARCH":
      return {
        intelligenceDecision: decision,
        bidlotDecision: "maybe",
      };

    case "PASS":
    default:
      return {
        intelligenceDecision: decision,
        bidlotDecision: "skip",
      };
  }
}
