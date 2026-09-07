create table if not exists listings (
  id text primary key,
  payload text not null,
  posted_at timestamptz,
  scraped_at timestamptz not null default now()
);

create index if not exists listings_scraped_at_idx on listings (scraped_at desc);
create index if not exists listings_posted_at_idx on listings (posted_at desc);

create table if not exists scrape_runs (
  id text primary key,
  ran_at timestamptz not null default now(),
  ok_sources text not null default '',
  listing_count integer not null default 0,
  error text
);
