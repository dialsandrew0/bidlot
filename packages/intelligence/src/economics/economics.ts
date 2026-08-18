import type {
  Economics,
  EconomicsInput,
  Money,
} from "../domain/types.js";

function add(...values: Money[]): Money {
  if (values.length === 0) {
    throw new Error("add requires at least one money value");
  }

  const first = values[0];

  if (!first) {
    throw new Error("add received an empty money collection");
  }

  return {
    amount: values.reduce(
      (sum, value) => sum + value.amount,
      0
    ),
    currency: first.currency,
  };
}

function money(
  amount: number,
  currency: Money["currency"]
): Money {
  return {
    amount: Math.max(0, amount),
    currency,
  };
}

export function calculateEconomics(
  input: EconomicsInput
): Economics {
  const currency = input.acquisitionCost.currency;
  const expectedSalePrice = input.valuation.midpoint;

  const variableFee =
    expectedSalePrice.amount * input.sellingFeeRate;

  const totalCost = add(
    input.acquisitionCost,
    input.fixedSellingFees,
    input.shippingCost,
    input.otherCosts,
    money(variableFee, currency)
  );

  const expectedNetProfit = money(
    expectedSalePrice.amount - totalCost.amount,
    currency
  );

  const roi =
    input.acquisitionCost.amount > 0
      ? expectedNetProfit.amount /
        input.acquisitionCost.amount
      : 0;

  const nonAcquisitionCosts =
    input.fixedSellingFees.amount +
    input.shippingCost.amount +
    input.otherCosts.amount +
    expectedSalePrice.amount *
      input.sellingFeeRate;

  const requiredReturn =
    expectedSalePrice.amount *
    Math.max(
      0,
      input.targetMarginRate +
        input.riskReserveRate
    );

  const maxBuy = Math.max(
    0,
    expectedSalePrice.amount -
      nonAcquisitionCosts -
      requiredReturn
  );

  const breakEven = Math.max(
    0,
    expectedSalePrice.amount -
      nonAcquisitionCosts
  );

  return {
    expectedSalePrice,
    expectedNetProfit,
    roi,
    totalCost,
    maxBuyPrice: money(maxBuy, currency),
    breakEvenPrice: money(breakEven, currency),
  };
}
