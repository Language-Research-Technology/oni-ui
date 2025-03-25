import { defineStore } from 'pinia';
import { ref } from 'vue';

import type { OniUser } from '@/services/auth';

export const useAuthStore = defineStore(
  'auth',
  () => {
    const isLoggedIn = ref(false);
    const lastRoute = ref<string>();
    const user = ref<OniUser>();

    return { isLoggedIn, user, lastRoute };
  },
  { persist: true },
);
