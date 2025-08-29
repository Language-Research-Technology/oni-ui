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

    return { isLoggedIn, loginTermsUrl, user, lastRoute };
  },
  { persist: true },
);
