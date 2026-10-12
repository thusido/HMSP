import { defineConfig, type PluginOption } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

// PWA is enabled only for `pnpm build:pwa` (VITE_PWA=true).
// Tauri builds never include a Service Worker.
export default defineConfig(() => {
  const plugins: PluginOption[] = [react()];

  if (process.env.VITE_PWA === 'true') {
    plugins.push(
      VitePWA({
        registerType: 'autoUpdate',
        manifest: {
          name: 'HMSubtitlePlayer',
          short_name: 'HMSP',
          start_url: '.',
          display: 'standalone',
          background_color: '#ffffff',
          theme_color: '#0a0a0a',
          icons: [
            { src: 'icons/192x192.png', sizes: '192x192', type: 'image/png' },
            { src: 'icons/512x512.png', sizes: '512x512', type: 'image/png' },
          ],
        },
        workbox: {
          globPatterns: ['**/*.{js,css,html,woff,woff2,png,svg}'],
        },
      }),
    );
  }

  return {
    // Relative base: served from file root (Tauri), / (preview), or /HMSP/ (GitHub Pages).
    base: './',
    plugins,
    server: {
      port: 5173,
      host: true,
    },
  };
});
