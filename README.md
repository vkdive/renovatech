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

The build reads the `Stock List` worksheet in `stock_list.xlsx`, refreshes `src/products.json`, and writes the static site to the repository root for GitHub Pages. Keep the workbook beside `package.json` when rebuilding. Commit the updated root `index.html`, `assets/`, and `src/products.json` files when deploying. The workbook does not specify a currency, so the catalogue currently formats its prices in Indian rupees.

React components and styles live in `src/`. Update the workbook and run `npm run build` to publish refreshed prices and quantities. GitHub Pages serves the generated files directly; no Node server is needed in production.
