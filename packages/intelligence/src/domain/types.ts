export type Currency = "USD" | "EUR" | "GBP" | "CAD" | "AUD";

export type Decision =
  | "BUY"
  | "BID"
  | "WATCH"
  | "RESEARCH"
  | "PASS";

export type EvidenceKind =
  | "SOLD_COMP"
  | "AUCTION_RESULT"
  | "LISTING"
  | "MANUFACTURER"
  | "PROVENANCE"
  | "USER_INPUT"
  | "MODEL_INFERENCE";

export type Condition =
  | "NEW"
  | "LIKE_NEW"
  | "EXCELLENT"
  | "GOOD"
  | "FAIR"
  | "POOR"
  | "UNKNOWN";

export interface Money {
  amount: number;
  currency: Currency;
}

export interface Evidence {
  id: string;
  kind: EvidenceKind;
  title: string;
  source?: string;
  observedAt?: string;

  /** How directly this evidence supports the claim. */
  relevance: number;

  /** How trustworthy the source is. */
  reliability: number;

  /** Optional 0..1 freshness override. */
  recency?: number;

  notes?: string;
}

export interface ComparableSale {
  id: string;
  title: string;
  soldPrice: Money;
  soldAt: string;

  condition?: Condition;
  marketplace?: string;

  /** 0..1 semantic/item similarity. */
  similarity: number;

  /** 0..1 condition similarity. */
  conditionMatch?: number;

  /** 0..1 model/variant similarity. */
  variantMatch?: number;

  evidence: Evidence[];
}

export interface Valuation {
  low: Money;
  midpoint: Money;
  high: Money;

  confidence: number;
  evidenceStrength: number;

  source: "EVIDENCE" | "FALLBACK";

  comparableCount: number;
  effectiveComparableCount: number;
  marketAgreement: number;

  assumptions: string[];
  risks: string[];
}

export interface EconomicsInput {
  acquisitionCost: Money;
  valuation: Valuation;

  sellingFeeRate: number;
  fixedSellingFees: Money;
  shippingCost: Money;
  otherCosts: Money;

  targetMarginRate: number;
  riskReserveRate: number;
}

export interface Economics {
  expectedSalePrice: Money;
  expectedNetProfit: Money;

  roi: number;

  totalCost: Money;

  maxBuyPrice: Money;
  breakEvenPrice: Money;

  requiredReturn: Money;
  riskReserve: Money;
}

export interface AuctionInput {
  currentBid: Money;

  /** Buyer premium as decimal, e.g. .18 */
  buyerPremiumRate: number;

  buyerFixedFees: Money;

  /** Typical next bid increment. */
  bidIncrement: Money;

  /** Additional uncertainty reserve applied to the ceiling. */
  competitionReserveRate: number;
}

export interface AuctionAnalysis {
  currentBid: Money;

  nextBid: Money;

  economicCeiling: Money;
  recommendedMaxBid: Money;

  headroom: Money;
  headroomRate: number;

  buyerPremium: Money;
  totalAuctionCostAtMax: Money;

  bidAllowed: boolean;

  reasons: string[];
  risks: string[];
}

export interface RiskAssessment {
  score: number;
  level: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

  expectedLossReserve: Money;

  factors: Array<{
    name: string;
    score: number;
    impact: number;
    explanation: string;
  }>;
}

export interface DecisionResult {
  decision: Decision;
  score: number;

  valuation: Valuation;
  economics: Economics;
  auction?: AuctionAnalysis;
  risk?: RiskAssessment;

  reasons: string[];
  risks: string[];
  verificationSteps: string[];
}

export interface DealInput {
  itemId: string;
  title: string;

  acquisitionCost: Money;

  comparables: ComparableSale[];

  fallbackValue?: Money;

  sellingFeeRate: number;
  fixedSellingFees: Money;
  shippingCost: Money;
  otherCosts: Money;

  targetMarginRate: number;
  riskReserveRate: number;

  evidence?: Evidence[];

  auction?: AuctionInput;
}

export interface PredictionRecord {
  id: string;
  itemId: string;

  predictedDecision: Decision;
  predictedValue: Money;
  predictedMaxBuy: Money;

  confidence: number;

  predictedAt: string;
}

export interface OutcomeRecord {
  predictionId: string;

  acquired: boolean;
  acquisitionCost?: Money;

  sold: boolean;
  salePrice?: Money;

  realizedProfit?: Money;

  observedAt: string;
}
