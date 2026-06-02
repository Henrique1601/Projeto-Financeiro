import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';
import { visualizer } from 'rollup-plugin-visualizer';

export default defineConfig({
  publicDir: 'public',
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
  server: {
    port: 5173,
    open: true,
  },
  plugins: [
    VitePWA({
      strategies: 'injectManifest',
      srcDir: 'src',
      filename: 'sw.js',
      registerType: 'autoUpdate',
      devOptions: { enabled: true, type: 'module' },
      manifest: {
        name: 'Gestor Financeiro',
        short_name: 'Gestor',
        description: 'Controle financeiro pessoal',
        theme_color: '#1e1e2e',
        background_color: '#1e1e2e',
        display: 'standalone',
        start_url: '/',
        icons: [
          { src: '/favicon.svg', sizes: '192x192', type: 'image/svg+xml' },
          { src: '/favicon.svg', sizes: '512x512', type: 'image/svg+xml' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,jpg,woff2}'],
        navigateFallback: '/',
        navigateFallbackAllowlist: [/^(?!\/api\/)/],
      },
    }),
    visualizer({
      filename: 'stats.html',
      open: true,
      gzipSize: true,
      brotliSize: true,
    }),
  ],
});
