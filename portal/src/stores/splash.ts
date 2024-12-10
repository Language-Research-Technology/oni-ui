import { defineStore } from 'pinia';

export const useSplashStore = defineStore('splash', {
  state: () => ({
    splashed: false,
  }),
  persist: true,
});
