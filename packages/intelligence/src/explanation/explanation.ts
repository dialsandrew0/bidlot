import type { DecisionResult } from "../domain/types.js";

export interface DecisionExplanation {
  headline: string;
  summary: string;
  strengths: string[];
  risks: string[];
  actions: string[];
}

export function explainDecision(
  result: DecisionResult,
): DecisionExplanation {
  const strengths: string[] = [];
  const risks = [...result.risks];
  const actions = [...result.verificationSteps];

  if (result.valuation.evidenceStrength >= 0.7) {
    strengths.push("Evidence quality is strong.");
  }

  if (result.valuation.marketAgreement >= 0.7) {
    strengths.push("Comparable prices show good market agreement.");
  }

  if (result.economics.expectedNetProfit.amount > 0) {
    strengths.push("Expected economics are profitable under current assumptions.");
  }

  if (result.auction?.bidAllowed) {
    strengths.push("Current auction price remains below the recommended ceiling.");
  }

  if (result.risk?.level === "HIGH" || result.risk?.level === "CRITICAL") {
    risks.push(`Overall risk level is ${result.risk.level}.`);
  }

  if (result.decision === "RESEARCH") {
    actions.push("Collect stronger market evidence before committing capital.");
  }

  if (result.decision === "PASS") {
    actions.push("Do not increase the acquisition price merely to make the deal work.");
  }

  const headline =
    result.decision === "BID"
      ? "Bid within the calculated ceiling."
      : result.decision === "BUY"
        ? "Economically attractive acquisition."
        : result.decision === "WATCH"
          ? "Potential opportunity; monitor price."
          : result.decision === "RESEARCH"
            ? "Insufficient evidence for a confident commitment."
            : "Current economics do not justify the acquisition.";

  return {
    headline,
    summary: `Decision ${result.decision} with score ${result.score}/100.`,
    strengths,
    risks,
    actions,
  };
}
