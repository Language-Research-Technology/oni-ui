// FIXME: It was a bad idea to make this a store, evething should just import @/ configuration directly
//
import { defineStore } from 'pinia';

import { configuration } from '@/configuration';

export const useConfigurationStore = defineStore('configuration', {
  state: () => configuration,
});
