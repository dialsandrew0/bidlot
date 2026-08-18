export type Currency = "USD" | "EUR" | "GBP" | "CAD" | "AUD";

export type Decision = "BUY" | "BID" | "PASS" | "RESEARCH";

export type EvidenceKind =
  | "SOLD_COMP"
  | "AUCTION_RESULT"
  | "LISTING"
  | "MANUFACTURER"
  | "PROVENANCE"
  | "USER_INPUT"
  | "MODEL_INFERENCE";

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
  relevance: number; // 0..1
  reliability: number; // 0..1
  notes?: string;
}

export interface ComparableSale {
  id: string;
  title: string;
  soldPrice: Money;
  soldAt: string;
  condition?: string;
  marketplace?: string;
  similarity: number; // 0..1
  evidence: Evidence[];
}

export interface Valuation {
  low: Money;
  midpoint: Money;
  high: Money;
  confidence: number; // 0..1
  source: "EVIDENCE" | "FALLBACK";
  comparableCount: number;
  evidenceQuality: number; // 0..1
  assumptions: string[];
  risks: string[];
}

export interface EconomicsInput {
  acquisitionCost: Money;
  valuation: Valuation;
  sellingFeeRate: number; // 0..1
  fixedSellingFees: Money;
  shippingCost: Money;
  otherCosts: Money;
  targetMarginRate: number; // 0..1
  riskReserveRate: number; // 0..1
}

export interface Economics {
  expectedSalePrice: Money;
  expectedNetProfit: Money;
  roi: number;
  totalCost: Money;
  maxBuyPrice: Money;
  breakEvenPrice: Money;
}

export interface DecisionResult {
  decision: Decision;
  score: number; // 0..100
  economics: Economics;
  valuation: Valuation;
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
}
