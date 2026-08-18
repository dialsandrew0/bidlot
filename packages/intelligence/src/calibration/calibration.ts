import type {
  Money,
  OutcomeRecord,
  PredictionRecord,
} from "../domain/types.js";

export interface CalibrationResult {
  absoluteError?: Money;
  percentageError?: number;
  profitable?: boolean;
  realizedProfit?: Money;
}

export function evaluatePrediction(
  prediction: PredictionRecord,
  outcome: OutcomeRecord,
): CalibrationResult {
  if (!outcome.sold || !outcome.salePrice) {
    return {};
  }

  const error = Math.abs(
    prediction.predictedValue.amount -
      outcome.salePrice.amount,
  );

  const percentageError =
    prediction.predictedValue.amount > 0
      ? error / prediction.predictedValue.amount
      : undefined;

  return {
    absoluteError: {
      amount: Number(error.toFixed(2)),
      currency: prediction.predictedValue.currency,
    },
    percentageError,
    profitable:
      outcome.realizedProfit !== undefined
        ? outcome.realizedProfit.amount > 0
        : undefined,
    realizedProfit: outcome.realizedProfit,
  };
}
