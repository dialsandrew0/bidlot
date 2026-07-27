-- bidlot: Initial database schema
-- Run in Supabase SQL editor or via supabase db push

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ============================================================
-- lots table: stores every scored lot from the Chrome extension
-- ============================================================
create table if not exists public.lots (
  id            uuid primary key default uuid_generate_v4(),
  lot_url       text not null unique,
  source        text not null default 'ctbids',
  title         text not null,
  category      text not null default 'unknown',
  shipping_mode text not null default 'unknown',
  current_bid   numeric(10,2) not null default 0,
  max_bid       numeric(10,2) not null default 0,
  arv           numeric(10,2) not null default 0,
  margin        numeric(6,4) not null default 0,
  confidence    numeric(4,3) not null default 0,
  decision      text not null default 'skip'
                check (decision in ('bid','watch','maybe','skip')),
  location      text not null default '',
  estate_type   text not null default '',
  sale_date     text not null default '',
  time_remaining text not null default '',
  image_url     text,
  imported_at   timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- Index for fast inbox/radar queries
create index if not exists lots_decision_idx on public.lots(decision);
create index if not exists lots_imported_at_idx on public.lots(imported_at desc);
create index if not exists lots_category_idx on public.lots(category);

-- ============================================================
-- outcomes table: stores Won/Lost records after auction closes
-- ============================================================
create table if not exists public.outcomes (
  id              uuid primary key default uuid_generate_v4(),
  lot_id          uuid references public.lots(id) on delete set null,
  lot_url         text not null,
  title           text not null,
  category        text not null default 'unknown',
  result          text not null check (result in ('won','lost','passed')),
  final_bid       numeric(10,2),
  max_bid         numeric(10,2),
  arv             numeric(10,2),
  actual_sell_price numeric(10,2),
  profit_loss     numeric(10,2),
  margin_actual   numeric(6,4),
  location        text not null default '',
  notes           text,
  closed_at       timestamptz not null default now(),
  created_at      timestamptz not null default now()
);

create index if not exists outcomes_result_idx on public.outcomes(result);
create index if not exists outcomes_closed_at_idx on public.outcomes(closed_at desc);
create index if not exists outcomes_category_idx on public.outcomes(category);

-- ============================================================
-- Auto-update updated_at on lots
-- ============================================================
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger lots_updated_at
  before update on public.lots
  for each row execute function public.set_updated_at();

-- ============================================================
-- Row Level Security (enable but allow anon reads for now)
-- ============================================================
alter table public.lots enable row level security;
alter table public.outcomes enable row level security;

-- Allow all operations from the service role (used server-side)
create policy "service role full access on lots"
  on public.lots for all
  using (true) with check (true);

create policy "service role full access on outcomes"
  on public.outcomes for all
  using (true) with check (true);

-- ============================================================
-- Handy view: P&L summary per category
-- ============================================================
create or replace view public.pnl_by_category as
select
  category,
  count(*) filter (where result = 'won')  as won,
  count(*) filter (where result = 'lost') as lost,
  count(*) filter (where result = 'passed') as passed,
  coalesce(sum(profit_loss) filter (where result = 'won'), 0) as total_profit,
  coalesce(avg(margin_actual) filter (where result = 'won'), 0) as avg_margin
from public.outcomes
group by category;
