-- Run only after the app using canonical product fields has been deployed
-- and verified. Take a backup first. This does not use CASCADE.
begin;

alter table public.products
  drop column if exists model,
  drop column if exists configuration,
  drop column if exists generation,
  drop column if exists ram_gb,
  drop column if exists storage_gb,
  drop column if exists graphics_gb;

notify pgrst, 'reload schema';
commit;
