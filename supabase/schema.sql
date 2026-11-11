-- Initial schema for a new project. Existing projects should first run
-- migrations/20261111000100_normalize_products.sql, then this script.

create table if not exists public.staff_profiles (
  user_id uuid primary key references auth.users (id) on delete cascade,
  role text not null check (role in ('admin', 'staff')),
  active boolean not null default true,
  created_at timestamptz not null default now()
);

alter table public.staff_profiles enable row level security;
revoke all on table public.staff_profiles from anon, authenticated;
grant select on table public.staff_profiles to authenticated;
drop policy if exists "Staff can read their own access record" on public.staff_profiles;
create policy "Staff can read their own access record"
  on public.staff_profiles for select to authenticated
  using ((select auth.uid()) = user_id);

create or replace function public.has_inventory_access()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.staff_profiles
    where user_id = (select auth.uid())
      and active = true
      and role in ('admin', 'staff')
  );
$$;

revoke all on function public.has_inventory_access() from public;
grant execute on function public.has_inventory_access() to anon, authenticated;

create table if not exists public.products (
  id text primary key,
  brand text not null default 'Other',
  model_number text not null default '',
  processor text,
  memory text,
  storage text,
  gpu text,
  display text,
  operating_system text,
  price numeric(12, 2) not null check (price >= 0),
  quantity integer not null check (quantity >= 0),
  image_url text,
  image_path text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.products enable row level security;
revoke all on table public.products from anon, authenticated;
grant select on table public.products to anon, authenticated;
grant insert, update, delete on table public.products to authenticated;
drop policy if exists "Anyone can view catalogue products" on public.products;
create policy "Anyone can view catalogue products"
  on public.products for select to anon, authenticated
  using (true);
drop policy if exists "Authorized staff can insert products" on public.products;
create policy "Authorized staff can insert products"
  on public.products for insert to authenticated
  with check ((select public.has_inventory_access()));
drop policy if exists "Authorized staff can update products" on public.products;
create policy "Authorized staff can update products"
  on public.products for update to authenticated
  using ((select public.has_inventory_access()))
  with check ((select public.has_inventory_access()));
drop policy if exists "Authorized staff can delete products" on public.products;
create policy "Authorized staff can delete products"
  on public.products for delete to authenticated
  using ((select public.has_inventory_access()));

create or replace function public.set_products_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_products_updated_at on public.products;
create trigger set_products_updated_at
  before update on public.products
  for each row execute function public.set_products_updated_at();

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('product-images', 'product-images', true, 5242880, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Public can view product images" on storage.objects;
create policy "Public can view product images"
  on storage.objects for select to anon, authenticated
  using (bucket_id = 'product-images');
drop policy if exists "Authorized staff can upload product images" on storage.objects;
create policy "Authorized staff can upload product images"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'product-images' and (select public.has_inventory_access()));
drop policy if exists "Authorized staff can update product images" on storage.objects;
create policy "Authorized staff can update product images"
  on storage.objects for update to authenticated
  using (bucket_id = 'product-images' and (select public.has_inventory_access()))
  with check (bucket_id = 'product-images' and (select public.has_inventory_access()));
drop policy if exists "Authorized staff can delete product images" on storage.objects;
create policy "Authorized staff can delete product images"
  on storage.objects for delete to authenticated
  using (bucket_id = 'product-images' and (select public.has_inventory_access()));

do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'products'
  ) then
    alter publication supabase_realtime add table public.products;
  end if;
end;
$$;

-- Make new or altered columns visible to the Supabase Data API immediately.
notify pgrst, 'reload schema';
