<script setup lang="ts">
import { storeToRefs } from 'pinia';
import { login, logout } from '@/services/auth';
import { useAuthStore } from '@/stores/auth';

const { isLoggedIn, user, lastRoute } = storeToRefs(useAuthStore());

const doLogout = async () => {
  logout();

  user.value = undefined;
  isLoggedIn.value = false;
  lastRoute.value = undefined;
};
</script>

<template>
  <el-menu-item v-show="!isLoggedIn" @click="login">
    <div class="flex flex-col justify-center items-center">
      <span>Login</span>
    </div>
  </el-menu-item>

  <el-sub-menu v-if="isLoggedIn" index="login-sub">
    <template #title class="flex flex-col justify-center items-center">
      <font-awesome-icon icon="fa-solid fa-1x fa-user" />&nbsp;
      <span class="items-center text-base">{{ user?.name || user?.email }}&nbsp;</span>
    </template>

    <el-menu-item index="login-sub-user" route="/user">
      <router-link to="/user">
        User Information
      </router-link>
    </el-menu-item>

    <el-menu-item @click="doLogout">
      Logout
    </el-menu-item>
  </el-sub-menu>
</template>
