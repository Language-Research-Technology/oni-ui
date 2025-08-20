<script setup lang="ts">
import { storeToRefs } from 'pinia';
import { inject, onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';

import type { ApiService } from '@/services/api';
import { handleCallback } from '@/services/auth';
import { useAuthStore } from '@/stores/auth';

const api = inject<ApiService>('api');
if (!api) {
  throw new Error('API instance not provided');
}

const router = useRouter();
const authStore = useAuthStore();

const { isLoggedIn, user, lastRoute } = storeToRefs(authStore);

const error = ref(false);
const isLoading = ref(true);
const loadingText = ref('Loading...');
const goHome = ref(false);

const setError = (text: string) => {
  console.error(text);
  error.value = true;
  isLoggedIn.value = false;
  loadingText.value = text;
  isLoading.value = false;
};

onMounted(async () => {
  try {
    const newUser = await handleCallback();
    if (!newUser) {
      setError('There was an error trying to login, try again');
      goHome.value = true;
      return;
    }

    user.value = newUser;
    isLoggedIn.value = true;
  } catch (error) {
    console.error('Authentication error:', error);
    setError('There was an error trying to login, try again');
    goHome.value = true;
  }

  if (lastRoute.value) {
    const route = lastRoute.value;
    lastRoute.value = undefined;
    await router.push(route);
  } else {
    await router.push('/');
  }
});
</script>

<template>
  <div class="flex items-center justify-center py-32">
    <div class="bg-gray-200 w-96 rounded-lg py-8 flex flex-col items-center">
      <el-row class="h-32 items-center" align="middle">
        <el-col :xs="24" :sm="24" :md="24" :lg="24" :xl="24">
          <p v-loading="isLoading"></p>
        </el-col>
        <el-col class="flex flex-col items-center" :xs="24" :sm="24" :md="24" :lg="24" :xl="24">
          <p>{{ loadingText }}</p>
          <br />
          <p v-if="goHome">
            <el-link>
              <router-link to="/login">
                Login
              </router-link>
            </el-link>
          </p>
        </el-col>
      </el-row>
    </div>
  </div>
</template>
