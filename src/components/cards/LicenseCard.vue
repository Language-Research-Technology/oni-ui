<script setup lang="ts">
import Truncate from '@/components/Truncate.vue';
import type { RoCrate } from '@/services/api';
import { first } from '@/tools';

const { license } = defineProps<{
  license: NonNullable<RoCrate['license']>;
}>();

const localLicense = first(license);

if (!localLicense) {
  console.warn('🪚 WHY: No license');
  throw new Error('No License');
}
</script>

<template>
  <div class="flex flex-col gap-8 p-4 items-center">
    <a class="underline" :href="localLicense['@id']" target="_blank">
      {{ first(localLicense.name) }}
    </a>

    <Truncate v-if="localLicense.description" :text="first(localLicense.description)" :lines="2" />
  </div>
</template>
