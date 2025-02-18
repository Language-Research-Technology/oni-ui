<script setup lang="ts">
import { ref, watch } from 'vue';

import { useConfigurationStore } from '@/stores/configuration';
import { useAuthStore } from '@/stores/auth';

const { ui } = useConfigurationStore();
const { isLoggedIn, user } = useAuthStore();

const { navHeight = '50px' } = ui;

const userName = ref(user?.name || user?.email);

watch(
  () => user,
  (u) => {
    userName.value = u?.name || u?.email;
  },
);
</script>

<template>
  <el-menu-item index="login" v-show="isLoggedIn" :route="'/login'">
    <router-link to="/login">
      <div class="flex flex-col justify-center items-center" :style="{ 'height': navHeight }">
        <span>Login</span>
      </div>
    </router-link>
  </el-menu-item>

  <el-sub-menu v-if="isLoggedIn" index="login-sub">
    <template #title class="flex flex-col justify-center items-center" :style="{ 'height': navHeight }">
      <font-awesome-icon icon="fa-solid fa-1x fa-user" />&nbsp;
      <span class="items-center text-base">{{ userName }}&nbsp;</span>
    </template>

    <el-menu-item index="login-sub-user" route="/user">
      <router-link to="/user">
        User Information
      </router-link>
    </el-menu-item>

    <el-menu-item index="logout" route="/logout">
      <router-link to="/logout">
        Logout
      </router-link>
    </el-menu-item>
  </el-sub-menu>
</template>
