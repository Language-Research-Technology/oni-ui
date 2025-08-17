<script setup lang="ts">
import { onMounted, watch } from 'vue';

import { RouterView, useRoute, useRouter } from 'vue-router';
import FooterView from '@/components/Footer.vue';
import MaintenacePage from '@/components/MaintenacePage.vue';
import NavView from '@/components/Nav.vue';
import { configuration } from '@/configuration';

const { ui } = configuration;
const router = useRouter();
const route = useRoute();

const defaultNavRoute = ui?.topNavItems?.[0]?.route || '/search';

onMounted(() => {
  if (route.path === '/') {
    router.push(defaultNavRoute);
  }
});

watch(
  () => route.path,
  (path) => {
    if (path === '/') {
      router.push(defaultNavRoute);
    }
  },
);
</script>

<template>
  <template v-if="ui">
    <header class="sticky top-0 z-50">
      <el-row :gutter="0" :offset="0" style="" class="flex items-center justify-center">
        <el-col :xs="24" :sm="24" :md="24" :lg="22" :xl="17" :offset="0">
          <NavView />
        </el-col>
      </el-row>
    </header>

    <el-row :gutter="0" :offset="0" style="" class="flex items-center justify-center">
      <el-col :xs="24" :sm="24" :md="24" :lg="22" :xl="17" :offset="0">
        <main class="">
          <RouterView />
        </main>
      </el-col>
    </el-row>

    <footer>
      <FooterView />
    </footer>
  </template>

  <template v-else>
    <MaintenacePage />
  </template>
</template>
