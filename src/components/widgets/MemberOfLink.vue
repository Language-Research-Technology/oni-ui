<script setup lang="ts">
import type { EntityType } from '@/services/api';

const { entity } = defineProps<{ entity: EntityType }>();

const id = entity.memberOf?.id;
const path = entity.entityType === 'http://schema.org/MediaObject' ? 'object' : 'collection';
const link = `/${path}?id=${encodeURIComponent(id)}`;
const value = entity.memberOf?.name || id;
</script>

<template>
  <span v-if="value">
    <router-link class="wrap-break-word no-underline text-blue-600" :to="link">{{ value }}</router-link> >
  </span>
</template>
