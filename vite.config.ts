import { fileURLToPath, URL } from 'node:url';
import { sentryVitePlugin } from '@sentry/vite-plugin';
import vue from '@vitejs/plugin-vue';
import { defineConfig } from 'vite';
import vueDevTools from 'vite-plugin-vue-devtools';
// DOCKER_REMOVE_START
import { ldacaProxy } from './ldaca-proxy';
// DOCKER_REMOVE_END

// https://vite.dev/config/
export default defineConfig(({ mode }) => ({
  plugins: [
    vue(),
    vueDevTools(),
    // DOCKER_REMOVE_START
    {
      // NOTE: Temp so we can transform the old LDaCA API
      name: 'ldaca-proxy',
      configureServer(server) {
        server.middlewares.use(ldacaProxy);
      },
    },
    // DOCKER_REMOVE_END
    mode === 'production' ? sentryVitePlugin() : undefined,
  ],

  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },

  build: {
    sourcemap: true,
  },
}));
