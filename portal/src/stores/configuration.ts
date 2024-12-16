import { defineStore } from 'pinia';
import { configuration } from '@/configuration';

export const useConfigurationStore = defineStore('configuration', {
  state: () => configuration,
});
