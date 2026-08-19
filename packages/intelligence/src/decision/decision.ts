import type {
  Decision,
  DecisionResult,
  DealInput,
  Economics,
  Valuation,
} from "../domain/types.js";

import { calculateEconomics } from "../economics/economics.js";
import { estimateValuation } from "../valuation/valuation.js";
import { analyzeAuction } from "../auction/max-bid.js";
import { assessRisk } from "../risk/risk.js";
import { scoreEvidence } from "../evidence/quality.js";
import { rankComparables } from "../comparables/engine.js";

function clamp(
  value: number,
  min: number,
  max: number,
): number {
  return Math.max(min, Math.min(max, value));
}

function formatMoney(
  amount: number,
  currency: string,
): string {
  return `${currency} ${amount.toFixed(2)}`;
}

function buildDecision(
  input: DealInput,
  valuation: Valuation,
  economics: Economics,
  auctionScore: number,
  riskScore: number,
): {
  decision: Decision;
  score: number;
} {
  const marginScore = clamp(
    economics.roi * 45 + 50,
    0,
    100,
  );

  const evidenceScore = valuation.confidence * 100;

  const priceDiscipline =
    input.acquisitionCost.amount <=
    economics.maxBuyPrice.amount
      ? 100
      : 0;

  /*
   * Auction gets an explicit score rather than being allowed
   * to override economics. This keeps the economic ceiling
   * authoritative.
   */
  const score = Math.round(
    marginScore * 0.35 +
      evidenceScore * 0.30 +
      priceDiscipline * 0.20 +
      auctionScore * 0.10 +
      (100 - riskScore) * 0.05,
  );

  if (valuation.source === "FALLBACK") {
    return {
      decision: "RESEARCH",
      score,
    };
  }

  if (input.auction && !input.auction.currentBid) {
    return {
      decision: "RESEARCH",
      score,
    };
  }

  if (
    input.acquisitionCost.amount <=
      economics.maxBuyPrice.amount &&
    score >= 75
  ) {
    return {
      decision: input.auction ? "BID" : "BUY",
      score,
    };
  }

  if (
    input.acquisitionCost.amount <=
      economics.maxBuyPrice.amount &&
    score >= 55
  ) {
    return {
      decision: "WATCH",
      score,
    };
  }

  return {
    decision: "PASS",
    score,
  };
}

export function evaluateDeal(
  input: DealInput,
): DecisionResult {
  const evidence = scoreEvidence(input.evidence ?? []);

  const rankedComparables = rankComparables(
    input.comparables,
  );

  /*
   * The valuation engine remains authoritative, but we
   * preserve comparable ranking as part of the reasoning
   * layer through the evidence/reason generation below.
   */
  const valuation = estimateValuation(
    input.comparables,
    input.fallbackValue,
  );

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

  const risk = assessRisk(
    valuation,
    input.acquisitionCost.currency,
  );

  let auction;
  let auctionScore = 100;

  if (input.auction) {
    auction = analyzeAuction(
      input.auction,
      economics,
    );

    auctionScore = auction.bidAllowed
      ? clamp(
          auction.headroomRate * 100 + 50,
          0,
          100,
        )
      : 0;
  }

  const { decision, score } = buildDecision(
    input,
    valuation,
    economics,
    auctionScore,
    risk.score,
  );

  const reasons: string[] = [
    `Expected sale price: ${formatMoney(
      economics.expectedSalePrice.amount,
      economics.expectedSalePrice.currency,
    )}.`,

    `Maximum acquisition price: ${formatMoney(
      economics.maxBuyPrice.amount,
      economics.maxBuyPrice.currency,
    )}.`,

    `Expected net profit: ${formatMoney(
      economics.expectedNetProfit.amount,
      economics.expectedNetProfit.currency,
    )}.`,

    `Expected ROI: ${(
      economics.roi * 100
    ).toFixed(1)}%.`,

    `Valuation confidence: ${Math.round(
      valuation.confidence * 100,
    )}%.`,

    `Evidence quality: ${Math.round(
      evidence.score * 100,
    )}%.`,

    `Market agreement: ${Math.round(
      valuation.marketAgreement * 100,
    )}%.`,

    `Effective comparable count: ${
      valuation.effectiveComparableCount
    }.`,
  ];

  if (rankedComparables.length > 0) {
    reasons.push(
      `Strongest comparable: ${
        rankedComparables[0]!.comparable.title
      }.`,
    );
  }

  if (auction) {
    reasons.push(
      `Recommended auction ceiling: ${formatMoney(
        auction.recommendedMaxBid.amount,
        auction.recommendedMaxBid.currency,
      )}.`,
    );

    reasons.push(
      auction.bidAllowed
        ? "Current auction price remains inside the calculated bid ceiling."
        : "Current auction price exceeds the calculated bid ceiling.",
    );
  }

  if (
    input.acquisitionCost.amount >
    economics.maxBuyPrice.amount
  ) {
    reasons.push(
      "Current acquisition cost exceeds the calculated maximum buy price.",
    );
  }

  if (valuation.source === "FALLBACK") {
    reasons.push(
      "No comparable evidence was available; research is required before treating the estimate as market-backed.",
    );
  }

  if (risk.level === "HIGH" || risk.level === "CRITICAL") {
    reasons.push(
      `Risk engine classified this opportunity as ${risk.level}.`,
    );
  }

  const risks = [
    ...valuation.risks,
    ...auction?.risks ?? [],
  ];

  if (economics.roi < input.targetMarginRate) {
    risks.push(
      "Expected ROI is below the target margin threshold.",
    );
  }

  if (risk.level === "HIGH" || risk.level === "CRITICAL") {
    risks.push(
      `Risk score is ${risk.score}/100.`,
    );
  }

  const verificationSteps: string[] = [];

  if (valuation.source === "FALLBACK") {
    verificationSteps.push(
      "Find at least 3 relevant sold comparables.",
    );
  }

  if (valuation.confidence < 0.75) {
    verificationSteps.push(
      "Verify condition, model/variant, and strongest comparable matches.",
    );
  }

  if (valuation.marketAgreement < 0.6) {
    verificationSteps.push(
      "Investigate why comparable prices disagree before committing capital.",
    );
  }

  if (evidence.score < 0.6) {
    verificationSteps.push(
      "Add higher-quality independent evidence.",
    );
  }

  if (
    input.acquisitionCost.amount >
    economics.maxBuyPrice.amount
  ) {
    verificationSteps.push(
      "Negotiate below the maximum buy price or pass.",
    );
  }

  if (auction && !auction.bidAllowed) {
    verificationSteps.push(
      "Do not exceed the calculated auction ceiling.",
    );
  }

  return {
    decision,
    score,
    valuation,
    economics,
    auction,
    risk,
    reasons,
    risks,
    verificationSteps,
  };
}
