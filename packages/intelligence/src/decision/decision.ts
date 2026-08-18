import type { DecisionResult, DealInput } from "../domain/types.js";
import { calculateEconomics } from "../economics/economics.js";
import { estimateValuation } from "../valuation/valuation.js";

export function evaluateDeal(input: DealInput): DecisionResult {
  const valuation = estimateValuation(input.comparables, input.fallbackValue);

  const economics = calculateEconomics({
    acquisitionCost: input.acquisitionCost,
    valuation,
    sellingFeeRate: input.sellingFeeRate,
    fixedSellingFees: input.fixedSellingFees,
    shippingCost: input.shippingCost,
    otherCosts: input.otherCosts,
    targetMarginRate: input.targetMarginRate,
    riskReserveRate: input.riskReserveRate,
  });

  const marginScore = clamp(
    economics.roi * 45 + 50,
    0,
    100
  );

  const evidenceScore = valuation.confidence * 100;
  const priceDiscipline = input.acquisitionCost.amount <= economics.maxBuyPrice.amount
    ? 100
    : 0;

  const score = Math.round(
    marginScore * 0.45 +
    evidenceScore * 0.35 +
    priceDiscipline * 0.20
  );

  let decision: DecisionResult["decision"];
  if (valuation.source === "FALLBACK") {
    decision = "RESEARCH";
  } else if (input.acquisitionCost.amount <= economics.maxBuyPrice.amount && score >= 70) {
    decision = "BUY";
  } else if (score >= 50) {
    decision = "RESEARCH";
  } else {
    decision = "PASS";
  }

  const reasons = [
    `Expected sale price: ${formatMoney(economics.expectedSalePrice.amount, economics.expectedSalePrice.currency)}.`,
    `Maximum acquisition price: ${formatMoney(economics.maxBuyPrice.amount, economics.maxBuyPrice.currency)}.`,
    `Expected net profit at current assumptions: ${formatMoney(economics.expectedNetProfit.amount, economics.expectedNetProfit.currency)}.`,
    `Evidence confidence: ${Math.round(valuation.confidence * 100)}%.`,
  ];

  if (input.acquisitionCost.amount > economics.maxBuyPrice.amount) {
    reasons.push("Current acquisition cost exceeds the calculated maximum buy price.");
  }

  if (valuation.source === "FALLBACK") {
    reasons.push("No comparable evidence was available; research is required before treating the estimate as market-backed.");
  }

  const risks = [...valuation.risks];
  if (economics.roi < input.targetMarginRate) {
    risks.push("Expected ROI is below the target margin threshold.");
  }

  const verificationSteps: string[] = [];
  if (valuation.source === "FALLBACK") {
    verificationSteps.push("Find at least 3 relevant sold comparables.");
  }
  if (valuation.confidence < 0.75) {
    verificationSteps.push("Verify condition, model/variant, and the strongest comparable matches.");
  }
  if (input.acquisitionCost.amount > economics.maxBuyPrice.amount) {
    verificationSteps.push("Negotiate below the maximum buy price or pass.");
  }

  return {
    decision,
    score,
    economics,
    valuation,
    reasons,
    risks,
    verificationSteps,
  };
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function formatMoney(amount: number, currency: string): string {
  return `${currency} ${amount.toFixed(2)}`;
}
