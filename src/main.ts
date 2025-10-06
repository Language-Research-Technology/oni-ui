import '@/assets/main.css';

import ElementPlus from 'element-plus';
import { createPinia } from 'pinia';
import piniaPluginPersistedstate from 'pinia-plugin-persistedstate';
import { createApp } from 'vue';
import VueCookies from 'vue-cookies';
import 'element-plus/dist/index.css';
import 'element-plus/theme-chalk/index.css';

import { library } from '@fortawesome/fontawesome-svg-core';
import { fab } from '@fortawesome/free-brands-svg-icons';
import { far } from '@fortawesome/free-regular-svg-icons';
import { fas } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';
import { createGtm } from '@gtm-support/vue-gtm';
import * as Sentry from '@sentry/vue';
import { createSentryPiniaPlugin } from '@sentry/vue';
import { createHead } from '@unhead/vue/client';
import { MankuIcon } from 'manku-icon-lib';
import App from '@/App.vue';
import { ui } from '@/configuration';
import router from '@/router';
import { ApiService } from '@/services/api';

library.add(fas, far, fab);

const app = createApp(App);

if (ui.sentry?.dsn) {
  Sentry.init({
    app,
    dsn: ui.sentry.dsn,
    sendDefaultPii: true,
    environment: ui.sentry.environment,
    integrations: [Sentry.browserTracingIntegration({ router })],
    tracesSampleRate: ui.sentry.tracesSampleRate ?? 0.1,
    replaysSessionSampleRate: ui.sentry.replaysSessionSampleRate ?? 0.1,
    replaysOnErrorSampleRate: ui.sentry.replaysOnErrorSampleRate ?? 1.0,
  });
}

const head = createHead({
  init: [
    {
      title: ui.title,
      titleTemplate: `%s | ${ui.title}`,
    },
  ],
});
app.use(head);

const pinia = createPinia();
pinia.use(piniaPluginPersistedstate);
if (ui.sentry?.dsn) {
  pinia.use(createSentryPiniaPlugin());
}
app.use(pinia);

app.use(router);
app.use(VueCookies);

app.use(ElementPlus);
app.component('font-awesome-icon', FontAwesomeIcon);
app.component('manku-icon', MankuIcon);

if (ui.analytics) {
  const gtm = createGtm({
    id: ui.analytics.gaMeasurementId,
    vueRouter: router,
  });
  app.use(gtm);
}

const api = new ApiService();
app.provide('api', api);

app.mount('#app');
