import type {
  BidLotImport,
  BidLotIntelligenceConfig,
} from "./bidlot.js";

import {
  bidLotToDealInput,
  mapDecision,
} from "./bidlot.js";

import {
  runIntelligence,
  type IntelligenceResult,
} from "../orchestrator.js";

export interface CTBidsIntelligenceResult {
  lotUrl: string;
  title: string;
  intelligence: IntelligenceResult;
  legacyDecision:
    | "bid"
    | "watch"
    | "maybe"
    | "skip";
}

export function analyzeCTBidsLot(
  lot: BidLotImport,
  config: BidLotIntelligenceConfig = {},
): CTBidsIntelligenceResult {
  const deal = bidLotToDealInput(
    lot,
    config,
  );

  const intelligence =
    runIntelligence(deal);

  const mapped = mapDecision(
    intelligence.decision.decision,
  );

  return {
    lotUrl: lot.lotUrl,
    title: lot.title,
    intelligence,
    legacyDecision:
      mapped.bidlotDecision,
  };
}

export function analyzeCTBidsLots(
  lots: BidLotImport[],
  config: BidLotIntelligenceConfig = {},
): CTBidsIntelligenceResult[] {
  return lots.map((lot) =>
    analyzeCTBidsLot(lot, config),
  );
}
