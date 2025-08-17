<script setup lang="ts">
import { ref } from 'vue';
import { ui } from '@/configuration';
import { login } from '@/services/auth';

const { title } = ui;

const loggingIn = ref(false);

const doLogin = async () => {
  loggingIn.value = true;

  login();
};
</script>

<template>
  <div class="w-full h-screen flex items-center justify-center">
    <div class="bg-gray-200 w-96 h-auto rounded-lg pt-8 pb-8 px-8 flex flex-col items-center drop-shadow-md gap-8">
      <label class="font-light text-4xl mb-4">{{ title }}</label>

      <el-button :loading="loggingIn"
        class="bg-blue-800! w-full h-12! rounded-lg! text-gray-200! text-base! uppercase font-semibold! transition mb-4"
        @click="doLogin()">
        Login
      </el-button>

    </div>
  </div>
</template>
