# Renovatech Solutions Laptop Store

Responsive React catalogue for refurbished laptops, with product details, stock, and pricing loaded from `stock_list.xlsx`.

## Development

Use Node.js 20.19 or newer to install dependencies and run the local development server:

```sh
npm install
npm run dev
```

The development command refreshes the catalogue data from the workbook before starting Vite.

## Build and deploy

```sh
npm run build
```

The build reads the `Stock List` worksheet in `stock_list.xlsx`, refreshes `src/products.json`, and writes the static site to both `dist/` and the repository root. The root output supports manual branch-based publishing; `dist/` is the artifact used by the automated deployment. The workbook does not specify a currency, so the catalogue currently formats its prices in Indian rupees.

React components and styles live in `src/`. To update the live catalogue automatically, commit and push changes to `stock_list.xlsx` on `main`. GitHub Actions will refresh the product data, build the site, and deploy it to Pages. The workflow also runs when source or build files change, and can be started manually from the Actions tab.

For the first deployment, set **Settings → Pages → Build and deployment → Source** to **GitHub Actions**. GitHub Pages serves the generated files directly; no Node server is needed in production. For a local rebuild, run `npm run build`.
