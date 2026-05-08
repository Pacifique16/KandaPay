-- merchant_location_signals
create table if not exists merchant_location_signals (
  id uuid primary key default gen_random_uuid(),
  merchant_code text not null,
  latitude double precision not null,
  longitude double precision not null,
  hashed_user_id text not null,
  timestamp timestamptz not null default now(),
  transaction_count int not null default 1
);
create index on merchant_location_signals (merchant_code);
create index on merchant_location_signals (hashed_user_id);
create index on merchant_location_signals (timestamp);

-- verified_merchants
create table if not exists verified_merchants (
  id uuid primary key default gen_random_uuid(),
  merchant_code text not null unique,
  merchant_name text not null,
  latitude double precision not null,
  longitude double precision not null,
  confidence_score int not null default 0,
  usage_count int not null default 0,
  verified boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index on verified_merchants (verified);
create index on verified_merchants (confidence_score);

-- merchant_aliases
create table if not exists merchant_aliases (
  id uuid primary key default gen_random_uuid(),
  merchant_code text not null,
  alias text not null,
  votes int not null default 1,
  unique(merchant_code, alias)
);
create index on merchant_aliases (merchant_code);

-- merchant_usage_stats
create table if not exists merchant_usage_stats (
  id uuid primary key default gen_random_uuid(),
  merchant_code text not null unique,
  daily_usage int not null default 0,
  weekly_usage int not null default 0,
  monthly_usage int not null default 0
);

-- RLS: allow anonymous inserts for signals
alter table merchant_location_signals enable row level security;
create policy "allow_insert_signals" on merchant_location_signals for insert with check (true);
create policy "allow_read_signals" on merchant_location_signals for select using (true);

alter table verified_merchants enable row level security;
create policy "allow_read_verified" on verified_merchants for select using (true);
create policy "allow_upsert_verified" on verified_merchants for all using (true);

alter table merchant_aliases enable row level security;
create policy "allow_all_aliases" on merchant_aliases for all using (true);

alter table merchant_usage_stats enable row level security;
create policy "allow_all_stats" on merchant_usage_stats for all using (true);

-- Function: get nearby verified merchants within radius (meters)
create or replace function get_nearby_merchants(
  user_lat double precision,
  user_lng double precision,
  radius_meters double precision default 500
)
returns table (
  id uuid,
  merchant_code text,
  merchant_name text,
  latitude double precision,
  longitude double precision,
  confidence_score int,
  usage_count int,
  verified boolean,
  distance_meters double precision
)
language sql
as $$
  select
    id, merchant_code, merchant_name, latitude, longitude,
    confidence_score, usage_count, verified,
    (6371000 * acos(
      cos(radians(user_lat)) * cos(radians(latitude)) *
      cos(radians(longitude) - radians(user_lng)) +
      sin(radians(user_lat)) * sin(radians(latitude))
    )) as distance_meters
  from verified_merchants
  where verified = true
    and (6371000 * acos(
      cos(radians(user_lat)) * cos(radians(latitude)) *
      cos(radians(longitude) - radians(user_lng)) +
      sin(radians(user_lat)) * sin(radians(latitude))
    )) <= radius_meters
  order by distance_meters asc
  limit 10;
$$;
