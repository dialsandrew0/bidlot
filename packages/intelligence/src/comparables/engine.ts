import type { ComparableSale } from "../domain/types.js";

export interface ComparableRanking {
  comparable: ComparableSale;
  weight: number;
  rank: number;
  excluded: boolean;
  reason?: string;
}

const clamp01 = (value: number): number =>
  Math.max(0, Math.min(1, Number.isFinite(value) ? value : 0));

function weightComparable(comp: ComparableSale): number {
  const evidence =
    comp.evidence.length === 0
      ? 0
      : comp.evidence.reduce(
          (sum, item) =>
            sum +
            clamp01(item.relevance) *
              clamp01(item.reliability) *
              clamp01(item.recency ?? 1),
          0,
        ) / comp.evidence.length;

  return (
    clamp01(comp.similarity) *
    clamp01(comp.conditionMatch ?? 0.7) *
    clamp01(comp.variantMatch ?? 0.7) *
    evidence
  );
}

export function rankComparables(
  comparables: ComparableSale[],
): ComparableRanking[] {
  return comparables
    .map((comparable) => {
      const weight = weightComparable(comparable);

      return {
        comparable,
        weight,
        rank: 0,
        excluded: weight < 0.15,
        reason:
          weight < 0.15
            ? "Insufficient similarity/evidence weight."
            : undefined,
      };
    })
    .sort((a, b) => b.weight - a.weight)
    .map((entry, index) => ({
      ...entry,
      rank: index + 1,
    }));
}

export function selectStrongComparables(
  comparables: ComparableSale[],
  minimumWeight = 0.15,
): ComparableSale[] {
  return rankComparables(comparables)
    .filter((entry) => entry.weight >= minimumWeight)
    .map((entry) => entry.comparable);
}
