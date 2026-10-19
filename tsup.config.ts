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
      'export.js',
      'pages.css',
    ]) {
      copyFileSync(`src/ui/${file}`, `dist/ui/${file}`);
    }
    for (const [source, destination] of [
      ['assets/brand/svg/horizontal-dark.svg', 'dist/ui/brand-logo.svg'],
      ...[
        'favicon.ico',
        'favicon.svg',
        'apple-touch-icon.png',
        'icon-192.png',
        'icon-512.png',
        'maskable-512.png',
        'site.webmanifest',
      ].map((file) => [`assets/brand/web/${file}`, `dist/ui/${file}`]),
    ]) {
      copyFileSync(source, destination);
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
