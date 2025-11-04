// NOTE: This fixes types
// https://github.com/prazdevs/pinia-plugin-persistedstate/issues/373
import 'pinia-plugin-persistedstate';
import { defineStore } from 'pinia';
import { ref } from 'vue';

import { logout, type OniUser } from '@/services/auth';

export const useAuthStore = defineStore(
  'auth',
  () => {
    const isLoggedIn = ref(false);
    const loginTermsUrl = ref<string>();
    const user = ref<OniUser>();

    const reset = () => {
      isLoggedIn.value = false;
      loginTermsUrl.value = undefined;
      user.value = undefined;
    };

    const dologout = async () => {
      user.value = undefined;
      isLoggedIn.value = false;

      logout();
    };

    return { isLoggedIn, loginTermsUrl, user, reset, logout: dologout };
  },
  { persist: true },
);
