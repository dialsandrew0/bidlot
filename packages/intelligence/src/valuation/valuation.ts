import type {
  ComparableSale,
  Money,
  Valuation,
} from "../domain/types.js";

const clamp01 = (value: number): number =>
  Math.max(0, Math.min(1, Number.isFinite(value) ? value : 0));

function median(values: number[]): number {
  if (values.length === 0) {
    throw new Error("median requires at least one value");
  }

  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);

  if (sorted.length % 2 === 0) {
    const lower = sorted[middle - 1];
    const upper = sorted[middle];

    if (lower === undefined || upper === undefined) {
      throw new Error("Unable to resolve median");
    }

    return (lower + upper) / 2;
  }

  const value = sorted[middle];

  if (value === undefined) {
    throw new Error("Unable to resolve median");
  }

  return value;
}

function percentile(values: number[], p: number): number {
  if (values.length === 0) {
    throw new Error("percentile requires at least one value");
  }

  const sorted = [...values].sort((a, b) => a - b);

  if (sorted.length === 1) {
    return sorted[0]!;
  }

  const index = (sorted.length - 1) * clamp01(p);
  const lowerIndex = Math.floor(index);
  const upperIndex = Math.ceil(index);

  const lower = sorted[lowerIndex];
  const upper = sorted[upperIndex];

  if (lower === undefined || upper === undefined) {
    throw new Error("Unable to resolve percentile");
  }

  if (lowerIndex === upperIndex) {
    return lower;
  }

  return lower + (upper - lower) * (index - lowerIndex);
}

function evidenceQuality(comp: ComparableSale): number {
  if (comp.evidence.length === 0) {
    return 0;
  }

  const total = comp.evidence.reduce(
    (sum, evidence) =>
      sum +
      clamp01(evidence.relevance) *
        clamp01(evidence.reliability) *
        clamp01(evidence.recency ?? 1),
    0,
  );

  return clamp01(total / comp.evidence.length);
}

function comparableWeight(comp: ComparableSale): number {
  const similarity = clamp01(comp.similarity);
  const condition = clamp01(comp.conditionMatch ?? 0.7);
  const variant = clamp01(comp.variantMatch ?? 0.7);
  const evidence = evidenceQuality(comp);

  return similarity * condition * variant * evidence;
}

function marketAgreement(values: number[]): number {
  if (values.length < 2) {
    return values.length === 1 ? 0.5 : 0;
  }

  const center = median(values);

  if (center <= 0) {
    return 0;
  }

  const deviations = values.map(
    (value) => Math.abs(value - center) / center,
  );

  const averageDeviation =
    deviations.reduce((sum, value) => sum + value, 0) /
    deviations.length;

  return clamp01(1 - averageDeviation);
}

function weightedMean(
  values: Array<{ value: number; weight: number }>,
): number {
  const usable = values.filter(
    (entry) =>
      Number.isFinite(entry.value) &&
      Number.isFinite(entry.weight) &&
      entry.weight > 0,
  );

  if (usable.length === 0) {
    return median(values.map((entry) => entry.value));
  }

  const totalWeight = usable.reduce(
    (sum, entry) => sum + entry.weight,
    0,
  );

  if (totalWeight <= 0) {
    return median(usable.map((entry) => entry.value));
  }

  return (
    usable.reduce(
      (sum, entry) => sum + entry.value * entry.weight,
      0,
    ) / totalWeight
  );
}

export function estimateValuation(
  comparables: ComparableSale[],
  fallbackValue?: Money,
): Valuation {
  if (comparables.length === 0) {
    if (!fallbackValue) {
      throw new Error(
        "No comparable evidence and no fallback valuation supplied",
      );
    }

    return {
      low: {
        ...fallbackValue,
        amount: fallbackValue.amount * 0.75,
      },
      midpoint: fallbackValue,
      high: {
        ...fallbackValue,
        amount: fallbackValue.amount * 1.25,
      },
      confidence: 0.2,
      evidenceStrength: 0,
      source: "FALLBACK",
      comparableCount: 0,
      effectiveComparableCount: 0,
      marketAgreement: 0,
      assumptions: [
        "No comparable sales were supplied.",
        "Fallback value is not market-verified.",
      ],
      risks: [
        "Valuation uncertainty is high.",
        "Acquire only if additional evidence is obtained.",
      ],
    };
  }

  const first = comparables[0]!;

  const values = comparables.map(
    (comparable) => comparable.soldPrice.amount,
  );

  const weightedValues = comparables.map((comparable) => ({
    value: comparable.soldPrice.amount,
    weight: comparableWeight(comparable),
  }));

  const midpoint = weightedMean(weightedValues);

  const p25 = percentile(values, 0.25);
  const p75 = percentile(values, 0.75);

  const totalWeight = weightedValues.reduce(
    (sum, entry) => sum + entry.weight,
    0,
  );

  const evidenceStrength =
    comparables.reduce(
      (sum, comparable) =>
        sum +
        evidenceQuality(comparable) *
          clamp01(comparable.similarity),
      0,
    ) / comparables.length;

  const agreement = marketAgreement(values);

  const coverage = Math.min(comparables.length / 8, 1);

  const effectiveComparableCount = Number(
    weightedValues
      .reduce((sum, entry) => sum + (entry.weight > 0 ? 1 : 0), 0)
      .toFixed(2),
  );

  const confidence = clamp01(
    evidenceStrength * 0.4 +
      agreement * 0.25 +
      coverage * 0.2 +
      Math.min(totalWeight / Math.max(comparables.length, 1), 1) *
        0.15,
  );

  const risks: string[] = [];
  const assumptions: string[] = [
    "Comparable similarity and condition matching must be validated.",
    "Observed sold prices do not guarantee future realized prices.",
  ];

  if (confidence < 0.65) {
    risks.push(
      "Evidence strength is insufficient for high-confidence valuation.",
    );
  }

  if (agreement < 0.6) {
    risks.push(
      "Comparable prices show significant market dispersion.",
    );
  }

  if (effectiveComparableCount < 3) {
    risks.push("Fewer than three strong comparables remain after weighting.");
  }

  return {
    low: {
      ...first.soldPrice,
      amount: p25,
    },
    midpoint: {
      ...first.soldPrice,
      amount: midpoint,
    },
    high: {
      ...first.soldPrice,
      amount: p75,
    },
    confidence,
    evidenceStrength,
    source: "EVIDENCE",
    comparableCount: comparables.length,
    effectiveComparableCount,
    marketAgreement: agreement,
    assumptions,
    risks,
  };
}
