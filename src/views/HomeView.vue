<script setup lang="ts">
import { ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRouter } from 'vue-router';
import { ui } from '@/configuration';

const { t } = useI18n();
const router = useRouter();

const { home, shortTitle, topNavItems } = ui;

const homeEnabled = home?.enabled ?? false;
if (!homeEnabled) {
  const defaultRoute = topNavItems?.[0]?.route ?? '/search';
  router.replace(defaultRoute.startsWith('/') ? defaultRoute : `/${defaultRoute}`);
}

const heroTitle = home?.hero?.title ?? `Welcome to ${shortTitle || 'Oni'}`;
const heroSubtitle = home?.hero?.subtitle ?? '';
const backgroundImage = home?.hero?.backgroundImage
  ? new URL(`../assets/${home.hero.backgroundImage}`, import.meta.url).href
  : undefined;
const backgroundClass = home?.hero?.backgroundClass ?? 'bg-gray-100';

const searchPlaceholder = t('search.placeholder');
const contentHtml = home?.content ?? '';

const searchQuery = ref('');

const handleSearch = () => {
  if (searchQuery.value.trim()) {
    router.push({ path: '/search', query: { q: searchQuery.value } });
  } else {
    router.push({ path: '/search' });
  }
};
</script>

<template>
  <div class="home-view">
    <section class="hero-section min-h-[60vh] flex flex-col items-center justify-center p-8" :class="backgroundClass"
      :style="backgroundImage ? `background-image: url(${backgroundImage}); background-size: cover; background-position: center;` : ''">
      <div class="text-center max-w-4xl mx-auto">
        <h1 class="text-4xl md:text-5xl font-bold mb-4">{{ heroTitle }}</h1>
        <p v-if="heroSubtitle" class="text-xl md:text-2xl mb-8 text-gray-600">
          {{ heroSubtitle }}
        </p>

        <div class="quick-search max-w-2xl mx-auto">
          <el-input v-model="searchQuery" size="large" :placeholder="searchPlaceholder" @keyup.enter="handleSearch"
            class="w-full">
            <template #append>
              <el-button @click="handleSearch" type="primary">
                <font-awesome-icon icon="fa-solid fa-magnifying-glass" />
              </el-button>
            </template>
          </el-input>
        </div>

        <div v-if="contentHtml" class="content-section mt-8 max-w-3xl mx-auto" v-html="contentHtml"></div>
      </div>
    </section>
  </div>
</template>
