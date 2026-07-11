// bidlot — shared types
// packages/shared/types.ts

export type ShippingMode = "shippable" | "pickup_only" | "unknown";

export type Category =
  | "fine_jewelry"
  | "costume_jewelry"
  | "tools"
  | "furniture"
  | "art_decor"
  | "auto_parts"
  | "media"
  | "fashion"
  | "unknown";

export type Decision = "bid" | "watch" | "maybe" | "skip";

// Raw lot as extracted from the CTBids watchlist page
export interface RawLot {
  source: "ctbids";
  lotUrl: string;
  title: string;
  location: string;
  postalCode?: string;
  shippingMode: ShippingMode;
  currentBid: number;
  currency: "USD";
  timeRemainingSeconds: number;
  watchlistCapturedAt: string; // ISO 8601
}

// Scored lot after running through the scoring engine
export interface ScoredLot extends RawLot {
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
  scoredAt: string; // ISO 8601
}

// Full lot after deep-dive analysis
export interface AnalyzedLot extends ScoredLot {
  photoUrls: string[];
  description: string;
  extractedFacts: Record<string, string>;
  nicheNotes: string;
  compsSummary: string;
  resalePath: string;
  riskFlags: string[];
  finalRecommendation: string;
  analyzedAt: string; // ISO 8601
}

// Category scoring defaults
export interface CategoryDefaults {
  confidence: number;
  feeRate: number;
  riskRate: number;
  profitRate: number;
  logisticsShippable: number;
  logisticsPickupOnly: number;
}

// Watchlist import payload (extension -> API)
export interface WatchlistImportPayload {
  lots: RawLot[];
  importedAt: string;
  source: "ctbids";
  pageUrl: string;
}

// API response
export interface ImportResult {
  received: number;
  scored: number;
  queued: number;
  errors: string[];
}
