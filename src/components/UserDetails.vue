<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { useAuthStore } from '@/stores/auth';

const authStore = useAuthStore();

import { configuration } from '@/configuration';

const {
  ui: {
    login: { manageTermsAndConditions },
  },
} = configuration;

const loginTermsURL = ref<string>();

onMounted(async () => {
  if (!loginTermsURL && manageTermsAndConditions) {
    const terms = { url: 'moo' }; // await this.$terms.get();
    authStore.loginTermsUrl = terms?.url;
  }
  loginTermsURL.value = authStore.loginTermsUrl;
});
</script>

<template>
  <div class="bg-gray-100 rounded-sm shadow-lg p-4 px-4 md:p-8 mb-6">
    <div class="grid gap-4 gap-y-2 text-sm grid-cols-1 lg:grid-cols-3">
      <div class="text-gray-600">
        <p class="font-medium text-lg">User Details</p>
        <p></p>
      </div>

      <div v-if="authStore.user" class="lg:col-span-2">
        <div class="grid gap-4 gap-y-2 text-sm grid-cols-1 md:grid-cols-5">
          <div class="md:col-span-5">
            <label for="full_name">Full Name</label>
            <input type="text" name="full_name" id="full_name"
              class="h-10 border mt-1 rounded-sm px-4 w-full bg-gray-50" v-model="authStore.user.name" />
          </div>

          <div v-if="authStore.user.email" class="md:col-span-5">
            <label for="email">Email Address</label>
            <input type="text" name="email" id="email" class="h-10 border mt-1 rounded-sm px-4 w-full bg-gray-50"
              v-model="authStore.user.email" placeholder="email@domain.com" />
          </div>
        </div>

        <div v-if="loginTermsURL" class="md:col-span-3">
          <br />
        </div>
        <div v-if="loginTermsURL" class="md:col-span-2">
          <label>View&nbsp;</label>
          <a :href="loginTermsURL" class="break-normal underline text-blue-600" target="_blank noreferer">Terms &
            Conditions</a>
        </div>
      </div>
    </div>
  </div>
</template>
