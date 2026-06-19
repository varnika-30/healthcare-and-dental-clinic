-- Add discount columns to treatment_plans
alter table public.treatment_plans add column discount_amount numeric not null default 0.00;
alter table public.treatment_plans add column discount_reason text;

-- Create payment_transactions table
create table public.payment_transactions (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references public.patients(id) on delete cascade,
  plan_id uuid references public.treatment_plans(id) on delete set null,
  amount numeric(10, 2) not null check (amount >= 0),
  payment_method public.payment_method not null default 'cash',
  payment_date timestamptz not null default now(),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Indexes
create index on public.payment_transactions (patient_id);
create index on public.payment_transactions (plan_id);

-- RLS
alter table public.payment_transactions enable row level security;

create policy "transactions read" on public.payment_transactions for select to authenticated
  using (public.is_staff(auth.uid())
    or exists(select 1 from public.patients p where p.id = patient_id and p.user_id = auth.uid()));

create policy "transactions staff write" on public.payment_transactions for all to authenticated
  using (public.is_staff(auth.uid())) with check (public.is_staff(auth.uid()));

-- Trigger
create trigger _transactions_updated before update on public.payment_transactions
  for each row execute function public.tg_set_updated_at();
