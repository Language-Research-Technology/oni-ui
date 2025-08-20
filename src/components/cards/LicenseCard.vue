<script setup lang="ts">
import Truncate from '@/components/Truncate.vue';

import type { RoCrate } from '@/services/api';

const { license } = defineProps<{
  license: NonNullable<RoCrate['license']>;
}>();
</script>

<template>
  <Truncate v-if="license.description" :text="license.description" :lines="2" />

  <div class="flex flex-col gap-8 p-4 items-center">
    <a class="underline" :href="license['@id']" target="_blank">
      {{ license.name }}
    </a>

    <p>
      {{ license.metadataIsPublic === false ? 'Private Metadata' : 'Public Metadata' }} and
      {{ license.allowTextIndex === false ? 'Cannot Search in Text' : 'Text is Searchable' }}
    </p>
  </div>
</template>
