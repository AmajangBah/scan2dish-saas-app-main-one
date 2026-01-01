-- Add commission payment receipt metadata + restaurant visibility
-- This enables "admin sends receipt" and restaurant can view receipts in billing.

-- 1) Add receipt columns to commission_payments
alter table public.commission_payments
  add column if not exists receipt_number text,
  add column if not exists receipt_sent_at timestamptz,
  add column if not exists receipt_sent_via text,
  add column if not exists receipt_sent_by uuid references public.admin_users(id);

-- 2) Generate a stable receipt number on insert (and backfill existing rows)
create or replace function public.set_commission_payment_receipt_number()
returns trigger
language plpgsql
as $$
begin
  if new.receipt_number is null or length(trim(new.receipt_number)) = 0 then
    -- Example: CP-20260101-1a2b3c4d
    new.receipt_number :=
      'CP-' ||
      to_char(coalesce(new.payment_date, now()), 'YYYYMMDD') ||
      '-' ||
      left(replace(new.id::text, '-', ''), 8);
  end if;
  return new;
end;
$$;

do $$
begin
  if not exists (
    select 1 from pg_trigger where tgname = 'trg_commission_payments_set_receipt_number'
  ) then
    create trigger trg_commission_payments_set_receipt_number
    before insert on public.commission_payments
    for each row execute function public.set_commission_payment_receipt_number();
  end if;
end $$;

-- Backfill existing rows (safe / idempotent)
update public.commission_payments
set receipt_number =
  'CP-' ||
  to_char(coalesce(payment_date, created_at, now()), 'YYYYMMDD') ||
  '-' ||
  left(replace(id::text, '-', ''), 8)
where receipt_number is null or length(trim(receipt_number)) = 0;

-- Make receipt_number unique (best-effort; ignore if already exists)
do $$
begin
  if not exists (
    select 1
    from pg_indexes
    where schemaname = 'public'
      and indexname = 'uq_commission_payments_receipt_number'
  ) then
    create unique index uq_commission_payments_receipt_number
      on public.commission_payments(receipt_number);
  end if;
end $$;

create index if not exists idx_commission_payments_receipt_sent_at
  on public.commission_payments(receipt_sent_at desc);

-- 3) RLS: allow restaurant owners to view their own commission payments (receipts)
drop policy if exists commission_payments_owner_select on public.commission_payments;
create policy commission_payments_owner_select
on public.commission_payments
for select
to authenticated
using (
  exists (
    select 1
    from public.restaurants r
    where r.id = commission_payments.restaurant_id
      and r.user_id = auth.uid()
  )
);

