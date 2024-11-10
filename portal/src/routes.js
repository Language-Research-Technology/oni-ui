import AboutComponent from '@/components/About.component.vue';
import ApiDocsComponent from '@/components/ApiDocsComponent.component.vue';
import CollectionComponent from '@/components/Collection.component.vue';
import ListComponent from '@/components/List.component.vue';
import LoginComponent from '@/components/Login.component.vue';
import LogoutComponent from '@/components/Logout.component.vue';
import NotFoundPage from '@/components/NotFoundPage.vue';
import ObjectComponent from '@/components/Object.component.vue';
import ObjectOpenComponent from '@/components/ObjectOpen.component.vue';
import PrivacyComponent from '@/components/Privacy.component.vue';
import SearchComponent from '@/components/Search.component.vue';
import SearchMapComponent from '@/components/SearchMap.component.vue';
import ShellComponent from '@/components/Shell.component.vue';
import TermsComponent from '@/components/Terms.component.vue';
import UserComponent from '@/components/User.component.vue';
import CallbackOauthLogin from '@/components/authentication/OauthCallback.component.vue';
import { getLocalStorage, loginSessionKey, putLocalStorage, removeLocalStorage, tokenSessionKey } from '@/storage';
import { createRouter, createWebHistory } from 'vue-router';
import HTTPService from './http.service';

const routes = [
  {
    path: '/',
    name: 'root',
    component: ShellComponent,
    children: [
      {
        path: 'search',
        name: 'search',
        component: SearchComponent,
      },
      {
        path: 'map',
        name: 'map',
        component: SearchMapComponent,
      },
      {
        path: 'list',
        name: 'list',
        component: ListComponent,
      },
      {
        path: 'collection',
        name: 'collection',
        component: CollectionComponent,
      },
      {
        path: 'object',
        name: 'object',
        component: ObjectComponent,
        children: [],
      },
      {
        path: 'object/open',
        name: 'open',
        component: ObjectOpenComponent, // Why doesnt it work as a children of object... i dont know!
      },
      {
        path: 'about',
        name: 'about',
        component: AboutComponent,
      },
      {
        path: 'terms',
        name: 'terms',
        component: TermsComponent,
      },
      {
        path: 'privacy',
        name: 'privacy',
        component: PrivacyComponent,
      },
      {
        path: 'user',
        name: 'user',
        component: UserComponent,
        meta: {
          requiresAuth: true,
        },
      },
      {
        path: '/login',
        name: 'login',
        component: LoginComponent,
      },
      {
        path: '/logout',
        name: 'logout',
        component: LogoutComponent,
      },
      {
        path: '/docs',
        name: 'docs',
        component: ApiDocsComponent,
      },
      {
        path: '/404',
        component: NotFoundPage,
      },
    ],
  },
  {
    name: 'callback-github-login',
    path: '/auth/github/callback',
    component: CallbackOauthLogin,
  },
  {
    name: 'callback-ci-login',
    path: '/auth/cilogon/callback',
    component: CallbackOauthLogin,
  },
  { path: '/:catchAll(.*)', redirect: '/404' },
];

const router = createRouter({
  // TODO make this configurable
  history: createWebHistory('/oni'),
  routes,
});
router.beforeEach(onAuthRequired);

async function onAuthRequired(to, from, next) {
  // const httpService = new HTTPService({ router, loginPath: '/login' });
  // let isAuthed = await httpService.get({ route: "/authenticated" });
  // if (isAuthed.status === 200) {
  // putLocalStorage({ key: 'isLoggedIn', data: true });
  // } else {
  putLocalStorage({ key: 'isLoggedIn', data: false });
  // }
  // if (isAuthed.status === 200 && to.path === "/login") {
  //   return next({ path: "/" });
  // }
  if (to.meta?.requiresAuth) {
    console.log(`requires Auth ${to.path}`);
    try {
      if (isAuthed.status === 401 && from.path !== '/login') {
        removeLocalStorage({ key: 'user' });
        removeLocalStorage({ key: 'isLoggedIn' });
        return next({ path: '/login' });
      }
    } catch (error) {
      if (from.path !== '/login') return next({ path: '/login' });
    }
  }
  next();
}
function getCookie(name) {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) {
    return parts.pop().split(';').shift();
  }
  return null;
}

export default router;
