import { copyFileSync, mkdirSync } from 'node:fs';
import { defineConfig } from 'tsup';

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
    copyFileSync('src/ui/image-url.js', 'dist/ui/image-url.js');
    copyFileSync('LICENSE', 'dist/ui/LICENSE');
    copyFileSync('CODE_OF_CONDUCT.md', 'dist/ui/CODE_OF_CONDUCT.md');
    console.log('Copied ui/index.html to dist/ui/');
  },
});
