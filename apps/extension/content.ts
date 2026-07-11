// bidlot — CTBids watchlist content script
// apps/extension/content.ts
// Runs on https://ctbids.com/watching
// Extracts lot data from the user's own authenticated session

type ShippingMode = "shippable" | "pickup_only" | "unknown";

interface RawLot {
  source: "ctbids";
  lotUrl: string;
  title: string;
  location: string;
  postalCode?: string;
  shippingMode: ShippingMode;
  currentBid: number;
  currency: "USD";
  timeRemainingSeconds: number;
  watchlistCapturedAt: string;
}

// -------------------------------------------------------
// Parsers
// -------------------------------------------------------
function parseShippingMode(text: string): ShippingMode {
  const t = text.toLowerCase();
  if (t.includes("pick up only")) return "pickup_only";
  if (t.includes("shippable")) return "shippable";
  return "unknown";
}

function parseMoney(text: string): number {
  const match = text.replace(/,/g, "").match(/([\d.]+)/);
  return match ? parseFloat(match[1]) : 0;
}

function parseCountdown(el: Element | null): number {
  if (!el) return 0;
  const text = el.textContent || "";
  const parts = text.split(":").map((s) => s.trim());
  // Expect format "03 d : 01 h : 22 m : 41 s"
  const nums = text.match(/(\d+)\s*[dhms]/gi) || [];
  let total = 0;
  for (const part of nums) {
    const val = parseInt(part, 10);
    if (part.toLowerCase().includes("d")) total += val * 86400;
    else if (part.toLowerCase().includes("h")) total += val * 3600;
    else if (part.toLowerCase().includes("m")) total += val * 60;
    else if (part.toLowerCase().includes("s")) total += val;
  }
  return total;
}

// -------------------------------------------------------
// Main extractor
// -------------------------------------------------------
function extractLots(): RawLot[] {
  const lots: RawLot[] = [];
  const now = new Date().toISOString();

  // Each watchlist item has a checkbox with this aria-label
  const checkboxes = Array.from(
    document.querySelectorAll<HTMLInputElement>(
      'input[type="checkbox"][aria-label="checkbox for selecting item"]'
    )
  );

  for (const checkbox of checkboxes) {
    const card = checkbox.closest(".watchlist-item, [class*='item'], li, article, div[data-item-id]") ||
      checkbox.parentElement?.parentElement ||
      checkbox.parentElement;

    if (!card) continue;

    // Find the link to the listing
    const link = card.querySelector<HTMLAnchorElement>("a[href*='/estate-sale/']");
    if (!link) continue;

    const title = (link.textContent || "").trim();
    if (!title) continue;

    // Location
    const allText = card.textContent || "";
    const locationMatch = allText.match(/([A-Za-z\s]+),\s*([A-Za-z]+),\s*(\d{5})/);
    const city = locationMatch?.[1]?.trim() || "";
    const state = locationMatch?.[2]?.trim() || "";
    const postal = locationMatch?.[3]?.trim() || "";
    const location = [city, state].filter(Boolean).join(", ");

    // Shipping mode
    const shippingEl = card.querySelector<HTMLElement>("[class*='shipping'], [class*='pickup']");
    const shippingText = shippingEl?.textContent || allText;
    const shippingMode = parseShippingMode(shippingText);

    // Current bid
    const bidEl = card.querySelector<HTMLElement>("[class*='bid'], [class*='price'], [class*='current']");
    const bidText = bidEl?.textContent || "";
    const currentBid = parseMoney(bidText);

    // Countdown
    const countdownEl = card.querySelector<HTMLElement>("[class*='countdown'], [class*='timer'], [class*='time']");
    const timeRemainingSeconds = parseCountdown(countdownEl);

    lots.push({
      source: "ctbids",
      lotUrl: link.href,
      title,
      location,
      postalCode: postal || undefined,
      shippingMode,
      currentBid,
      currency: "USD",
      timeRemainingSeconds,
      watchlistCapturedAt: now,
    });
  }

  return lots;
}

// -------------------------------------------------------
// Send to bidlot API
// -------------------------------------------------------
async function sendToBidlot(lots: RawLot[]): Promise<void> {
  const BIDLOT_API = "https://your-bidlot-app.vercel.app/api/import/ctbids-watchlist";

  const payload = {
    lots,
    importedAt: new Date().toISOString(),
    source: "ctbids",
    pageUrl: window.location.href,
  };

  const res = await fetch(BIDLOT_API, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
    credentials: "include",
  });

  if (!res.ok) {
    throw new Error(`bidlot API error: ${res.status}`);
  }

  const data = await res.json();
  return data;
}

// -------------------------------------------------------
// Entry point (triggered by background.js)
// -------------------------------------------------------n(async () => {
  try {
    const lots = extractLots();

    if (lots.length === 0) {
      alert("bidlot: No watchlist items found. Make sure you are on ctbids.com/watching.");
      return;
    }

    // Store locally for popup to read while API call goes out
    chrome.storage.local.set({ lastExtract: lots, extractedAt: new Date().toISOString() });

    await sendToBidlot(lots);
    alert(`bidlot: Sent ${lots.length} lots to your dashboard!`);
  } catch (err) {
    console.error("[bidlot] content script error:", err);
    alert(`bidlot error: ${err}`);
  }
})();
