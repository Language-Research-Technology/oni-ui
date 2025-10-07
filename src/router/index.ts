import { createRouter, createWebHistory, type NavigationGuardWithThis, type RouterOptions } from 'vue-router';

import { getUser, login } from '@/services/auth';
import { useAuthStore } from '@/stores/auth';
import About from '@/views/AboutView.vue';
import Collection from '@/views/CollectionView.vue';
import File from '@/views/FileView.vue';
import List from '@/views/ListView.vue';
import NotFound from '@/views/NotFoundView.vue';
import CallbackOauth from '@/views/OauthCallbackView.vue';
import ObjectView from '@/views/ObjectView.vue';
import Privacy from '@/views/PrivacyView.vue';
import SearchMap from '@/views/SearchMapView.vue';
import Search from '@/views/SearchView.vue';
import Shell from '@/views/ShellView.vue';
import Terms from '@/views/TermsView.vue';
import User from '@/views/UserView.vue';

const routes: RouterOptions['routes'] = [
  {
    path: '/',
    name: 'root',
    component: Shell,
    children: [
      {
        path: '/search',
        name: 'search',
        component: Search,
      },
      {
        path: '/map',
        name: 'map',
        component: SearchMap,
      },
      {
        path: '/list',
        name: 'list',
        component: List,
      },
      {
        path: '/collection',
        name: 'collection',
        component: Collection,
      },
      {
        path: '/object',
        name: 'object',
        component: ObjectView,
        children: [],
      },
      {
        path: '/file',
        name: 'file',
        component: File,
      },
      {
        path: '/about',
        name: 'about',
        component: About,
      },
      {
        path: '/terms',
        name: 'terms',
        component: Terms,
      },
      {
        path: '/privacy',
        name: 'privacy',
        component: Privacy,
      },
      {
        path: '/user',
        name: 'user',
        component: User,
        meta: {
          requiresAuth: true,
        },
      },
      { path: '/:pathMatch(.*)*', name: 'NotFound', component: NotFound },
    ],
  },
  {
    path: '/auth/callback',
    component: CallbackOauth,
  },
];

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
  scrollBehavior(to, _from, savedPosition) {
    return new Promise((resolve) => {
      if (savedPosition) {
        // Wait for the DOM to update before scrolling
        setTimeout(() => {
          resolve(savedPosition);
        }, 500);
      } else if (to.hash) {
        resolve({ el: to.hash });
      } else {
        resolve({ top: 0 });
      }
    });
  },
});

const onAuthRequired: NavigationGuardWithThis<undefined> = async (to) => {
  const authStore = useAuthStore();

  const user = await getUser();

  if (user) {
    return true;
  }

  if (authStore.isLoggedIn) {
    authStore.reset();
  }

  if (to.meta?.requiresAuth) {
    authStore.lastRoute = to.fullPath;
    authStore.isLoggedIn = false;

    login();

    return false;
  }

  return true;
};

router.beforeEach(onAuthRequired);

export default router;
