<script setup lang="ts">
import VuePdfEmbed from 'vue-pdf-embed';

const { src, numPages } = defineProps<{
  src: string;
  numPages?: number;
}>();
</script>

<template>
  <vue-pdf-embed ref="pdfRef" :source="src" :page="numPages">
  </vue-pdf-embed>
</template>

<style>
.vue-pdf-embed {
  margin: auto;
}

.vue-pdf-embed canvas {
  width: 100% !important;
  height: auto !important;
}
</style>
