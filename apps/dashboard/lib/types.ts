// bidlot — shared TypeScript types
// Mirrors the Supabase schema in supabase/migrations/001_initial.sql

export type Decision = 'bid' | 'watch' | 'maybe' | 'skip';
export type OutcomeResult = 'won' | 'lost' | 'passed';

// ---------------------------------------------------------------------------
// Lot — a scored auction lot stored in the `lots` table
// ---------------------------------------------------------------------------
export interface Lot {
  id: string;
  lot_url: string;
  source: string;
  title: string;
  category: string;
  shipping_mode: string;
  current_bid: number;
  max_bid: number;
  arv: number;
  margin: number;
  confidence: number;
  decision: Decision;
  location: string;
  estate_type: string;
  sale_date: string;
  time_remaining: string;
  image_url?: string | null;
  imported_at: string;
  updated_at: string;
}

// ---------------------------------------------------------------------------
// Outcome — a resolved auction result stored in the `outcomes` table
// ---------------------------------------------------------------------------
export interface Outcome {
  id: string;
  lot_id?: string | null;
  lot_url: string;
  title: string;
  category: string;
  result: OutcomeResult;
  final_bid?: number | null;
  max_bid?: number | null;
  arv?: number | null;
  actual_sell_price?: number | null;
  profit_loss?: number | null;
  margin_actual?: number | null;
  location: string;
  notes?: string | null;
  closed_at: string;
  created_at: string;
}

// ---------------------------------------------------------------------------
// Database — Supabase type stub (use `supabase gen types typescript` for full)
// ---------------------------------------------------------------------------
export interface Database {
  public: {
    Tables: {
      lots: {
        Row: Lot;
        Insert: Omit<Lot, 'id' | 'imported_at' | 'updated_at'> & {
          id?: string;
          imported_at?: string;
          updated_at?: string;
        };
        Update: Partial<Omit<Lot, 'id'>>;
      };
      outcomes: {
        Row: Outcome;
        Insert: Omit<Outcome, 'id' | 'created_at'> & {
          id?: string;
          created_at?: string;
        };
        Update: Partial<Omit<Outcome, 'id'>>;
      };
    };
    Views: {
      pnl_by_category: {
        Row: {
          category: string;
          won: number;
          lost: number;
          passed: number;
          total_profit: number;
          avg_margin: number;
        };
      };
    };
    Functions: Record<string, never>;
    Enums: Record<string, never>;
  };
}
