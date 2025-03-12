<script setup lang="ts">
import { inject, ref } from 'vue';

import { useConfigurationStore } from '@/stores/configuration';
import { useAuthStore } from '@/stores/auth';

const { ui } = useConfigurationStore();
const authStore = useAuthStore();

import type { ApiService } from '@/services/api';

const api = inject<ApiService>('api');
if (!api) {
  throw new Error('API instance not provided');
}

const { loginProviders, title } = ui;

const loggingIn = ref(false);

const login = async (provider: (typeof loginProviders)[number]) => {
  loggingIn.value = true;

  const { errors, url, codeVerifier } = await api.getOAuthDetails(provider.name);
  if (errors) {
    loggingIn.value = false;
    console.error(errors);

    return;
  }

  authStore.codeVerifier = codeVerifier;

  window.location.href = url;
};
</script>

<template>
  <div class="w-full h-screen flex items-center justify-center">
    <div class="bg-gray-200 w-96 h-auto rounded-lg pt-8 pb-8 px-8 flex flex-col items-center drop-shadow-md gap-8">
      <label class="font-light text-4xl mb-4">{{ title }}</label>

      <el-button v-for="provider of loginProviders" :loading="loggingIn"
        class="bg-gray-800 w-full h-12! rounded-lg! text-gray-200! text-base! uppercase font-semibold! transition mb-4"
        :style="provider.buttonStyle" :disabled="provider.disabled" @click="login(provider)">
        {{ provider.text }}
      </el-button>

    </div>
  </div>
</template>
