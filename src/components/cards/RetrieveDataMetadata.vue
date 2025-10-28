<script setup lang="ts">
import { inject } from 'vue';
import { useI18n } from 'vue-i18n';

import type { ApiService } from '@/services/api';

const { t } = useI18n();
const api = inject<ApiService>('api');
if (!api) {
  throw new Error('api is not provided');
}

const { id } = defineProps<{ id: string }>();

const generateDownloadLink = async (onBlank: boolean) => {
  const metadata = await api.getRoCrate(id);
  const json = JSON.stringify(metadata, null, 2);
  const blob = new Blob([json], { type: 'application/json' });

  const url = URL.createObjectURL(blob);
  if (onBlank) {
    window.open(url, '_blank', 'noopener,noreferrer');

    return;
  }

  const a = document.createElement('a');
  a.href = url;
  a.download = 'ro-crate-metadata.json';
  a.click();
};
</script>

<template>
  <ul>
    <li class="font-semibold">
      <el-link underline="always" type="primary" href="#" @click.prevent="generateDownloadLink(false)">
        {{ t('metadata.downloadMetadata') }}
      </el-link>
    </li>
    <li class="font-semibold">
      <el-link underline="always" type="primary" href="#" rel="noreferrer noopener"
        @click.prevent="generateDownloadLink(true)">
        {{ t('metadata.openMetadataNewWindow') }}
      </el-link>
    </li>
  </ul>
</template>
