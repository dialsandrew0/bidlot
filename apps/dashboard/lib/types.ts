export type Decision = 'bid' | 'watch' | 'maybe' | 'skip';
export type OutcomeResult = 'won' | 'lost' | 'passed';

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      lots: {
        Row: {
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
          image_url: string | null;
          imported_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          lot_url: string;
          source?: string;
          title: string;
          category?: string;
          shipping_mode?: string;
          current_bid?: number;
          max_bid?: number;
          arv?: number;
          margin?: number;
          confidence?: number;
          decision?: Decision;
          location?: string;
          estate_type?: string;
          sale_date?: string;
          time_remaining?: string;
          image_url?: string | null;
          imported_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          lot_url?: string;
          source?: string;
          title?: string;
          category?: string;
          shipping_mode?: string;
          current_bid?: number;
          max_bid?: number;
          arv?: number;
          margin?: number;
          confidence?: number;
          decision?: Decision;
          location?: string;
          estate_type?: string;
          sale_date?: string;
          time_remaining?: string;
          image_url?: string | null;
          imported_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };

      outcomes: {
        Row: {
          id: string;
          lot_id: string | null;
          lot_url: string;
          title: string;
          category: string;
          result: OutcomeResult;
          final_bid: number | null;
          max_bid: number | null;
          arv: number | null;
          actual_sell_price: number | null;
          profit_loss: number | null;
          margin_actual: number | null;
          location: string;
          notes: string | null;
          closed_at: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          lot_id?: string | null;
          lot_url: string;
          title: string;
          category?: string;
          result: OutcomeResult;
          final_bid?: number | null;
          max_bid?: number | null;
          arv?: number | null;
          actual_sell_price?: number | null;
          profit_loss?: number | null;
          margin_actual?: number | null;
          location?: string;
          notes?: string | null;
          closed_at?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          lot_id?: string | null;
          lot_url?: string;
          title?: string;
          category?: string;
          result?: OutcomeResult;
          final_bid?: number | null;
          max_bid?: number | null;
          arv?: number | null;
          actual_sell_price?: number | null;
          profit_loss?: number | null;
          margin_actual?: number | null;
          location?: string;
          notes?: string | null;
          closed_at?: string;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'outcomes_lot_id_fkey';
            columns: ['lot_id'];
            isOneToOne: false;
            referencedRelation: 'lots';
            referencedColumns: ['id'];
          }
        ];
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
        Relationships: [];
      };
    };

    Functions: {};
    Enums: {};
    CompositeTypes: {};
  };
};
