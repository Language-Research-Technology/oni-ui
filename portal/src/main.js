import "regenerator-runtime";
import "@/assets/tailwind.css";
import "element-plus/theme-chalk/index.css";
import {library} from '@fortawesome/fontawesome-svg-core'
import {FontAwesomeIcon} from '@fortawesome/vue-fontawesome'
import {fas} from "@fortawesome/free-solid-svg-icons";
import {far} from "@fortawesome/free-regular-svg-icons";
import {fab} from "@fortawesome/free-brands-svg-icons"

library.add(fas, far, fab);

import {createApp} from "vue";
import App from "./App.vue";
import router from "./routes";
import {store} from "./store";
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import {MankuIcon} from "manku-icon-lib";
import log from "loglevel";
import prefix from "loglevel-plugin-prefix";
import VuePapaParse from 'vue-papa-parse';
import {VueHeadMixin, createHead} from '@unhead/vue';

const level = process.env.NODE_ENV === "development" ? "debug" : "warn";
log.setLevel(level);
const prefixer = prefix.noConflict();
prefixer.reg(log);
prefixer.apply(log);
import {io} from "socket.io-client";
import HTTPService from "./http.service";
import MembershipService from "./membership.service";
import ElasticService from "./elastic.service";
import VueGtag from "vue-gtag";
import VueCookies from 'vue-cookies';
import ZipService from "./zip.service";

(async () => {
  const app = createApp(App);
  const head = createHead();
  app.mixin(VueHeadMixin);
  app.use(head);
  app.use(store);
  app.use(router);
  app.use(ElementPlus);
  app.use(VueCookies, {expires: '1d'});
  app.use(VuePapaParse);
  app.component('font-awesome-icon', FontAwesomeIcon);
  app.component('manku-icon', MankuIcon);
  app.config.globalProperties.$http = new HTTPService({router, loginPath: "/login"});
  app.config.globalProperties.$log = log;

  let response = await fetch("/api/configuration");
  //Stub configuration if API is down
  let configuration = {}
  if (response.status === 200) {
    configuration = await response.json();
    if (configuration.ui && configuration.ui?.analytics?.['gaMeasurementId']) {
      app.use(VueGtag, {
        config: {id: configuration.ui.analytics['gaMeasurementId']},
        router
      });
    }
    store.commit("saveConfiguration", {...configuration});

    app.config.globalProperties.$membership = new MembershipService({router});
    app.config.globalProperties.$zip = new ZipService({router, apiPath: '/api'});
    app.config.globalProperties.$elasticService = new ElasticService({router, configuration});
  } else {
    configuration.ui = null;
    await router.push({path: '/404'});
  }

  app.mount("#app");

  // app.config.globalProperties.$socket = io();
  // app.config.productionTip = false;

})();
