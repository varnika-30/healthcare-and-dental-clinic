-- Drop the overly permissive select policy
drop policy if exists "Profiles viewable by authenticated" on public.profiles;

-- Create the new tighter select policy following least-privilege principles
create policy "Profiles select policy" on public.profiles for select to authenticated
  using (
    id = auth.uid() 
    or public.is_staff(auth.uid()) 
    or role in ('admin', 'doctor', 'receptionist')
  );

-- Update handle_new_user trigger to support secure app_metadata roles for staff accounts
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  target_role public.app_role;
begin
  -- Securely extract role from raw_app_meta_data (which public signUp cannot tamper with)
  target_role := coalesce((new.raw_app_meta_data->>'role')::public.app_role, 'patient');

  -- Insert profile
  insert into public.profiles (id, role, full_name, phone)
  values (new.id, target_role, coalesce(new.raw_user_meta_data->>'full_name',''), coalesce(new.raw_user_meta_data->>'phone',''));

  -- If patient, insert pending portal_link_request and send notifications to staff
  if target_role = 'patient' then
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
  end if;

  return new;
end; $$;
