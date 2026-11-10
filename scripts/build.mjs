import { cp, mkdir, readdir, rm } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { build } from 'vite';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const outputDir = path.join(projectRoot, 'dist');

await build({ configFile: path.join(projectRoot, 'vite.config.mjs') });

await mkdir(projectRoot, { recursive: true });
await rm(path.join(projectRoot, 'assets'), { recursive: true, force: true });

for (const entry of await readdir(outputDir)) {
  await cp(path.join(outputDir, entry), path.join(projectRoot, entry), {
    recursive: true,
    force: true
  });
}

await rm(outputDir, { recursive: true, force: true });
