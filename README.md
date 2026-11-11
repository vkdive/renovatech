# Renovatech Solutions Laptop Store

Responsive React catalogue for refurbished laptops, with a committed JSON fallback catalogue and a Supabase inventory workspace.

## Development and build

Use Node.js 20.19 or newer:

```sh
npm install
npm run dev
```

Create a local `.env` from `.env.example` and add the Supabase project URL and publishable key to connect the live catalogue and admin page. Without Supabase configuration, the storefront uses `src/products.json` and the admin page displays setup instructions.

Build and deploy the static files with:

```sh
npm run build
```

The build writes the storefront to `dist/` and creates the admin page at `dist/admin/index.html` (served at `/admin/`) and login page at `/admin/login/`. The repository root is also updated for manual branch-based publishing. GitHub Actions deploys the `dist/` directory to GitHub Pages when source files change.

## Supabase setup

1. Create a Supabase project. In **Project Settings → API Keys**, copy the project URL and publishable key. Do not use a secret or `service_role` key in this browser app.
2. For a new project, open **SQL Editor** and run [`supabase/schema.sql`](supabase/schema.sql). For an existing project, take a database backup, then run [`supabase/migrations/20261111000100_normalize_products.sql`](supabase/migrations/20261111000100_normalize_products.sql) to add and backfill the canonical fields (including `brand`, even if the old table lacks it). Run `schema.sql` afterward to ensure policies, storage, and realtime settings are in place. Deploy the app and verify inventory reads and edits. Only then run [`supabase/migrations/20261111000200_drop_legacy_product_columns.sql`](supabase/migrations/20261111000200_drop_legacy_product_columns.sql) to remove the duplicate columns. This staged migration avoids breaking the currently deployed app. Each script refreshes the Data API schema cache. Catalogue reads are public; inventory and image writes require an active staff record.
3. In **Authentication → Users**, create or invite each admin/staff user with an email and password. Disable public sign-ups in the Auth settings so visitors cannot create accounts.
4. Authorize each account by running this query in the SQL Editor, replacing the email:

   ```sql
   insert into public.staff_profiles (user_id, role, active)
   select id, 'admin', true
   from auth.users
   where lower(email) = lower('admin@example.com')
   on conflict (user_id) do update
   set role = excluded.role, active = true;
   ```

   Use `'staff'` instead of `'admin'` for a staff account. Both roles can add, edit, and delete inventory. Set `active = false` to revoke dashboard access while retaining the user account.
5. For local use, copy `.env.example` to `.env` and set `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY`. For GitHub Pages, add repository **Actions variables** with those same names under **Settings → Secrets and variables → Actions**. These values are included in the browser bundle; Supabase row-level security protects the data.
6. Deploy the site and open `/admin/`. Visitors without an authorized session are redirected to `/admin/login/`; authorized users sign in with their email and password and then return to the dashboard. The first visit to an empty inventory has an **Import saved catalogue** action to load products from `src/products.json`; admins and staff can then upload photos, edit products, and delete products. Storefront changes update as inventory changes.

The website is static hosted on GitHub Pages. Supabase provides authentication, database, and image storage; no Node server runs in production. `src/products.json` is the static fallback and initial import source. The database stores one canonical set of product fields: brand, model number, processor, memory, storage, GPU, display, OS, price, quantity, and image paths. Once the catalogue has been imported, use `/admin/` to add or edit products in the live Supabase inventory.
