import type { Evidence } from "../domain/types.js";

export interface ConfidenceReport {
  score: number;
  label: "LOW" | "MODERATE" | "HIGH";
  evidenceCount: number;
  averageQuality: number;
  gaps: string[];
}

export function assessEvidence(evidence: Evidence[]): ConfidenceReport {
  const averageQuality = evidence.length === 0
    ? 0
    : evidence.reduce((sum, e) => sum + e.relevance * e.reliability, 0) / evidence.length;

  const coverage = Math.min(evidence.length / 6, 1);
  const score = Math.max(0, Math.min(1, averageQuality * 0.65 + coverage * 0.35));

  const gaps: string[] = [];
  if (evidence.length < 3) gaps.push("Too few independent evidence records.");
  if (averageQuality < 0.65) gaps.push("Evidence relevance/reliability is weak.");
  if (!evidence.some(e => e.kind === "SOLD_COMP" || e.kind === "AUCTION_RESULT")) {
    gaps.push("No direct transaction evidence is present.");
  }

  const label = score >= 0.78 ? "HIGH" : score >= 0.55 ? "MODERATE" : "LOW";

  return {
    score,
    label,
    evidenceCount: evidence.length,
    averageQuality,
    gaps,
  };
}
