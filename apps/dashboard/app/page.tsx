"use client";
import { useState } from "react";

type ShippingMode = "shippable" | "pickup_only" | "unknown";
type Category = "fine_jewelry" | "costume_jewelry" | "tools" | "furniture" | "art_decor" | "auto_parts" | "media" | "fashion" | "unknown";
type Decision = "bid" | "watch" | "maybe" | "skip";

const DEFAULTS: Record<Category, { confidence: number; feeRate: number; riskRate: number; profitRate: number; logisticsS: number; logisticsP: number }> = {
  fine_jewelry:    { confidence: 0.88, feeRate: 0.13, riskRate: 0.10, profitRate: 0.22, logisticsS: 12, logisticsP: 25 },
  costume_jewelry: { confidence: 0.58, feeRate: 0.15, riskRate: 0.24, profitRate: 0.28, logisticsS: 10, logisticsP: 22 },
  tools:           { confidence: 0.70, feeRate: 0.14, riskRate: 0.16, profitRate: 0.24, logisticsS: 18, logisticsP: 45 },
  furniture:       { confidence: 0.55, feeRate: 0.12, riskRate: 0.26, profitRate: 0.30, logisticsS: 25, logisticsP: 80 },
  art_decor:       { confidence: 0.60, feeRate: 0.14, riskRate: 0.20, profitRate: 0.25, logisticsS: 16, logisticsP: 35 },
  auto_parts:      { confidence: 0.68, feeRate: 0.14, riskRate: 0.20, profitRate: 0.25, logisticsS: 20, logisticsP: 50 },
  media:           { confidence: 0.64, feeRate: 0.15, riskRate: 0.16, profitRate: 0.22, logisticsS: 10, logisticsP: 25 },
  fashion:         { confidence: 0.52, feeRate: 0.15, riskRate: 0.22, profitRate: 0.25, logisticsS: 12, logisticsP: 28 },
  unknown:         { confidence: 0.40, feeRate: 0.15, riskRate: 0.35, profitRate: 0.30, logisticsS: 15, logisticsP: 35 },
};

function classify(title: string): Category {
  const t = title.toLowerCase();
  if (/14k|10k|karat|diamond|ring|pendant|necklace|gold|sterling|silver/.test(t)) return "fine_jewelry";
  if (/costume jewelry|brooch|rhinestone/.test(t)) return "costume_jewelry";
  if (/drill|tools|socket|wrench|saw|compressor|welder|matco/.test(t)) return "tools";
  if (/chair|sofa|bed|dresser|cabinet|furniture|desk|table/.test(t)) return "furniture";
  if (/clock|lamp|decor|frame|mirror|vase|figurine/.test(t)) return "art_decor";
  if (/ford|mustang|automotive|gasket|engine|transmission/.test(t)) return "auto_parts";
  if (/vinyl|album|book|record|cd|dvd|vhs|stamp/.test(t)) return "media";
  if (/purse|dress|clothing|handbag|shoes|jacket|hat/.test(t)) return "fashion";
  return "unknown";
}

function score(title: string, currentBid: number, arv: number, shipping: ShippingMode) {
  const cat = classify(title);
  const d = DEFAULTS[cat];
  const t = title.toLowerCase();
  let conf = d.confidence;
  const reasons: string[] = [];
  if (/matco|ford|mustang|beatles|samsung/.test(t)) { conf = Math.min(0.95, conf + 0.08); reasons.push("Brand signal: confidence +0.08"); }
  if (/assorted|assortment|mystery/.test(t)) { conf = Math.max(0.20, conf - 0.14); reasons.push("Vague bundle: confidence -0.14"); }
  const logistics = shipping === "pickup_only" ? d.logisticsP : d.logisticsS;
  const fees = arv * d.feeRate;
  const risk = arv * d.riskRate;
  const profit = arv * d.profitRate;
  const maxBid = Math.max(0, parseFloat(((arv * conf) - fees - logistics - risk - profit).toFixed(2)));
  const spread = parseFloat((maxBid - currentBid).toFixed(2));
  const ratio = maxBid > 0 ? spread / maxBid : -1;
  let decision: Decision = "maybe";
  if (currentBid > maxBid) { decision = "skip"; reasons.push("Current bid exceeds MaxBid"); }
  else if (conf < 0.60) { decision = "maybe"; reasons.push("Low confidence — deep dive first"); }
  else if (ratio >= 0.25) { decision = "bid"; reasons.push("Strong margin"); }
  else if (ratio >= 0.10) { decision = "watch"; reasons.push("Moderate margin"); }
  else { decision = "maybe"; reasons.push("Thin margin"); }
  return { cat, conf, fees, logistics, risk, profit, maxBid, spread, decision, reasons };
}

const DECISION_STYLE: Record<Decision, string> = {
  bid:   "bg-green-500 text-black",
  watch: "bg-yellow-400 text-black",
  maybe: "bg-orange-400 text-black",
  skip:  "bg-red-500 text-white",
};

const SAMPLE_LOTS = [
  { title: "14k Gold Diamond Ring — Estate", currentBid: 45, arv: 380, shipping: "shippable" as ShippingMode },
  { title: "Matco Tools Socket Set 150pc", currentBid: 60, arv: 280, shipping: "pickup_only" as ShippingMode },
  { title: "Vintage Beatles Abbey Road Vinyl Sealed", currentBid: 30, arv: 85, shipping: "shippable" as ShippingMode },
  { title: "Assorted Jewelry Mystery Lot", currentBid: 25, arv: 45, shipping: "shippable" as ShippingMode },
  { title: "1966 Ford Mustang Instrument Cluster", currentBid: 140, arv: 165, shipping: "pickup_only" as ShippingMode },
];

export default function ScoringEnginePage() {
  const [title, setTitle] = useState("");
  const [currentBid, setCurrentBid] = useState("25");
  const [arv, setArv] = useState("150");
  const [shipping, setShipping] = useState<ShippingMode>("shippable");
  const [result, setResult] = useState<ReturnType<typeof score> | null>(null);

  function run() {
    if (!title.trim()) return;
    setResult(score(title, parseFloat(currentBid), parseFloat(arv), shipping));
  }

  function loadSample(lot: typeof SAMPLE_LOTS[0]) {
    setTitle(lot.title);
    setCurrentBid(String(lot.currentBid));
    setArv(String(lot.arv));
    setShipping(lot.shipping);
    setResult(score(lot.title, lot.currentBid, lot.arv, lot.shipping));
  }

  return (
    <main className="min-h-screen bg-gray-950 text-gray-100 p-8 font-mono">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-1 text-yellow-400">bidlot</h1>
        <p className="text-gray-400 mb-8 text-sm">Scoring Engine — v1 Demo</p>

        <section className="mb-8">
          <h2 className="text-xs text-gray-500 uppercase tracking-widest mb-3">Sample Lots</h2>
          <div className="flex flex-col gap-2">
            {SAMPLE_LOTS.map((lot) => (
              <button key={lot.title} onClick={() => loadSample(lot)}
                className="text-left px-3 py-2 rounded bg-gray-800 hover:bg-gray-700 text-sm border border-gray-700 truncate">
                {lot.title} <span className="text-gray-500 ml-2">${lot.currentBid} current</span>
              </button>
            ))}
          </div>
        </section>

        <section className="mb-8 flex flex-col gap-4">
          <h2 className="text-xs text-gray-500 uppercase tracking-widest">Custom Lot</h2>
          <input value={title} onChange={e => setTitle(e.target.value)}
            placeholder="Lot title (e.g. 14k Gold Ring)" className="bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm w-full" />
          <div className="flex gap-3">
            <input value={currentBid} onChange={e => setCurrentBid(e.target.value)}
              placeholder="Current bid $" className="bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm w-full" type="number" />
            <input value={arv} onChange={e => setArv(e.target.value)}
              placeholder="ARV $" className="bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm w-full" type="number" />
            <select value={shipping} onChange={e => setShipping(e.target.value as ShippingMode)}
              className="bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm w-full">
              <option value="shippable">Shippable</option>
              <option value="pickup_only">Pickup Only</option>
              <option value="unknown">Unknown</option>
            </select>
          </div>
          <button onClick={run} className="bg-yellow-400 text-black font-bold rounded px-6 py-2 hover:bg-yellow-300 transition text-sm">
            Score Lot
          </button>
        </section>

        {result && (
          <section className="bg-gray-900 border border-gray-700 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-lg font-bold truncate">{title}</p>
                <p className="text-xs text-gray-400 mt-0.5">Category: <span className="text-yellow-300">{result.cat.replace(/_/g, " ")}</span> · Confidence: <span className="text-yellow-300">{(result.conf * 100).toFixed(0)}%</span></p>
              </div>
              <span className={`px-4 py-1 rounded-full font-bold text-sm uppercase ${DECISION_STYLE[result.decision]}`}>
                {result.decision}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm mb-4">
              <div className="bg-gray-800 rounded p-3"><p className="text-gray-400 text-xs mb-1">Max Bid</p><p className="text-xl font-bold text-green-400">${result.maxBid}</p></div>
              <div className="bg-gray-800 rounded p-3"><p className="text-gray-400 text-xs mb-1">Spread to Bid</p><p className="text-xl font-bold text-blue-400">${result.spread}</p></div>
              <div className="bg-gray-800 rounded p-3"><p className="text-gray-400 text-xs mb-1">Fees</p><p className="font-semibold">${result.fees.toFixed(2)}</p></div>
              <div className="bg-gray-800 rounded p-3"><p className="text-gray-400 text-xs mb-1">Logistics</p><p className="font-semibold">${result.logistics}</p></div>
              <div className="bg-gray-800 rounded p-3"><p className="text-gray-400 text-xs mb-1">Risk</p><p className="font-semibold">${result.risk.toFixed(2)}</p></div>
              <div className="bg-gray-800 rounded p-3"><p className="text-gray-400 text-xs mb-1">Profit Floor</p><p className="font-semibold">${result.profit.toFixed(2)}</p></div>
            </div>
            <div className="text-xs text-gray-400">
              <p className="mb-1 font-semibold text-gray-300">Reasons:</p>
              <ul className="list-disc list-inside space-y-0.5">
                {result.reasons.map((r, i) => <li key={i}>{r}</li>)}
              </ul>
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
