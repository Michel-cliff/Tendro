-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Companies table
create table companies (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  siret text not null unique,
  address text,
  sector text,
  region text,
  revenue numeric,
  employees integer,
  description text,
  signature_url text,
  logo_url text,
  legal_representative text,
  representative_title text,
  created_at timestamp with time zone default now()
);

-- Tenders table
create table tenders (
  id uuid primary key default uuid_generate_v4(),
  source text check (source in ('online', 'email')) not null,
  title text not null,
  description text,
  contracting_authority text,
  authority_email text,
  deadline timestamp with time zone,
  budget numeric,
  sector text,
  region text,
  raw_data jsonb,
  created_at timestamp with time zone default now()
);

-- Matches table
create table matches (
  id uuid primary key default uuid_generate_v4(),
  company_id uuid references companies(id) on delete cascade not null,
  tender_id uuid references tenders(id) on delete cascade not null,
  score numeric check (score >= 0 and score <= 100),
  reasoning text,
  source text check (source in ('online', 'email')),
  status text check (status in ('new', 'reviewing', 'submitted', 'rejected', 'won')) default 'new',
  created_at timestamp with time zone default now()
);

-- Submissions table
create table submissions (
  id uuid primary key default uuid_generate_v4(),
  company_id uuid references companies(id) on delete cascade not null,
  tender_id uuid references tenders(id) on delete cascade not null,
  dc1_content jsonb,
  memoire_content text,
  bid_price numeric,
  email_subject text,
  email_body text,
  sent_at timestamp with time zone,
  pdf_url text,
  dc1_pdf_url text,
  memoire_pdf_url text,
  created_at timestamp with time zone default now()
);

-- Rejections table
create table rejections (
  id uuid primary key default uuid_generate_v4(),
  company_id uuid references companies(id) on delete cascade not null,
  tender_id uuid references tenders(id) on delete cascade not null,
  rejection_doc_url text,
  analysis text,
  score_breakdown jsonb,
  improvement_plan jsonb,
  created_at timestamp with time zone default now()
);

-- Cron config table
create table cron_config (
  id uuid primary key default uuid_generate_v4(),
  company_id uuid references companies(id) on delete cascade not null unique,
  frequency text check (frequency in ('hourly', 'daily', 'weekly')) default 'daily',
  keywords text[] default '{}',
  sectors text[] default '{}',
  regions text[] default '{}',
  active boolean default true,
  last_run timestamp with time zone,
  created_at timestamp with time zone default now()
);

-- RLS Policies
alter table companies enable row level security;
alter table matches enable row level security;
alter table submissions enable row level security;
alter table rejections enable row level security;
alter table cron_config enable row level security;

-- Tenders are publicly readable (no user restriction)
alter table tenders enable row level security;
create policy "Tenders are readable by all" on tenders for select using (true);
create policy "Service role can insert tenders" on tenders for insert with check (true);

-- Companies: users only see their own
create policy "Users manage own company" on companies
  for all using (auth.uid() = user_id);

-- Matches: users see matches for their company
create policy "Users see own matches" on matches
  for all using (
    company_id in (select id from companies where user_id = auth.uid())
  );

-- Submissions: users see their own
create policy "Users see own submissions" on submissions
  for all using (
    company_id in (select id from companies where user_id = auth.uid())
  );

-- Rejections: users see their own
create policy "Users see own rejections" on rejections
  for all using (
    company_id in (select id from companies where user_id = auth.uid())
  );

-- Cron config: users see their own
create policy "Users see own cron config" on cron_config
  for all using (
    company_id in (select id from companies where user_id = auth.uid())
  );
