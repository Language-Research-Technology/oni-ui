<script setup lang="ts">
import { storeToRefs } from 'pinia';
import { logout } from '@/services/auth';
import { useAuthStore } from '@/stores/auth';

const authStore = useAuthStore();

const { isLoggedIn, user, lastRoute } = storeToRefs(authStore);

const doLogout = async () => {
  logout();

  user.value = undefined;
  isLoggedIn.value = false;
  lastRoute.value = undefined;
};

doLogout();
</script>

<template>
  <div class="flex items-center justify-center py-32">
    <div class="bg-gray-200 w-96 h-auto rounded-lg pt-8 pb-8 px-8 flex flex-col items-center">
      <p>You have successfully logged out</p>
    </div>
  </div>
</template>
