<script setup lang="ts">
import { ref } from 'vue';
import { useConfigurationStore } from '@/stores/configuration';

import SplashScreen from '@/components/SplashScreen.vue';

const { ui } = useConfigurationStore();

const {
  footer: {
    copyright,
    link: { href, text: hrefText },
  },
  terms,
  privacy,
  splashLauncher,
} = ui;

const splash = ref(false);
</script>

<template>
  <div class="h-24 text-center bg-gray-50 grid place-items-center ">
    <el-row>
      <el-col :span="24">
        <span>{{ copyright }}</span>&nbsp;
        <a class="text-gray-600 font-semibold" :href="href">{{ hrefText }}</a>
      </el-col>
    </el-row>
    <el-row>
      <el-col :span="24" class="flex space-x-4">
        <el-link v-if="terms" class="text-gray-600 font-semibold" :href="terms?.href" :underline="false">{{
          terms?.title
        }}
        </el-link>

        <el-link v-if="splashLauncher" class="text-gray-600 font-semibold" href="#" @click="splash = true" :underline="false">
          {{ splashLauncher || 'Splash' }}
        </el-link>

        <el-link v-if="privacy" class="text-gray-600 font-semibold" :href="privacy?.href" :underline="false">{{
          privacy?.title
        }}
        </el-link>
      </el-col>
    </el-row>
  </div>

  <SplashScreen :launch="splash" @close="splash = false" />
</template>
