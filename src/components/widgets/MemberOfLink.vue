<script setup lang="ts">
import type { RoCrate } from '@/services/api';

const { memberOf } = defineProps<{ memberOf: NonNullable<RoCrate['pcdm:memberOf']> }>();

const id = memberOf['@id'];
const link = `/collection?id=${encodeURIComponent(id)}`;
const value = memberOf.name || id;
</script>

<template>
  <span v-if="value">
    <router-link class="break-words no-underline text-blue-600" :to="link">{{ value }}</router-link> >
  </span>
</template>
