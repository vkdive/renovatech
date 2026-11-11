# Renovatech Solutions Laptop Store

Responsive React catalogue for refurbished laptops, with stock and specifications read from `stock_list.xlsx` and an optional Supabase inventory workspace.

## Development and build

Use Node.js 20.19 or newer:

```sh
npm install
npm run dev
```

The development command refreshes `src/products.json` from the workbook. Create a local `.env` from `.env.example` and add the Supabase project URL and publishable key to connect the live catalogue and admin page. Without Supabase configuration, the storefront uses the workbook-generated catalogue and the admin page displays setup instructions.

Build and deploy the static files with:

```sh
npm run build
```

The build refreshes product data from `stock_list.xlsx`, writes the storefront to `dist/`, and creates the admin page at `dist/admin/index.html` (served at `/admin/`) and login page at `/admin/login/`. The repository root is also updated for manual branch-based publishing. GitHub Actions deploys the `dist/` directory to GitHub Pages when source or workbook files change.

## Supabase setup

1. Create a Supabase project. In **Project Settings → API Keys**, copy the project URL and publishable key. Do not use a secret or `service_role` key in this browser app.
2. Open **SQL Editor**, run [`supabase/schema.sql`](supabase/schema.sql), and confirm it completes. This creates the products and staff access tables, row-level security policies, and the public product image bucket. Catalogue reads are public; inventory and image writes require an active staff record.
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
6. Deploy the site and open `/admin/`. Visitors without an authorized session are redirected to `/admin/login/`; authorized users sign in with their email and password and then return to the dashboard. The first visit to an empty inventory has an **Import current catalogue** action to load the workbook products; admins and staff can then upload photos, edit products, and delete products. Storefront changes update as inventory changes.

The website is static hosted on GitHub Pages. Supabase provides authentication, database, and image storage; no Node server runs in production. Excel updates refresh the local fallback catalogue. Once the live Supabase inventory has been imported, use the admin page to make changes to that live inventory.
