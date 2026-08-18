import type {
  AuctionAnalysis,
  AuctionInput,
  Economics,
  Money,
} from "../domain/types.js";

function money(
  amount: number,
  currency: Money["currency"],
): Money {
  return {
    amount: Math.max(0, Number(amount.toFixed(2))),
    currency,
  };
}

function rate(value: number): number {
  return Math.max(0, Math.min(1, Number.isFinite(value) ? value : 0));
}

export function analyzeAuction(
  input: AuctionInput,
  economics: Economics,
): AuctionAnalysis {
  const currency = input.currentBid.currency;

  const buyerPremiumRate = rate(input.buyerPremiumRate);
  const reserveRate = rate(input.competitionReserveRate);

  const nextBid = money(
    Math.max(
      input.currentBid.amount + input.bidIncrement.amount,
      input.currentBid.amount,
    ),
    currency,
  );

  /*
   * Economic ceiling is the maximum hammer price that still fits
   * inside the previously calculated acquisition ceiling after buyer
   * premium and fixed auction fees.
   */
  const economicCeiling = money(
    Math.max(
      0,
      (
        economics.maxBuyPrice.amount -
        input.buyerFixedFees.amount
      ) /
        (1 + buyerPremiumRate),
    ),
    currency,
  );

  const recommendedMaxBid = money(
    economicCeiling.amount * (1 - reserveRate),
    currency,
  );

  const buyerPremium = money(
    recommendedMaxBid.amount * buyerPremiumRate,
    currency,
  );

  const totalAuctionCostAtMax = money(
    recommendedMaxBid.amount +
      buyerPremium.amount +
      input.buyerFixedFees.amount,
    currency,
  );

  const headroom = money(
    Math.max(
      0,
      recommendedMaxBid.amount - input.currentBid.amount,
    ),
    currency,
  );

  const headroomRate =
    recommendedMaxBid.amount > 0
      ? headroom.amount / recommendedMaxBid.amount
      : 0;

  const bidAllowed =
    nextBid.amount <= recommendedMaxBid.amount;

  const reasons: string[] = [];
  const risks: string[] = [];

  if (bidAllowed) {
    reasons.push(
      "Next bid remains below the risk-adjusted maximum bid.",
    );
  } else {
    reasons.push(
      "Next bid exceeds the risk-adjusted maximum bid.",
    );
  }

  if (buyerPremiumRate > 0) {
    reasons.push(
      `Buyer premium of ${(buyerPremiumRate * 100).toFixed(1)}% is included.`,
    );
  }

  if (reserveRate > 0) {
    reasons.push(
      `A ${(reserveRate * 100).toFixed(1)}% competition reserve protects the ceiling.`,
    );
  }

  if (headroomRate < 0.1) {
    risks.push("Very little bidding headroom remains.");
  }

  return {
    currentBid: input.currentBid,
    nextBid,
    economicCeiling,
    recommendedMaxBid,
    headroom,
    headroomRate,
    buyerPremium,
    totalAuctionCostAtMax,
    bidAllowed,
    reasons,
    risks,
  };
}
