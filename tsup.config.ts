import { defineConfig } from 'tsup';
import { copyFileSync, mkdirSync } from 'node:fs';

export default defineConfig({
  entry: ['src/index.ts'],
  outDir: 'dist',
  format: ['esm'],
  clean: true,
  dts: true,
  sourcemap: true,
  onSuccess: async () => {
    mkdirSync('dist/ui', { recursive: true });
    copyFileSync('src/ui/index.html', 'dist/ui/index.html');
    console.log('Copied ui/index.html to dist/ui/');
  },
});
