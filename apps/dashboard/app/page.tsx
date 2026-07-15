"use client";
import { useState, useMemo } from "react";

type Decision = "bid" | "watch" | "maybe" | "skip";
type Category = "fine_jewelry" | "costume_jewelry" | "tools" | "furniture" | "art_decor" | "auto_parts" | "media" | "fashion" | "unknown";

interface Lot {
  id: string;
  title: string;
  category: Category;
  currentBid: number;
  maxBid: number;
  spread: number;
  confidence: number;
  decision: Decision;
  shipping: "shippable" | "pickup_only";
  closesIn: string;
  reasons: string[];
  arv: number;
}

const MOCK_LOTS: Lot[] = [
  { id: "1", title: "14k Gold Diamond Whale Tail Pendant", category: "fine_jewelry", currentBid: 45, maxBid: 187.36, spread: 142.36, confidence: 0.88, decision: "bid", shipping: "shippable", closesIn: "4h 12m", arv: 420, reasons: ["Strong margin", "Precious-metal keyword detected."] },
  { id: "2", title: "Matco Tools 150-pc Socket Set", category: "tools", currentBid: 60, maxBid: 98.40, spread: 38.40, confidence: 0.78, decision: "watch", shipping: "pickup_only", closesIn: "18h 05m", arv: 280, reasons: ["Brand signal: confidence +0.08", "Moderate margin", "Pickup-only lot."] },
  { id: "3", title: "Vintage Beatles Abbey Road Vinyl Sealed", category: "media", currentBid: 30, maxBid: 22.40, spread: -7.60, confidence: 0.72, decision: "skip", shipping: "shippable", closesIn: "2h 55m", arv: 85, reasons: ["Brand signal: confidence +0.08", "Current bid exceeds MaxBid"] },
  { id: "4", title: "Assorted Jewelry Mystery Lot (50+ pcs)", category: "costume_jewelry", currentBid: 25, maxBid: 2.10, spread: -22.90, confidence: 0.44, decision: "skip", shipping: "shippable", closesIn: "6h 30m", arv: 45, reasons: ["Vague bundle: confidence -0.14", "Current bid exceeds MaxBid"] },
  { id: "5", title: "1966 Ford Mustang Instrument Cluster Original", category: "auto_parts", currentBid: 140, maxBid: 162.50, spread: 22.50, confidence: 0.76, decision: "watch", shipping: "pickup_only", closesIn: "23h 59m", arv: 165, reasons: ["Brand signal: confidence +0.08", "Moderate margin"] },
  { id: "6", title: "Sterling Silver Bracelet 925 Estate", category: "fine_jewelry", currentBid: 35, maxBid: 89.54, spread: 54.54, confidence: 0.88, decision: "bid", shipping: "shippable", closesIn: "1h 20m", arv: 220, reasons: ["Precious-metal keyword.", "Strong margin", "Closing within 24 hours."] },
  { id: "7", title: "Drill Press Industrial Heavy Duty 15-Speed", category: "tools", currentBid: 55, maxBid: 28.85, spread: -26.15, confidence: 0.70, decision: "skip", shipping: "pickup_only", closesIn: "11h 00m", arv: 85, reasons: ["Current bid exceeds MaxBid"] },
  { id: "8", title: "Samsonite Briefcase Vintage Leather Brown", category: "fashion", currentBid: 12, maxBid: 8.32, spread: -3.68, confidence: 0.52, decision: "maybe", shipping: "shippable", closesIn: "8h 45m", arv: 40, reasons: ["Thin margin", "Confidence below 0.60"] },
  { id: "9", title: "Tabletop German Cuckoo Clock Black Forest", category: "art_decor", currentBid: 18, maxBid: 14.50, spread: -3.50, confidence: 0.60, decision: "maybe", shipping: "shippable", closesIn: "15h 10m", arv: 65, reasons: ["Thin margin"] },
  { id: "10", title: "Paasche Airbrush Spray Gun Kit Professional", category: "tools", currentBid: 40, maxBid: 78.75, spread: 38.75, confidence: 0.78, decision: "bid", shipping: "shippable", closesIn: "3h 30m", arv: 220, reasons: ["Brand signal: confidence +0.08", "Strong margin"] },
];

const DECISION_COLORS: Record<Decision, string> = {
  bid:   "bg-green-500 text-black",
  watch: "bg-yellow-400 text-black",
  maybe: "bg-orange-400 text-black",
  skip:  "bg-red-600 text-white",
};

const FILTERS: Array<{ label: string; value: Decision | "all" }> = [
  { label: "All", value: "all" },
  { label: "Bid", value: "bid" },
  { label: "Watch", value: "watch" },
  { label: "Maybe", value: "maybe" },
  { label: "Skip", value: "skip" },
];

const CATS: Array<{ label: string; value: Category | "all" }> = [
  { label: "All", value: "all" },
  { label: "Fine Jewelry", value: "fine_jewelry" },
  { label: "Tools", value: "tools" },
  { label: "Media", value: "media" },
  { label: "Auto Parts", value: "auto_parts" },
  { label: "Art / Decor", value: "art_decor" },
  { label: "Fashion", value: "fashion" },
];

export default function DashboardPage() {
  const [decisionFilter, setDecisionFilter] = useState<Decision | "all">("all");
  const [catFilter, setCatFilter] = useState<Category | "all">("all");
  const [expanded, setExpanded] = useState<string | null>(null);

  const lots = useMemo(() => {
    return MOCK_LOTS
      .filter(l => decisionFilter === "all" || l.decision === decisionFilter)
      .filter(l => catFilter === "all" || l.category === catFilter)
      .sort((a, b) => b.spread - a.spread);
  }, [decisionFilter, catFilter]);

  const counts = useMemo(() => ({
    bid:   MOCK_LOTS.filter(l => l.decision === "bid").length,
    watch: MOCK_LOTS.filter(l => l.decision === "watch").length,
    maybe: MOCK_LOTS.filter(l => l.decision === "maybe").length,
    skip:  MOCK_LOTS.filter(l => l.decision === "skip").length,
  }), []);

  return (
    <main className="min-h-screen bg-gray-950 text-gray-100 font-mono">
      {/* Header */}
      <header className="border-b border-gray-800 px-8 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-yellow-400">bidlot</h1>
          <p className="text-xs text-gray-500 mt-0.5">Auction Intelligence OS — v1/dashboard-ui</p>
        </div>
        <div className="flex gap-6 text-sm">
          <div className="text-center"><p className="text-green-400 font-bold text-lg">{counts.bid}</p><p className="text-gray-500 text-xs">BID</p></div>
          <div className="text-center"><p className="text-yellow-400 font-bold text-lg">{counts.watch}</p><p className="text-gray-500 text-xs">WATCH</p></div>
          <div className="text-center"><p className="text-orange-400 font-bold text-lg">{counts.maybe}</p><p className="text-gray-500 text-xs">MAYBE</p></div>
          <div className="text-center"><p className="text-red-500 font-bold text-lg">{counts.skip}</p><p className="text-gray-500 text-xs">SKIP</p></div>
        </div>
      </header>

      {/* Filters */}
      <div className="px-8 py-4 border-b border-gray-800 flex flex-wrap gap-4">
        <div className="flex gap-2">
          {FILTERS.map(f => (
            <button key={f.value} onClick={() => setDecisionFilter(f.value)}
              className={`px-3 py-1 rounded text-xs font-bold uppercase transition ${
                decisionFilter === f.value ? "bg-yellow-400 text-black" : "bg-gray-800 text-gray-400 hover:bg-gray-700"
              }`}>{f.label}</button>
          ))}
        </div>
        <div className="flex gap-2 flex-wrap">
          {CATS.map(c => (
            <button key={c.value} onClick={() => setCatFilter(c.value)}
              className={`px-3 py-1 rounded text-xs font-bold uppercase transition ${
                catFilter === c.value ? "bg-gray-200 text-black" : "bg-gray-800 text-gray-500 hover:bg-gray-700"
              }`}>{c.label}</button>
          ))}
        </div>
      </div>

      {/* Lot feed */}
      <div className="px-8 py-6 flex flex-col gap-3 max-w-4xl">
        {lots.length === 0 && <p className="text-gray-500 text-sm">No lots match the current filters.</p>}
        {lots.map(lot => (
          <div key={lot.id} className="bg-gray-900 border border-gray-800 rounded-xl p-4 hover:border-gray-600 transition cursor-pointer"
            onClick={() => setExpanded(expanded === lot.id ? null : lot.id)}>
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <p className="font-bold truncate text-sm">{lot.title}</p>
                <p className="text-xs text-gray-500 mt-0.5">
                  {lot.category.replace(/_/g, " ")} · {lot.shipping === "shippable" ? "Shippable" : "Pickup only"} · Closes {lot.closesIn}
                </p>
              </div>
              <span className={`px-3 py-0.5 rounded-full text-xs font-bold uppercase flex-shrink-0 ${DECISION_COLORS[lot.decision]}`}>
                {lot.decision}
              </span>
            </div>

            <div className="flex gap-4 mt-3 text-xs">
              <div><p className="text-gray-500">Current Bid</p><p className="font-semibold text-gray-200">${lot.currentBid}</p></div>
              <div><p className="text-gray-500">Max Bid</p><p className="font-semibold text-green-400">${lot.maxBid}</p></div>
              <div><p className="text-gray-500">Spread</p><p className={`font-semibold ${lot.spread >= 0 ? "text-blue-400" : "text-red-400"}`}>${lot.spread >= 0 ? "+" : ""}{lot.spread}</p></div>
              <div><p className="text-gray-500">ARV</p><p className="font-semibold text-gray-300">${lot.arv}</p></div>
              <div><p className="text-gray-500">Confidence</p><p className="font-semibold text-gray-300">{(lot.confidence * 100).toFixed(0)}%</p></div>
            </div>

            {expanded === lot.id && (
              <div className="mt-3 pt-3 border-t border-gray-800">
                <p className="text-xs text-gray-500 font-semibold mb-1">REASONS</p>
                <ul className="list-disc list-inside space-y-0.5 text-xs text-gray-400">
                  {lot.reasons.map((r, i) => <li key={i}>{r}</li>)}
                </ul>
              </div>
            )}
          </div>
        ))}
      </div>
    </main>
  );
}
