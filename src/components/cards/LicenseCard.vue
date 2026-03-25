<script setup lang="ts">
import Truncate from '@/components/Truncate.vue';
import type { RoCrate } from '@/services/api';
import { joinAll } from '@/tools';

const { license } = defineProps<{
  license: NonNullable<RoCrate['license']>;
}>();

const localLicense = license[0];

if (!localLicense) {
  console.warn('🪚 WHY: No license');
  throw new Error('No License');
}
</script>

<template>
  <div class="flex flex-col gap-8 p-4 items-center">
    <a class="underline" :href="localLicense['@id']" target="_blank">
      {{ joinAll(localLicense.name) }}
    </a>

    <Truncate v-if="localLicense.description" :text="joinAll(localLicense.description, '\n\n')" :lines="2" />
  </div>
</template>
