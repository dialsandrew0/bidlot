import type { Evidence } from "../domain/types.js";

export interface EvidenceQuality {
  score: number;
  strength: "WEAK" | "MODERATE" | "STRONG" | "VERY_STRONG";
  reasons: string[];
}

const clamp01 = (value: number): number =>
  Math.max(0, Math.min(1, Number.isFinite(value) ? value : 0));

export function scoreEvidence(evidence: Evidence[]): EvidenceQuality {
  if (evidence.length === 0) {
    return {
      score: 0,
      strength: "WEAK",
      reasons: ["No evidence supplied."],
    };
  }

  const score =
    evidence.reduce(
      (sum, item) =>
        sum +
        clamp01(item.relevance) *
          clamp01(item.reliability) *
          clamp01(item.recency ?? 1),
      0,
    ) / evidence.length;

  const reasons: string[] = [];

  if (evidence.length < 3) {
    reasons.push("Limited independent evidence.");
  }

  if (score < 0.4) {
    reasons.push("Evidence quality is weak.");
  } else if (score < 0.7) {
    reasons.push("Evidence quality is moderate.");
  } else {
    reasons.push("Evidence quality is strong.");
  }

  const strength =
    score >= 0.85
      ? "VERY_STRONG"
      : score >= 0.7
        ? "STRONG"
        : score >= 0.4
          ? "MODERATE"
          : "WEAK";

  return {
    score,
    strength,
    reasons,
  };
}
