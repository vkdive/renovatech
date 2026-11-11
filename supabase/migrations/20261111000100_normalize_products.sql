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

notify pgrst, 'reload schema';
commit;
