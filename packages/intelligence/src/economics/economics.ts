import type {
  Economics,
  EconomicsInput,
  Money,
} from "../domain/types.js";

function nonNegative(value: number): number {
  return Math.max(0, Number.isFinite(value) ? value : 0);
}

function money(amount: number, currency: Money["currency"]): Money {
  return {
    amount: Number(nonNegative(amount).toFixed(2)),
    currency,
  };
}

function add(currency: Money["currency"], ...values: Money[]): Money {
  return money(
    values.reduce((sum, value) => sum + value.amount, 0),
    currency,
  );
}

function rate(value: number): number {
  return Math.max(0, Math.min(1, Number.isFinite(value) ? value : 0));
}

export function calculateEconomics(
  input: EconomicsInput,
): Economics {
  const currency = input.acquisitionCost.currency;
  const expectedSalePrice = input.valuation.midpoint;

  const sellingFeeRate = rate(input.sellingFeeRate);
  const targetMarginRate = rate(input.targetMarginRate);
  const riskReserveRate = rate(input.riskReserveRate);

  const variableSellingFee = expectedSalePrice.amount * sellingFeeRate;

  const fixedAndVariableCosts = add(
    currency,
    input.fixedSellingFees,
    input.shippingCost,
    input.otherCosts,
    money(variableSellingFee, currency),
  );

  const totalCost = add(
    currency,
    input.acquisitionCost,
    fixedAndVariableCosts,
  );

  const expectedNetProfit = money(
    expectedSalePrice.amount - totalCost.amount,
    currency,
  );

  const roi =
    input.acquisitionCost.amount > 0
      ? expectedNetProfit.amount / input.acquisitionCost.amount
      : 0;

  /*
   * Required return is deliberately calculated from expected sale value,
   * rather than acquisition cost. This gives the engine a stable economic
   * ceiling before an acquisition is made.
   */
  const requiredReturn = money(
    expectedSalePrice.amount *
      (targetMarginRate + riskReserveRate),
    currency,
  );

  const riskReserve = money(
    expectedSalePrice.amount * riskReserveRate,
    currency,
  );

  const nonAcquisitionCosts = fixedAndVariableCosts.amount;

  const maxBuyPrice = money(
    expectedSalePrice.amount -
      nonAcquisitionCosts -
      requiredReturn.amount,
    currency,
  );

  const breakEvenPrice = money(
    expectedSalePrice.amount - nonAcquisitionCosts,
    currency,
  );

  return {
    expectedSalePrice,
    expectedNetProfit,
    roi,
    totalCost,
    maxBuyPrice,
    breakEvenPrice,
    requiredReturn,
    riskReserve,
  };
}
