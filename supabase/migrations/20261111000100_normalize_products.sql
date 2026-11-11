-- Add and backfill canonical fields on an existing catalogue.
-- Run before deploying the app version that uses only these fields.
begin;

alter table public.products
  add column if not exists brand text,
  add column if not exists model_number text,
  add column if not exists processor text,
  add column if not exists memory text,
  add column if not exists storage text,
  add column if not exists gpu text,
  add column if not exists display text,
  add column if not exists operating_system text,
  add column if not exists price numeric(12, 2) not null default 0,
  add column if not exists quantity integer not null default 0,
  add column if not exists image_url text,
  add column if not exists image_path text,
  add column if not exists created_at timestamptz not null default now(),
  add column if not exists updated_at timestamptz not null default now();

create table if not exists public.product_images (
  id uuid primary key default gen_random_uuid(),
  product_id text not null references public.products (id) on delete cascade,
  image_url text not null,
  image_path text,
  position integer not null default 0 check (position >= 0),
  created_at timestamptz not null default now()
);
do $$
begin
  if not exists (
    select 1
    from pg_constraint c
    where c.contype = 'f'
      and c.conrelid = 'public.product_images'::regclass
      and c.confrelid = 'public.products'::regclass
      and array_length(c.conkey, 1) = 1
      and array_length(c.confkey, 1) = 1
      and (select attname from pg_attribute where attrelid = c.conrelid and attnum = c.conkey[1]) = 'product_id'
      and (select attname from pg_attribute where attrelid = c.confrelid and attnum = c.confkey[1]) = 'id'
  ) then
    alter table public.product_images
      add constraint product_images_product_id_fkey
      foreign key (product_id) references public.products (id) on delete cascade;
  end if;
end;
$$;
create index if not exists product_images_product_position_idx
  on public.product_images (product_id, position, id);

-- Preserve the existing single image as image 1 before the app starts using the
-- product_images relation. The NOT EXISTS clause makes this safe to rerun.
insert into public.product_images (product_id, image_url, image_path, position)
select
  p.id,
  nullif(btrim(to_jsonb(p) ->> 'image_url'), ''),
  nullif(btrim(to_jsonb(p) ->> 'image_path'), ''),
  0
from public.products p
where nullif(btrim(to_jsonb(p) ->> 'image_url'), '') is not null
  and not exists (
    select 1
    from public.product_images pi
    where pi.product_id = p.id
      and pi.image_url = nullif(btrim(to_jsonb(p) ->> 'image_url'), '')
      and pi.image_path is not distinct from nullif(btrim(to_jsonb(p) ->> 'image_path'), '')
  );

-- Read legacy values through JSON so this works whether optional old columns exist or not.
with original as (
  select id, to_jsonb(p) as data
  from public.products p
), source_values as (
  select
    id,
    data,
    nullif(btrim(data ->> 'model'), '') as old_model,
    nullif(btrim(data ->> 'configuration'), '') as old_configuration,
    nullif(btrim(data ->> 'model_number'), '') as old_model_number,
    nullif(btrim(data ->> 'processor'), '') as old_processor,
    nullif(btrim(data ->> 'generation'), '') as old_generation,
    coalesce(
      nullif(nullif(btrim(data ->> 'brand'), ''), 'Other'),
      case
        when nullif(btrim(data ->> 'model'), '') is null then null
        when lower(split_part(btrim(data ->> 'model'), ' ', 1)) = 'hp' then 'HP'
        else initcap(split_part(btrim(data ->> 'model'), ' ', 1))
      end,
      'Other'
    ) as inferred_brand
  from original
), normalized as (
  select
    id,
    inferred_brand,
    coalesce(
      old_model_number,
      case
        when old_model is null then ''
        when lower(old_model) like lower(inferred_brand) || ' %'
          then btrim(substring(old_model from length(inferred_brand) + 2))
        else old_model
      end
    ) as normalized_model_number,
    coalesce(
      old_generation,
      case
        when old_configuration is not null
          then substring(lower(old_configuration) from '([0-9]+(st|nd|rd|th))') || ' Gen'
      end
    ) as normalized_generation,
    coalesce(
      old_processor,
      case
        when old_configuration is not null
          then 'Core ' || substring(lower(old_configuration) from '\m(i[3579])\s+[0-9]+(st|nd|rd|th)')
      end
    ) as normalized_processor,
    coalesce(
      nullif(btrim(data ->> 'memory'), ''),
      nullif(btrim(data ->> 'memory_spec'), ''),
      case
        when nullif(btrim(data ->> 'ram_gb'), '') is not null then btrim(data ->> 'ram_gb') || ' GB'
        when old_configuration is not null then substring(old_configuration from '([0-9]+)\s*/') || ' GB'
      end
    ) as normalized_memory,
    coalesce(
      nullif(btrim(data ->> 'storage'), ''),
      nullif(btrim(data ->> 'storage_spec'), ''),
      case
        when nullif(btrim(data ->> 'storage_gb'), '') is not null then btrim(data ->> 'storage_gb') || ' GB'
        when old_configuration is not null then substring(old_configuration from '/\s*([0-9]+)') || ' GB'
      end
    ) as normalized_storage,
    coalesce(
      nullif(btrim(data ->> 'gpu'), ''),
      case
        when nullif(btrim(data ->> 'graphics_gb'), '') is not null then btrim(data ->> 'graphics_gb') || ' GB graphics'
        when old_configuration is not null
          then substring(lower(old_configuration) from '([0-9]+)\s*gb?\s+graphics') || ' GB graphics'
      end
    ) as normalized_gpu,
    nullif(btrim(data ->> 'display'), '') as normalized_display,
    coalesce(
      nullif(btrim(data ->> 'operating_system'), ''),
      nullif(btrim(data ->> 'os'), '')
    ) as normalized_operating_system
  from source_values
)
update public.products as p
set
  brand = normalized.inferred_brand,
  model_number = normalized.normalized_model_number,
  processor = nullif(concat_ws(
    ' · ',
    normalized.normalized_processor,
    case
      when normalized.normalized_generation is not null
        and (
          normalized.normalized_processor is null
          or normalized.normalized_processor not ilike '%' || normalized.normalized_generation || '%'
        )
        then normalized.normalized_generation
    end
  ), ''),
  memory = normalized.normalized_memory,
  storage = normalized.normalized_storage,
  gpu = normalized.normalized_gpu,
  display = normalized.normalized_display,
  operating_system = normalized.normalized_operating_system
from normalized
where p.id = normalized.id;

update public.products set brand = 'Other' where brand is null or btrim(brand) = '';
update public.products set model_number = '' where model_number is null;
update public.products set price = 0 where price is null;
update public.products set quantity = 0 where quantity is null;
update public.products set created_at = now() where created_at is null;
update public.products set updated_at = now() where updated_at is null;

alter table public.products
  alter column brand set default 'Other',
  alter column brand set not null,
  alter column model_number set default '',
  alter column model_number set not null,
  alter column price set default 0,
  alter column price set not null,
  alter column quantity set default 0,
  alter column quantity set not null,
  alter column created_at set default now(),
  alter column created_at set not null,
  alter column updated_at set default now(),
  alter column updated_at set not null;

-- Let the old deployed app keep writing during rollout, while allowing the new
-- app to omit these soon-to-be-dropped NOT NULL columns on inserts.
do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'products' and column_name = 'model'
  ) then
    execute 'alter table public.products alter column model set default ''Unspecified model''';
  end if;
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'products' and column_name = 'configuration'
  ) then
    execute 'alter table public.products alter column configuration set default ''Specifications not provided''';
  end if;
end;
$$;

notify pgrst, 'reload schema';
commit;
