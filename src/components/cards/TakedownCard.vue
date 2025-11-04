<script setup lang="ts">
import { useI18n } from 'vue-i18n';
import { ui } from '@/configuration';

const { t } = useI18n();
const takedownForm = ui.takedown;

const currentUrl = encodeURIComponent(window.location.href);
const takedownLink = takedownForm.replace('{url}', currentUrl);
</script>

<template>
  <el-card :body-style="{ padding: '0px' }" class="mx-10 p-5" v-if="takedownForm">
    <h5 class="text-2xl font-medium">{{ t('takedown.title') }}
      <el-tooltip class="box-item" effect="light" trigger="hover" :content="t('takedown.tooltip')" placement="top">
        <font-awesome-icon icon="fa-solid fa-circle-info" class="ml-2 cursor-pointer" size="xs" color="gray" />
      </el-tooltip>
    </h5>
    <hr class="divider divider-gray pt-2" />
    <h4 class="text-1xl font-medium">
      {{ t('takedown.description') }}
      <span style="display: inline-flex; align-items: center;">
        <el-link underline="always" type="primary" :href="takedownLink" target="_blank" class="mx-1">
          {{ t('takedown.formLink') }}
        </el-link>
      </span>
    </h4>
  </el-card>
</template>
