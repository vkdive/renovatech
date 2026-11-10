# Renovatech Solutions

React website for Renovatech Solutions, focused on refurbished laptops and computer hardware.

## Development

Use Node.js 20.19 or newer to install dependencies and run Vite:

```sh
npm install
npm run dev
```

## Build and deploy

```sh
npm run build
```

The build writes the static site to the repository root for GitHub Pages. Commit the generated root `index.html` and `assets/` files when deploying.

React components and styles live in `src/`. Node.js is used only for local development and building the static site; GitHub Pages serves the generated files directly.
