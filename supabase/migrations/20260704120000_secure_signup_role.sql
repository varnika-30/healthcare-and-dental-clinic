-- Secure signup trigger: create profiles with default role = 'patient'
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, role, full_name, phone)
  values (
    new.id,
    'patient',
    coalesce(new.raw_user_meta_data->>'full_name',''),
    coalesce(new.raw_user_meta_data->>'phone','')
  );
  return new;
end; $$;
