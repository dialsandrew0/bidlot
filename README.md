# bidlot

> Auction intelligence OS — estate sale triage, max-bid scoring, and niche valuation for serious buyers.

**bidlot** turns your CTBids watchlist into a ranked opportunity feed with instant bid/watch/skip decisions, category-aware max-bid ceilings, and deep niche research cards — all powered by LLMs and a deterministic scoring engine.

---

## What it does

- Imports your CTBids watchlist (150+ items) via browser extension
- Classifies every lot: fine jewelry, tools, auto parts, furniture, art/decor, media, fashion, unknown
- Computes a max bid using ARV, confidence, fees, logistics, risk, and profit floor
- Labels every lot: **Bid / Watch / Maybe / Skip**
- Deep-dives high-value lots with photo analysis and niche-specific LLM valuation
- Tracks wins, skips, and resale outcomes to improve future recommendations

---

## Monorepo structure

```
bidlot/
  apps/
    dashboard/          # Next.js 14 app — command center UI
    extension/          # Chrome MV3 extension — CTBids watchlist collector
  packages/
    shared/             # Shared types + scoring engine
```

---

## Core formula

```
MaxBid = (ARV x Confidence) - Fees - Logistics - Risk - ProfitFloor
```

Category defaults ship with the engine. Override ARV manually or let the LLM estimate it from listing photos and title.

---

## Tech stack

- **Next.js 14** (App Router) — dashboard + API routes
- **TypeScript** — full monorepo
- **Supabase / Postgres** — lots, scores, analyses, outcomes
- **Chrome Extension MV3** — session-based watchlist collector
- **OpenAI / LLM** — photo analysis, niche valuation, comp research
- **Tailwind CSS** — UI
- **Vercel** — deployment

---

## Quickstart

```bash
git clone https://github.com/dialsandrew0/bidlot.git
cd bidlot
npm install

# Run dashboard
cd apps/dashboard
npm run dev
```

Load `apps/extension` as an unpacked Chrome extension, navigate to your CTBids watchlist, and click the extension icon to import lots.

---

## Category defaults

| Category | Confidence | Fee Rate | Risk Rate | Profit Floor |
|---|---|---|---|---|
| Fine jewelry | 0.88 | 13% | 10% | 22% |
| Costume jewelry | 0.58 | 15% | 24% | 28% |
| Tools | 0.70 | 14% | 16% | 24% |
| Furniture | 0.55 | 12% | 26% | 30% |
| Art / decor | 0.60 | 14% | 20% | 25% |
| Auto parts | 0.68 | 14% | 20% | 25% |
| Media | 0.64 | 15% | 16% | 22% |
| Fashion | 0.52 | 15% | 22% | 25% |
| Unknown / mystery | 0.40 | 15% | 35% | 30% |

---

## Decision bands

| Label | Condition |
|---|---|
| **Bid** | Current bid >= 25% below MaxBid and confidence >= 0.60 |
| **Watch** | Current bid 10–25% below MaxBid |
| **Maybe** | Within 10% of MaxBid or confidence < 0.60 |
| **Skip** | Current bid exceeds MaxBid |

---

Built for estate sale buyers who want speed, precision, and an edge.
