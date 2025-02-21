import { type RouterOptions, createRouter, createWebHistory } from 'vue-router';

import About from '@/views/AboutView.vue';
import Collection from '@/views/CollectionView.vue';
import List from '@/views/ListView.vue';
import NotFound from '@/views/NotFoundView.vue';
// import Login from '@/views/LoginView.vue';
// import Logout from '@/views/LogoutView.vue';
// import NotFound from '@/views/NotFoundView.vue';
import ObjectView from '@/views/ObjectView.vue';
// import ObjectOpen from '@/views/ObjectOpenView.vue';
import Privacy from '@/views/PrivacyView.vue';
import Search from '@/views/SearchView.vue';
// import SearchMap from '@/views/SearchMapView.vue';
import Shell from '@/views/ShellView.vue';
import Terms from '@/views/TermsView.vue';
// import User from '@/views/UserView.vue';
// import CallbackOauth from '@/views/OauthCallbackView.vue';

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
      // {
      //   path: '/map',
      //   name: 'map',
      //   component: SearchMap,
      //  },
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
      // {
      //   path: '/object/open',
      //   name: 'open',
      //   component: ObjectOpen, // Why doesnt it work as a children of object... i dont know!
      // },
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
      // {
      //   path: '/user',
      //   name: 'user',
      //   component: User,
      //   meta: {
      //     requiresAuth: true,
      //   },
      // },
      // {
      //   path: '/login',
      //   name: 'login',
      //   component: Login,
      // },
      // {
      //   path: '/logout',
      //   name: 'logout',
      //   component: Logout,
      // },
      { path: '/:pathMatch(.*)*', name: 'NotFound', component: NotFound },
    ],
  },
  // {
  //   name: 'callback-github-login',
  //   path: '/auth/github/callback',
  //   component: CallbackOauthView,
  // },
  // {
  //   name: 'callback-ci-login',
  //   path: '/auth/cilogon/callback',
  //   component: CallbackOauthView,
  // },
];

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
});

// router.beforeEach(onAuthRequired);
//
// async function onAuthRequired(to, from, next) {
//   // const httpService = new HTTPService({ router, loginPath: '/login' });
//   // TODO: Put auth back if needed
//   const authData = { status: 401 }; // await httpService.get({ route: "/authenticated" });
//   const isAuthed = authData.status === 200;
//   putLocalStorage({ key: 'isLoggedIn', data: isAuthed });
//
//   if (isAuthed && to.path === '/login') {
//     return next({ path: '/' });
//   }
//
//   if (!isAuthed && to.meta.requiresAuth) {
//     // Save the last route
//     return next('/login');
//   }
//
//   if (to.meta?.requiresAuth) {
//     console.log(`requires Auth ${to.path}`);
//
//     // Store the current route for oAuth
//     putLocalStorage({ key: 'lastRoute', data: to.fullPath });
//
//     try {
//       if (isAuthed.status === 401 && from.path !== '/login') {
//         removeLocalStorage({ key: 'user' });
//         removeLocalStorage({ key: 'isLoggedIn' });
//         return next({ path: '/login' });
//       }
//     } catch (error) {
//       if (from.path !== '/login') return next({ path: '/login' });
//     }
//   }
//
//   next();
// }

export default router;
