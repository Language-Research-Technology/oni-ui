// NOTE: This fixes types
// https://github.com/prazdevs/pinia-plugin-persistedstate/issues/373
import 'pinia-plugin-persistedstate';
import { defineStore } from 'pinia';
import { ref } from 'vue';

import type { OniUser } from '@/services/auth';

export const useAuthStore = defineStore(
  'auth',
  () => {
    const isLoggedIn = ref(false);
    const loginTermsUrl = ref<string>();
    const lastRoute = ref<string>();
    const user = ref<OniUser>();

    const reset = () => {
      isLoggedIn.value = false;
      loginTermsUrl.value = undefined;
      lastRoute.value = undefined;
      user.value = undefined;
    };

    return { isLoggedIn, loginTermsUrl, user, lastRoute, reset };
  },
  { persist: true },
);
