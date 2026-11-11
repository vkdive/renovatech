import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const projectRoot = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  root: path.join(projectRoot, 'src'),
  envDir: projectRoot,
  base: './',
  plugins: [react()],
  build: {
    rollupOptions: {
      input: {
        catalogue: path.join(projectRoot, 'src/index.html'),
        admin: path.join(projectRoot, 'src/admin/index.html'),
        adminLogin: path.join(projectRoot, 'src/admin/login/index.html')
      }
    },
    outDir: path.join(projectRoot, 'dist'),
    emptyOutDir: true,
    assetsDir: 'assets'
  }
});
