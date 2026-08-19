import type {
  DealInput,
  DecisionResult,
  PredictionRecord,
} from "./domain/types.js";

import { evaluateDeal } from "./decision/decision.js";
import { explainDecision } from "./explanation/explanation.js";
import { scoreEvidence } from "./evidence/quality.js";
import { rankComparables } from "./comparables/engine.js";

export interface IntelligenceResult {
  decision: DecisionResult;

  explanation: ReturnType<typeof explainDecision>;

  evidence: ReturnType<typeof scoreEvidence>;

  comparables: ReturnType<typeof rankComparables>;

  prediction: PredictionRecord;
}

export function runIntelligence(
  input: DealInput,
): IntelligenceResult {
  const decision = evaluateDeal(input);

  const evidence = scoreEvidence(
    input.evidence ?? [],
  );

  const comparables = rankComparables(
    input.comparables,
  );

  const explanation = explainDecision(
    decision,
  );

  const prediction: PredictionRecord = {
    id: `prediction_${input.itemId}_${Date.now()}`,
    itemId: input.itemId,
    predictedDecision: decision.decision,
    predictedValue: decision.valuation.midpoint,
    predictedMaxBuy: decision.economics.maxBuyPrice,
    confidence: decision.valuation.confidence,
    predictedAt: new Date().toISOString(),
  };

  return {
    decision,
    explanation,
    evidence,
    comparables,
    prediction,
  };
}
