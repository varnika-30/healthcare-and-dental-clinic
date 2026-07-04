-- Create portal_link_requests table
create table public.portal_link_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  full_name text not null,
  email text not null,
  phone text,
  status text not null default 'pending' check (status in ('pending', 'linked', 'cancelled')),
  linked_patient_id uuid references public.patients(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Enable RLS
alter table public.portal_link_requests enable row level security;

-- Redefine is_staff helper function to use profiles table
create or replace function public.is_staff(_uid uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists(
    select 1 from public.profiles
    where id = _uid and role in ('admin','doctor','receptionist')
  )
$$;

-- RLS Policies
create policy "staff manage requests" on public.portal_link_requests 
  for all to authenticated
  using (public.is_staff(auth.uid())) 
  with check (public.is_staff(auth.uid()));

create policy "users view own request" on public.portal_link_requests 
  for select to authenticated
  using (auth.uid() = user_id);

-- Trigger to automatically create a request on signup
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  -- Insert profile
  insert into public.profiles (id, role, full_name, phone)
  values (new.id, 'patient', coalesce(new.raw_user_meta_data->>'full_name',''), coalesce(new.raw_user_meta_data->>'phone',''));

  -- If patient, insert pending portal_link_request and send notifications to staff
  insert into public.portal_link_requests (user_id, full_name, email, phone)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name',''),
    new.email,
    coalesce(new.raw_user_meta_data->>'phone','')
  ) on conflict (user_id) do nothing;

  insert into public.notifications (user_id, type, title, message, is_read)
  select p.id, 'system', 'New Patient Portal Request', coalesce(new.raw_user_meta_data->>'full_name','') || ' registered a portal account and requires linking to their medical chart.', false
  from public.profiles p
  where p.role in ('admin', 'doctor', 'receptionist');

  return new;
end; $$;

-- RPC: Search unlinked patient-role portal accounts
create or replace function public.search_unlinked_portal_accounts(p_search_term text)
returns table(id uuid, user_id uuid, full_name text, email text, phone text, created_at timestamptz)
language plpgsql security definer set search_path = public as $$
begin
  if not public.is_staff(auth.uid()) then
    raise exception 'Unauthorized';
  end if;
  
  return query
  select r.id, r.user_id, r.full_name, r.email, r.phone, r.created_at
  from public.portal_link_requests r
  where r.status = 'pending'
    and (r.full_name ilike '%' || p_search_term || '%'
         or r.email ilike '%' || p_search_term || '%'
         or r.phone ilike '%' || p_search_term || '%');
end; $$;

-- RPC: Search possible patient record matches for a request
create or replace function public.search_patient_matches_for_portal(p_request_id uuid)
returns table(id uuid, first_name text, last_name text, email text, phone text, gender text, dob date)
language plpgsql security definer set search_path = public as $$
declare
  req_name text;
  req_email text;
  req_phone text;
begin
  if not public.is_staff(auth.uid()) then
    raise exception 'Unauthorized';
  end if;

  select full_name, email, phone into req_name, req_email, req_phone
  from public.portal_link_requests
  where id = p_request_id;

  return query
  select p.id, p.first_name, p.last_name, p.email, p.phone, p.gender, p.dob
  from public.patients p
  where p.user_id is null
    and (p.email ilike req_email
         or p.phone = req_phone
         or (p.first_name || ' ' || p.last_name) ilike '%' || req_name || '%'
         or req_name ilike '%' || (p.first_name || ' ' || p.last_name) || '%');
end; $$;

-- RPC: Perform account linking
create or replace function public.link_portal_to_patient(p_request_id uuid, p_patient_id uuid)
returns boolean
language plpgsql security definer set search_path = public as $$
declare
  target_user_id uuid;
  user_role text;
  req_name text;
begin
  -- 1. Authorization Check
  if not public.is_staff(auth.uid()) then
    raise exception 'Unauthorized: Only staff members can link accounts';
  end if;

  -- 2. Retrieve portal user ID and verify request is pending
  select user_id, full_name into target_user_id, req_name
  from public.portal_link_requests
  where id = p_request_id and status = 'pending';

  if target_user_id is null then
    raise exception 'Link request not found or not pending';
  end if;

  -- 3. Verify the user has the 'patient' role from profiles.role
  select role into user_role
  from public.profiles
  where id = target_user_id;

  if user_role != 'patient' then
    raise exception 'Target account does not have the patient role';
  end if;

  -- 4. Verify patient exists and user_id is null
  if not exists(select 1 from public.patients where id = p_patient_id) then
    raise exception 'Target patient record not found';
  end if;

  if exists(select 1 from public.patients where id = p_patient_id and user_id is not null) then
    raise exception 'Target patient is already linked to another portal account';
  end if;

  -- 5. Verify the auth user isn't already linked to another patient
  if exists(select 1 from public.patients where user_id = target_user_id) then
    raise exception 'This portal account is already linked to a patient record';
  end if;

  -- 6. Perform linking transaction
  update public.patients
  set user_id = target_user_id
  where id = p_patient_id;

  update public.portal_link_requests
  set status = 'linked',
      linked_patient_id = p_patient_id,
      updated_at = now()
  where id = p_request_id;

  -- 7. Mark any related staff notifications read
  update public.notifications
  set is_read = true
  where title = 'New Patient Portal Request'
    and message ilike '%' || req_name || '%';

  return true;
end; $$;
