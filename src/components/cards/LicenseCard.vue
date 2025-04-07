<script setup lang="ts">
import { onUpdated, ref } from 'vue';

import { initSnip, toggleSnip } from '@/tools';

const { license } = defineProps<{
  license: { '@id': string; name?: string; description: string; metadataIsPublic?: boolean; allowTextIndex?: boolean };
}>();

const licenseSnipped = ref(false);

const doSnip = (selector: string) => {
  toggleSnip(selector);
  licenseSnipped.value = true;
};

onUpdated(() => {
  if (!licenseSnipped.value) {
    initSnip({ selector: '#license', button: '#readMoreLicense' });
  }
});
</script>

<template>
  <p class="whitespace-pre-wrap" id="license">{{ license.description }}</p>

  <span id="readMoreLicense">
    <el-button v-if="!licenseSnipped" class="justify-self-center mt-2" @click="doSnip('#license')">
      Read more
    </el-button>
  </span>

  <div class="grid p-4">
    <span class="justify-self-center">
      <a class="underline" :href="license['@id']">
        {{ license.name }}</a>
    </span>
  </div>

  <div class="grid p-4">
    <div class="justify-self-center">
      {{ license.metadataIsPublic === false ? 'Private Metadata' : 'Public Metadata' }} and
      {{ license.allowTextIndex === false ? 'Cannot Search in Text' : 'Text is Searchable' }}
    </div>
  </div>

  <div class="bottom justify-self-center"></div>
</template>
