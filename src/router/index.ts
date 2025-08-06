import { type NavigationGuardWithThis, type RouterOptions, createRouter, createWebHistory } from 'vue-router';

import { getUser } from '@/services/auth';
import About from '@/views/AboutView.vue';
import Collection from '@/views/CollectionView.vue';
import List from '@/views/ListView.vue';
import Login from '@/views/LoginView.vue';
import NotFound from '@/views/NotFoundView.vue';
import CallbackOauth from '@/views/OauthCallbackView.vue';
import Logout from '@/views/LogoutView.vue';
import ObjectView from '@/views/ObjectView.vue';
import File from '@/views/FileView.vue';
import Privacy from '@/views/PrivacyView.vue';
import Search from '@/views/SearchView.vue';
import SearchMap from '@/views/SearchMapView.vue';
import Shell from '@/views/ShellView.vue';
import Terms from '@/views/TermsView.vue';
import User from '@/views/UserView.vue';
import { useAuthStore } from '@/stores/auth';

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
      {
        path: '/login',
        name: 'login',
        component: Login,
      },
      {
        path: '/logout',
        name: 'logout',
        component: Logout,
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
});

const onAuthRequired: NavigationGuardWithThis<undefined> = async (to, from, next) => {
  const authStore = useAuthStore();

  const user = await getUser();
  console.log('🪚 user:', JSON.stringify(user, null, 2));

  if (user && to.path === '/login') {
    return next({ path: '/' });
  }

  if (user) {
    return next();
  }

  if (to.meta?.requiresAuth) {
    authStore.lastRoute = to.fullPath;
    authStore.isLoggedIn = false;

    return next({ path: '/login' });
  }

  next();
};

router.beforeEach(onAuthRequired);

export default router;
