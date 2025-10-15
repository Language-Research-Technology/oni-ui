import { fileURLToPath, URL } from 'node:url';
import { sentryVitePlugin } from '@sentry/vite-plugin';
import vue from '@vitejs/plugin-vue';
import { defineConfig } from 'vite';
import vueDevTools from 'vite-plugin-vue-devtools';
import { ldacaProxy } from './ldaca-proxy';
import { ui } from './src/configuration';

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    vueDevTools(),
    {
      // NOTE: Temp so we can transform the old LDaCA API
      name: 'ldaca-proxy',
      configureServer(server) {
        server.middlewares.use(ldacaProxy);
      },
    },
    ui.sentry?.dsn ? sentryVitePlugin() : undefined,
  ],

  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },

  build: {
    sourcemap: true,
  },
});
