<script setup lang="ts">
import { storeToRefs } from 'pinia';
import { useI18n } from 'vue-i18n';
import { login } from '@/services/auth';
import { useAuthStore } from '@/stores/auth';

const { t } = useI18n();
const authStore = useAuthStore();
const { isLoggedIn, user } = storeToRefs(useAuthStore());
</script>

<template>
  <el-menu-item v-show="!isLoggedIn" @click="login">
    <div class="flex flex-col justify-center items-center">
      <el-tooltip class="box-item" effect="light" :content="t('auth.loginTooltip')" placement="bottom">
        <span>{{ t('auth.login') }}</span>
      </el-tooltip>
    </div>
  </el-menu-item>

  <el-sub-menu v-if="isLoggedIn" index="login-sub">
    <template #title class="flex flex-col justify-center items-center">
      <font-awesome-icon icon="fa-solid fa-1x fa-user" />&nbsp;
      <span class="items-center text-base">{{ user?.name || user?.email }}&nbsp;</span>
    </template>

    <el-menu-item index="login-sub-user" route="/user">
      <router-link to="/user">
        {{ t('auth.userInformation') }}
      </router-link>
    </el-menu-item>

    <el-menu-item @click="authStore.logout">
      {{ t('auth.logout') }}
    </el-menu-item>
  </el-sub-menu>
</template>
