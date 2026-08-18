import type {
  Money,
  RiskAssessment,
  Valuation,
} from "../domain/types.js";

export function assessRisk(
  valuation: Valuation,
  currency: Money["currency"],
): RiskAssessment {
  const factors = [
    {
      name: "Evidence",
      score: Math.round((1 - valuation.evidenceStrength) * 100),
      impact: 0.35,
      explanation: "Weak evidence increases valuation uncertainty.",
    },
    {
      name: "Market dispersion",
      score: Math.round((1 - valuation.marketAgreement) * 100),
      impact: 0.3,
      explanation: "Wide comparable dispersion increases resale uncertainty.",
    },
    {
      name: "Coverage",
      score: Math.round(
        Math.max(
          0,
          1 - Math.min(valuation.effectiveComparableCount / 5, 1),
        ) * 100,
      ),
      impact: 0.2,
      explanation: "Fewer strong comparables increase uncertainty.",
    },
    {
      name: "Confidence",
      score: Math.round((1 - valuation.confidence) * 100),
      impact: 0.15,
      explanation: "Lower evidence strength increases decision risk.",
    },
  ];

  const score = Math.round(
    factors.reduce(
      (sum, factor) => sum + factor.score * factor.impact,
      0,
    ),
  );

  const level =
    score >= 80
      ? "CRITICAL"
      : score >= 60
        ? "HIGH"
        : score >= 35
          ? "MEDIUM"
          : "LOW";

  return {
    score,
    level,
    expectedLossReserve: {
      amount: 0,
      currency,
    },
    factors,
  };
}
