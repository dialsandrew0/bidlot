import type { ComparableSale } from "../domain/types.js";

export function rankComparables(comparables: ComparableSale[]): ComparableSale[] {
  return [...comparables].sort((a, b) => {
    const quality = (c: ComparableSale) => {
      const evidenceQuality = c.evidence.length === 0
        ? 0
        : c.evidence.reduce((sum, e) => sum + e.relevance * e.reliability, 0) / c.evidence.length;
      return c.similarity * evidenceQuality;
    };

    return quality(b) - quality(a);
  });
}
