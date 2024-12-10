import { defineStore } from 'pinia'
import configuration from '@/../configuration.json';

export const useConfigurationStore = defineStore('configuration', {
  state: () => configuration,
})
