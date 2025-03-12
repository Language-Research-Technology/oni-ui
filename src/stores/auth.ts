import { defineStore } from 'pinia';
import { ref } from 'vue';

export const useAuthStore = defineStore(
  'auth',
  () => {
    const isLoggedIn = ref(false);
    const user = ref<
      { id: string; name?: string; email: string; organization?: string; provider?: string } | undefined
    >();
    const expiry = ref(0);
    const token = ref<string>();
    const codeVerifier = ref<string>();

    return { isLoggedIn, user, expiry, token, codeVerifier };
  },
  { persist: true },
);
