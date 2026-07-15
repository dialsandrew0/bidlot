# bidlot Extension — v1/extension-import

This branch is the reviewable working version of the **Chrome MV3 extension** that collects your CTBids watchlist and sends it to the bidlot API for scoring.

---

## What this version does

- Detects when you are on `ctbids.com/watching`
- Runs `content.ts` to scrape lot titles, current bids, URLs, shipping mode, and time remaining
- Stores extracted data in `chrome.storage.local`
- Popup (`popup.html` + `popup.js`) shows last import count + timestamp, and a one-click **Import** button
- Posts the lot array to your bidlot dashboard API at `/api/import/ctbids-watchlist`
- Background service worker (`background.js`) keeps the extension alive

---

## How to load it in Chrome (unpacked)

1. Open Chrome and go to `chrome://extensions`
2. Enable **Developer mode** (top right toggle)
3. Click **Load unpacked**
4. Select the `apps/extension` folder from this repo
5. Navigate to `https://ctbids.com/watching` while signed in
6. Click the bidlot extension icon
7. Click **Import Watchlist**

---

## API target

The extension posts to:
```
POST http://localhost:3000/api/import/ctbids-watchlist
```
Update `popup.js` with your Vercel URL for production use.

---

## Files in `apps/extension/`

| File | Purpose |
|---|---|
| `manifest.json` | Chrome MV3 extension manifest |
| `content.ts` | DOM scraper for CTBids watchlist page |
| `background.js` | Service worker (keeps extension alive) |
| `popup.html` | Extension popup UI (dark theme) |
| `popup.js` | Popup controller (import button + status) |

---

This branch is self-contained and reviewable. The extension files are production-ready for local testing.
