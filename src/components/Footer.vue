<script setup lang="ts">
import { ref } from 'vue';
import SplashScreen from '@/components/SplashScreen.vue';
import { ui } from '@/configuration';

const {
  footer: {
    copyright,
    link: { href, text: hrefText },
  },
  terms,
  privacy,
  splash,
} = ui;

const showSplash = ref(false);
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
        <el-link v-if="terms" class="text-gray-600 font-semibold" underline="never">
          <router-link :to="terms?.href">
            {{ terms?.title }}
          </router-link>
        </el-link>

        <el-link v-if="splash" class="text-gray-600 font-semibold" href="#" @click="showSplash = true"
          underline="never">
          {{ splash.launcher }}
        </el-link>

        <el-link v-if="privacy" class="text-gray-600 font-semibold" :href="privacy?.href" underline="never">
          <router-link :to="privacy?.href">
            {{ privacy?.title }}
          </router-link>
        </el-link>
      </el-col>
    </el-row>
  </div>

  <SplashScreen :launch="showSplash" @close="showSplash = false" />
</template>
