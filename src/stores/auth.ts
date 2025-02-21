import { defineStore } from 'pinia';

export const useAuthStore = defineStore('auth', {
  state: () => ({
    expiry: undefined as number | undefined,
    token: undefined as string | undefined,
  }),
  persist: true,
});
