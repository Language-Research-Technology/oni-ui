<script setup lang="ts">
const { memberOf } = defineProps<{ memberOf: { '@id': string; name?: string } }>();

const id = memberOf?.['@id'];
const link = `/collection?id=${encodeURIComponent(id)}`;
// TODO: Should rocrates add a name to memberOf? Eslastic search had this
const value = memberOf?.name || id;
</script>

<template>
  <span v-if="value">
    <router-link class="break-words no-underline text-blue-600" :to="link">{{ value }}</router-link> >
  </span>
</template>
