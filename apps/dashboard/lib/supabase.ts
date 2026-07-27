import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

// ---------------------------------------------------------------------------
// Browser / client-side Supabase client
// Uses the anon key — subject to Row Level Security
// ---------------------------------------------------------------------------
export function createBrowserClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) {
    throw new Error(
      '[bidlot] Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY. ' +
      'Copy .env.example to .env.local and fill in your Supabase project values.'
    );
  }
  return createClient<Database>(url, key);
}

// ---------------------------------------------------------------------------
// Server-side Supabase admin client
// Uses the service role key to bypass RLS — NEVER send to the browser
// ---------------------------------------------------------------------------
export function createServerClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error(
      '[bidlot] Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY. ' +
      'Ensure these are set in your Vercel / .env.local environment.'
    );
  }
  return createClient<Database>(url, key, {
    auth: {
      // Service role clients should not persist sessions
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}
