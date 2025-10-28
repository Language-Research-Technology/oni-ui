<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import type { Locale } from '@/i18n';
import { useI18nStore } from '@/stores/i18n';

const { t, locale } = useI18n({ useScope: 'global' });
const i18nStore = useI18nStore();

const currentLocale = computed(() => i18nStore.currentLocale);
const availableLocales = computed(() => i18nStore.availableLocales);

const languageOptions = computed(() => {
  return availableLocales.value.map((locale) => ({
    value: locale,
    label: t(`languages.${locale}`),
  }));
});

const handleLocaleChange = (l: Locale) => {
  i18nStore.setLocale(l);
  locale.value = l;
};
</script>

<template>
  <el-dropdown trigger="click" @command="handleLocaleChange">
    <span class="flex items-center cursor-pointer hover:text-blue-500 px-4">
      <font-awesome-icon icon="language" class="mr-2" />
      <span>{{ t(`languages.${currentLocale}`) }}</span>
      <font-awesome-icon icon="chevron-down" class="ml-2 text-xs" />
    </span>
    <template #dropdown>
      <el-dropdown-menu>
        <el-dropdown-item v-for="option in languageOptions" :key="option.value" :command="option.value"
          :disabled="option.value === currentLocale">
          <span :class="{ 'font-bold': option.value === currentLocale }">
            {{ option.label }}
          </span>
        </el-dropdown-item>
      </el-dropdown-menu>
    </template>
  </el-dropdown>
</template>

<style scoped>
.el-dropdown {
  height: 100%;
  display: flex;
  align-items: center;
}
</style>
