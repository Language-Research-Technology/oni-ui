import { defineStore } from 'pinia';

type User = {
  name: string;
  email: string;
}

export const useUserStore = defineStore('user', {
  state: () => ({
    isLoggedIn: false,
    user: undefined as User | undefined,
  }),
  persist: true,
});
