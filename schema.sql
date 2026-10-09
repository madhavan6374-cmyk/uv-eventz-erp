-- UV Eventz ERP starter schema (review and apply in Supabase SQL Editor).
-- This is a foundation, not a complete production migration.
-- Keep RLS enabled and test both user accounts before adding real customer records.

create extension if not exists pgcrypto;

create table if not exists public.businesses (
  id uuid primary key default gen_random_uuid(),
  name text not null default 'UV Eventz',
  legal_name text,
  address text,
  email text,
  phone text,
  gstin text,
  gst_registration_status text not null default 'not_configured'
    check (gst_registration_status in ('not_configured','registered','not_registered')),
  currency_code char(3) not null default 'INR',
  created_at timestamptz not null default now()
);

create table if not exists public.business_members (
  business_id uuid not null references public.businesses(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'admin' check (role in ('owner','admin','staff','viewer')),
  created_at timestamptz not null default now(),
  primary key (business_id, user_id)
);

create table if not exists public.customers (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  customer_code text not null,
  full_name text not null,
  phone text,
  email text,
  address text,
  source text,
  notes text,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (business_id, customer_code)
);

create table if not exists public.events (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  event_code text not null,
  customer_id uuid not null references public.customers(id),
  title text not null,
  event_type text not null,
  event_date date,
  start_time time,
  end_time time,
  venue text,
  guest_count integer check (guest_count is null or guest_count >= 0),
  budget numeric(12,2) not null default 0 check (budget >= 0),
  status text not null default 'enquiry'
    check (status in ('enquiry','quoted','confirmed','planning','in_progress','completed','cancelled')),
  assigned_to uuid references auth.users(id),
  notes text,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (business_id, event_code)
);

create table if not exists public.quotations (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  event_id uuid not null references public.events(id),
  quotation_number text not null,
  revision integer not null default 1 check (revision > 0),
  issue_date date not null default current_date,
  valid_until date,
  subtotal numeric(12,2) not null default 0,
  discount_amount numeric(12,2) not null default 0,
  tax_amount numeric(12,2) not null default 0,
  total_amount numeric(12,2) not null default 0,
  status text not null default 'draft'
    check (status in ('draft','sent','accepted','rejected','expired','superseded')),
  terms text,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  unique (business_id, quotation_number, revision)
);

create table if not exists public.quotation_items (
  id uuid primary key default gen_random_uuid(),
  quotation_id uuid not null references public.quotations(id) on delete cascade,
  description text not null,
  quantity numeric(10,2) not null default 1 check (quantity > 0),
  unit text not null default 'item',
  unit_price numeric(12,2) not null default 0 check (unit_price >= 0),
  line_total numeric(12,2) not null default 0 check (line_total >= 0)
);

create table if not exists public.invoices (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  event_id uuid not null references public.events(id),
  invoice_number text not null,
  invoice_date date not null default current_date,
  due_date date,
  subtotal numeric(12,2) not null default 0,
  discount_amount numeric(12,2) not null default 0,
  tax_amount numeric(12,2) not null default 0,
  total_amount numeric(12,2) not null default 0,
  status text not null default 'draft'
    check (status in ('draft','issued','partially_paid','paid','overdue','void')),
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  unique (business_id, invoice_number)
);

create table if not exists public.transactions (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  event_id uuid references public.events(id),
  invoice_id uuid references public.invoices(id),
  transaction_type text not null check (transaction_type in ('income','expense','refund')),
  category text not null,
  description text,
  amount numeric(12,2) not null check (amount > 0),
  transaction_date date not null default current_date,
  payment_method text,
  reference_number text,
  counterparty text,
  recorded_by uuid references auth.users(id),
  created_at timestamptz not null default now()
);

create table if not exists public.follow_ups (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  customer_id uuid not null references public.customers(id) on delete cascade,
  event_id uuid references public.events(id) on delete set null,
  due_at timestamptz not null,
  channel text not null default 'manual'
    check (channel in ('manual','email','whatsapp','sms','call')),
  note text not null,
  status text not null default 'pending'
    check (status in ('pending','completed','cancelled')),
  assigned_to uuid references auth.users(id),
  created_at timestamptz not null default now()
);

create index if not exists idx_customers_business on public.customers(business_id);
create index if not exists idx_events_business_date on public.events(business_id, event_date);
create index if not exists idx_events_customer on public.events(customer_id);
create index if not exists idx_invoices_business_status on public.invoices(business_id, status);
create index if not exists idx_transactions_business_date on public.transactions(business_id, transaction_date);
create index if not exists idx_followups_business_due on public.follow_ups(business_id, due_at, status);

-- IMPORTANT SECURITY TODO:
-- Enable RLS on every table and add policies that authorize access only to
-- authenticated members of the relevant business_id. Do not use a permissive
-- "allow all authenticated users" policy in production.
-- Do not insert live business data until those policies have been written,
-- reviewed, and tested for both users.
