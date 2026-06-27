-- Add purpose column to payment_transactions
alter table public.payment_transactions add column purpose text not null default 'Treatment Payment';
