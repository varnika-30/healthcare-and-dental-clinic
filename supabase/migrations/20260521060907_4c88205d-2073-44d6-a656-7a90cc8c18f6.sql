
-- ============ ENUMS ============
create type public.appointment_status as enum ('requested','confirmed','in_progress','completed','cancelled','no_show');
create type public.appointment_priority as enum ('normal','urgent','emergency');
create type public.queue_status as enum ('waiting','in_room','done','no_show');
create type public.treatment_status as enum ('planned','in_progress','completed','cancelled');
create type public.step_status as enum ('pending','in_progress','completed','skipped');
create type public.tooth_treatment_status as enum ('planned','in_progress','completed');
create type public.invoice_status as enum ('draft','issued','partial','paid','void');
create type public.payment_method as enum ('cash','card','upi','bank_transfer','insurance','other');
create type public.notification_type as enum ('reminder','followup','billing','system');

-- ============ updated_at helper ============
create or replace function public.tg_set_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end $$;

-- ============ helper: is_staff ============
create or replace function public.is_staff(_uid uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists(
    select 1 from public.user_roles
    where user_id = _uid and role in ('admin','doctor','receptionist')
  )
$$;

-- ============ PATIENTS ============
create table public.patients (
  id uuid primary key default gen_random_uuid(),
  user_id uuid unique,                       -- nullable: walk-ins may have no auth account
  full_name text not null,
  phone text,
  email text,
  date_of_birth date,
  gender text,
  blood_group text,
  allergies text,
  medical_notes text,
  emergency_contact_name text,
  emergency_contact_phone text,
  family_head_id uuid references public.patients(id) on delete set null,
  relationship_to_head text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index on public.patients (user_id);
create index on public.patients (family_head_id);
create index on public.patients (full_name);
alter table public.patients enable row level security;

create policy "patients self read" on public.patients for select to authenticated
  using (user_id = auth.uid() or public.is_staff(auth.uid()));
create policy "patients self update" on public.patients for update to authenticated
  using (user_id = auth.uid() or public.is_staff(auth.uid()));
create policy "patients staff insert" on public.patients for insert to authenticated
  with check (public.is_staff(auth.uid()) or user_id = auth.uid());
create policy "patients staff delete" on public.patients for delete to authenticated
  using (public.is_staff(auth.uid()));

create trigger _patients_updated before update on public.patients
  for each row execute function public.tg_set_updated_at();

-- ============ FAMILY LINKS ============
create table public.family_links (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references public.patients(id) on delete cascade,
  related_name text not null,         -- free-text relative/reference name (for smart search)
  relationship text,                  -- e.g. "sister", "father", "referred by"
  related_patient_id uuid references public.patients(id) on delete set null,
  created_at timestamptz not null default now()
);
create index on public.family_links (patient_id);
create index on public.family_links (related_name);
alter table public.family_links enable row level security;

create policy "family_links read" on public.family_links for select to authenticated
  using (public.is_staff(auth.uid())
    or exists(select 1 from public.patients p where p.id = patient_id and p.user_id = auth.uid()));
create policy "family_links staff write" on public.family_links for all to authenticated
  using (public.is_staff(auth.uid())) with check (public.is_staff(auth.uid()));

-- ============ APPOINTMENTS ============
create table public.appointments (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references public.patients(id) on delete cascade,
  doctor_id uuid references auth.users(id) on delete set null,
  service text not null,
  scheduled_at timestamptz not null,
  duration_minutes int not null default 30,
  status public.appointment_status not null default 'requested',
  priority public.appointment_priority not null default 'normal',
  notes text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index on public.appointments (patient_id);
create index on public.appointments (doctor_id);
create index on public.appointments (scheduled_at);
create index on public.appointments (status);
alter table public.appointments enable row level security;

create policy "appointments read" on public.appointments for select to authenticated
  using (public.is_staff(auth.uid())
    or exists(select 1 from public.patients p where p.id = patient_id and p.user_id = auth.uid()));
create policy "appointments patient request" on public.appointments for insert to authenticated
  with check (public.is_staff(auth.uid())
    or exists(select 1 from public.patients p where p.id = patient_id and p.user_id = auth.uid()));
create policy "appointments staff update" on public.appointments for update to authenticated
  using (public.is_staff(auth.uid())
    or exists(select 1 from public.patients p where p.id = patient_id and p.user_id = auth.uid() and status='requested'));
create policy "appointments staff delete" on public.appointments for delete to authenticated
  using (public.is_staff(auth.uid()));

create trigger _appointments_updated before update on public.appointments
  for each row execute function public.tg_set_updated_at();

-- ============ QUEUE TOKENS ============
create table public.queue_tokens (
  id uuid primary key default gen_random_uuid(),
  appointment_id uuid references public.appointments(id) on delete set null,
  patient_id uuid not null references public.patients(id) on delete cascade,
  token_number int not null,
  status public.queue_status not null default 'waiting',
  queued_at timestamptz not null default now(),
  called_at timestamptz,
  done_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index on public.queue_tokens (status);
create index on public.queue_tokens (queued_at);
alter table public.queue_tokens enable row level security;

create policy "queue read" on public.queue_tokens for select to authenticated
  using (public.is_staff(auth.uid())
    or exists(select 1 from public.patients p where p.id = patient_id and p.user_id = auth.uid()));
create policy "queue staff write" on public.queue_tokens for all to authenticated
  using (public.is_staff(auth.uid())) with check (public.is_staff(auth.uid()));

create trigger _queue_updated before update on public.queue_tokens
  for each row execute function public.tg_set_updated_at();

-- ============ TREATMENT PLANS / STEPS ============
create table public.treatment_plans (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references public.patients(id) on delete cascade,
  doctor_id uuid references auth.users(id) on delete set null,
  title text not null,
  description text,
  status public.treatment_status not null default 'planned',
  started_at date,
  completed_at date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index on public.treatment_plans (patient_id);
alter table public.treatment_plans enable row level security;

create policy "plans read" on public.treatment_plans for select to authenticated
  using (public.is_staff(auth.uid())
    or exists(select 1 from public.patients p where p.id = patient_id and p.user_id = auth.uid()));
create policy "plans staff write" on public.treatment_plans for all to authenticated
  using (public.is_staff(auth.uid())) with check (public.is_staff(auth.uid()));

create trigger _plans_updated before update on public.treatment_plans
  for each row execute function public.tg_set_updated_at();

create table public.treatment_steps (
  id uuid primary key default gen_random_uuid(),
  plan_id uuid not null references public.treatment_plans(id) on delete cascade,
  step_order int not null,
  title text not null,
  status public.step_status not null default 'pending',
  notes text,
  due_at date,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index on public.treatment_steps (plan_id);
alter table public.treatment_steps enable row level security;

create policy "steps read" on public.treatment_steps for select to authenticated
  using (public.is_staff(auth.uid())
    or exists(select 1 from public.treatment_plans tp join public.patients p on p.id=tp.patient_id
              where tp.id = plan_id and p.user_id = auth.uid()));
create policy "steps staff write" on public.treatment_steps for all to authenticated
  using (public.is_staff(auth.uid())) with check (public.is_staff(auth.uid()));

create trigger _steps_updated before update on public.treatment_steps
  for each row execute function public.tg_set_updated_at();

-- ============ TOOTH TREATMENTS ============
create table public.tooth_treatments (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references public.patients(id) on delete cascade,
  doctor_id uuid references auth.users(id) on delete set null,
  plan_id uuid references public.treatment_plans(id) on delete set null,
  tooth_number int not null check (tooth_number between 11 and 48),  -- FDI numbering
  procedure text not null,
  status public.tooth_treatment_status not null default 'planned',
  notes text,
  performed_at date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index on public.tooth_treatments (patient_id);
create index on public.tooth_treatments (tooth_number);
alter table public.tooth_treatments enable row level security;

create policy "tooth read" on public.tooth_treatments for select to authenticated
  using (public.is_staff(auth.uid())
    or exists(select 1 from public.patients p where p.id = patient_id and p.user_id = auth.uid()));
create policy "tooth staff write" on public.tooth_treatments for all to authenticated
  using (public.is_staff(auth.uid())) with check (public.is_staff(auth.uid()));

create trigger _tooth_updated before update on public.tooth_treatments
  for each row execute function public.tg_set_updated_at();

-- ============ PRESCRIPTIONS ============
create table public.prescriptions (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references public.patients(id) on delete cascade,
  doctor_id uuid references auth.users(id) on delete set null,
  appointment_id uuid references public.appointments(id) on delete set null,
  diagnosis text,
  notes text,
  issued_at date not null default current_date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index on public.prescriptions (patient_id);
alter table public.prescriptions enable row level security;

create policy "rx read" on public.prescriptions for select to authenticated
  using (public.is_staff(auth.uid())
    or exists(select 1 from public.patients p where p.id = patient_id and p.user_id = auth.uid()));
create policy "rx staff write" on public.prescriptions for all to authenticated
  using (public.is_staff(auth.uid())) with check (public.is_staff(auth.uid()));

create trigger _rx_updated before update on public.prescriptions
  for each row execute function public.tg_set_updated_at();

create table public.prescription_items (
  id uuid primary key default gen_random_uuid(),
  prescription_id uuid not null references public.prescriptions(id) on delete cascade,
  medication text not null,
  dosage text,
  frequency text,
  duration text,
  instructions text,
  created_at timestamptz not null default now()
);
create index on public.prescription_items (prescription_id);
alter table public.prescription_items enable row level security;

create policy "rx_items read" on public.prescription_items for select to authenticated
  using (public.is_staff(auth.uid())
    or exists(select 1 from public.prescriptions rx join public.patients p on p.id=rx.patient_id
              where rx.id = prescription_id and p.user_id = auth.uid()));
create policy "rx_items staff write" on public.prescription_items for all to authenticated
  using (public.is_staff(auth.uid())) with check (public.is_staff(auth.uid()));

-- ============ INVOICES / ITEMS / PAYMENTS ============
create table public.invoices (
  id uuid primary key default gen_random_uuid(),
  invoice_number text unique not null default ('INV-'||to_char(now(),'YYYYMMDD')||'-'||substr(gen_random_uuid()::text,1,6)),
  patient_id uuid not null references public.patients(id) on delete cascade,
  plan_id uuid references public.treatment_plans(id) on delete set null,
  subtotal numeric(10,2) not null default 0,
  tax numeric(10,2) not null default 0,
  total numeric(10,2) not null default 0,
  amount_paid numeric(10,2) not null default 0,
  balance numeric(10,2) not null default 0,
  status public.invoice_status not null default 'draft',
  is_current boolean not null default true,    -- true = ongoing treatment (patient can see)
  due_date date,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index on public.invoices (patient_id);
create index on public.invoices (status);
alter table public.invoices enable row level security;

-- Patients see only CURRENT invoices; staff see all.
create policy "invoices read" on public.invoices for select to authenticated
  using (public.is_staff(auth.uid())
    or (is_current = true and exists(select 1 from public.patients p where p.id = patient_id and p.user_id = auth.uid())));
create policy "invoices staff write" on public.invoices for all to authenticated
  using (public.is_staff(auth.uid())) with check (public.is_staff(auth.uid()));

create trigger _invoices_updated before update on public.invoices
  for each row execute function public.tg_set_updated_at();

create table public.invoice_items (
  id uuid primary key default gen_random_uuid(),
  invoice_id uuid not null references public.invoices(id) on delete cascade,
  description text not null,
  quantity int not null default 1,
  unit_price numeric(10,2) not null default 0,
  amount numeric(10,2) not null default 0,
  created_at timestamptz not null default now()
);
create index on public.invoice_items (invoice_id);
alter table public.invoice_items enable row level security;
create policy "invoice_items read" on public.invoice_items for select to authenticated
  using (exists(select 1 from public.invoices i where i.id = invoice_id
        and (public.is_staff(auth.uid())
             or (i.is_current = true and exists(select 1 from public.patients p where p.id = i.patient_id and p.user_id = auth.uid())))));
create policy "invoice_items staff write" on public.invoice_items for all to authenticated
  using (public.is_staff(auth.uid())) with check (public.is_staff(auth.uid()));

create table public.payments (
  id uuid primary key default gen_random_uuid(),
  invoice_id uuid not null references public.invoices(id) on delete cascade,
  amount numeric(10,2) not null,
  method public.payment_method not null default 'cash',
  paid_at timestamptz not null default now(),
  reference text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);
create index on public.payments (invoice_id);
alter table public.payments enable row level security;
create policy "payments read" on public.payments for select to authenticated
  using (exists(select 1 from public.invoices i where i.id = invoice_id
        and (public.is_staff(auth.uid())
             or (i.is_current = true and exists(select 1 from public.patients p where p.id = i.patient_id and p.user_id = auth.uid())))));
create policy "payments staff write" on public.payments for all to authenticated
  using (public.is_staff(auth.uid())) with check (public.is_staff(auth.uid()));

-- ============ NOTIFICATIONS ============
create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  type public.notification_type not null default 'system',
  title text not null,
  body text,
  read_at timestamptz,
  created_at timestamptz not null default now()
);
create index on public.notifications (user_id);
alter table public.notifications enable row level security;
create policy "notif self read" on public.notifications for select to authenticated
  using (user_id = auth.uid() or public.is_staff(auth.uid()));
create policy "notif self update" on public.notifications for update to authenticated
  using (user_id = auth.uid());
create policy "notif staff insert" on public.notifications for insert to authenticated
  with check (public.is_staff(auth.uid()) or user_id = auth.uid());
