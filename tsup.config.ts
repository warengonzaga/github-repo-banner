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
    for (const file of [
      'index.html',
      'image-url.js',
      'image-layers.js',
      'image-layers.css',
      'image-settings.js',
      'inline-icons.js',
      'usage.html',
      'usage.js',
      'export.js',
      'showcase.js',
      'pages.css',
    ]) {
      copyFileSync(`src/ui/${file}`, `dist/ui/${file}`);
    }
    mkdirSync('dist/ui/docs/docs', { recursive: true });
    for (const file of [
      'README.md',
      'CONTRIBUTING.md',
      'CODE_OF_CONDUCT.md',
      'LICENSE',
      'docs/api.md',
      'docs/self-hosting.md',
      'docs/terms.md',
      'docs/privacy.md',
    ]) {
      copyFileSync(file, `dist/ui/docs/${file}`);
    }
    copyFileSync('LICENSE', 'dist/ui/LICENSE');
    copyFileSync('CODE_OF_CONDUCT.md', 'dist/ui/CODE_OF_CONDUCT.md');
    console.log('Copied ui/index.html to dist/ui/');
  },
});
