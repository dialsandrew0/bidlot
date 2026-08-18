import type {
  ComparableSale,
  Money,
  Valuation,
} from "../domain/types.js";

const clamp01 = (value: number): number =>
  Math.max(0, Math.min(1, value));

function median(values: number[]): number {
  if (values.length === 0) {
    throw new Error(
      "median requires at least one value"
    );
  }

  const sorted = [...values].sort(
    (a, b) => a - b
  );

  const middle = Math.floor(sorted.length / 2);

  if (sorted.length % 2 === 0) {
    const lower = sorted[middle - 1];
    const upper = sorted[middle];

    if (lower === undefined || upper === undefined) {
      throw new Error(
        "Unable to resolve median values"
      );
    }

    return (lower + upper) / 2;
  }

  const value = sorted[middle];

  if (value === undefined) {
    throw new Error(
      "Unable to resolve median value"
    );
  }

  return value;
}

function weightedMean(
  values: Array<{
    value: number;
    weight: number;
  }>
): number {
  if (values.length === 0) {
    throw new Error(
      "weightedMean requires at least one value"
    );
  }

  const totalWeight = values.reduce(
    (sum, item) => sum + item.weight,
    0
  );

  if (totalWeight <= 0) {
    return median(
      values.map((item) => item.value)
    );
  }

  return (
    values.reduce(
      (sum, item) =>
        sum + item.value * item.weight,
      0
    ) / totalWeight
  );
}

export function estimateValuation(
  comparables: ComparableSale[],
  fallbackValue?: Money
): Valuation {
  if (comparables.length === 0) {
    if (!fallbackValue) {
      throw new Error(
        "No comparable evidence and no fallback valuation supplied"
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
      source: "FALLBACK",
      comparableCount: 0,
      evidenceQuality: 0,
      assumptions: [
        "No comparable sales were supplied.",
      ],
      risks: [
        "Fallback valuation is not market-verified.",
      ],
    };
  }

  const firstComparable = comparables[0];

  if (!firstComparable) {
    throw new Error(
      "Comparable collection unexpectedly empty"
    );
  }

  const weights = comparables.map((comp) => {
    const evidenceQuality =
      comp.evidence.length === 0
        ? 0
        : comp.evidence.reduce(
            (sum, evidence) =>
              sum +
              evidence.reliability *
                evidence.relevance,
            0
          ) / comp.evidence.length;

    return {
      value: comp.soldPrice.amount,
      weight:
        clamp01(comp.similarity) *
        evidenceQuality,
    };
  });

  const midpoint = weightedMean(weights);

  const values = comparables.map(
    (comp) => comp.soldPrice.amount
  );

  const p25 = percentile(values, 0.25);
  const p75 = percentile(values, 0.75);

  const evidenceQuality =
    comparables.reduce((sum, comp) => {
      const quality =
        comp.evidence.length === 0
          ? 0
          : comp.evidence.reduce(
              (inner, evidence) =>
                inner +
                evidence.reliability *
                  evidence.relevance,
              0
            ) / comp.evidence.length;

      return (
        sum +
        quality *
          clamp01(comp.similarity)
      );
    }, 0) / comparables.length;

  const coverage = Math.min(
    comparables.length / 8,
    1
  );

  const confidence = clamp01(
    0.55 * evidenceQuality +
      0.45 * coverage
  );

  return {
    low: {
      ...firstComparable.soldPrice,
      amount: p25,
    },
    midpoint: {
      ...firstComparable.soldPrice,
      amount: midpoint,
    },
    high: {
      ...firstComparable.soldPrice,
      amount: p75,
    },
    confidence,
    source: "EVIDENCE",
    comparableCount: comparables.length,
    evidenceQuality,
    assumptions: [
      "Comparable similarity is an input and should be validated against the actual item condition.",
      "Observed sold prices are treated as market evidence, not guaranteed future sale prices.",
    ],
    risks:
      confidence < 0.65
        ? [
            "Evidence coverage or quality is not yet strong enough for high-confidence pricing.",
          ]
        : [],
  };
}

function percentile(
  values: number[],
  p: number
): number {
  if (values.length === 0) {
    throw new Error(
      "percentile requires at least one value"
    );
  }

  const sorted = [...values].sort(
    (a, b) => a - b
  );

  if (sorted.length === 1) {
    const only = sorted[0];

    if (only === undefined) {
      throw new Error(
        "Unable to resolve percentile"
      );
    }

    return only;
  }

  const index =
    (sorted.length - 1) * p;

  const lower = Math.floor(index);
  const upper = Math.ceil(index);

  const lowerValue = sorted[lower];
  const upperValue = sorted[upper];

  if (
    lowerValue === undefined ||
    upperValue === undefined
  ) {
    throw new Error(
      "Unable to resolve percentile bounds"
    );
  }

  if (lower === upper) {
    return lowerValue;
  }

  return (
    lowerValue +
    (upperValue - lowerValue) *
      (index - lower)
  );
}
