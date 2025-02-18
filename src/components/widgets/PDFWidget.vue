<script setup lang="ts">
import VuePdfEmbed from 'vue-pdf-embed';

defineOptions({
  inheritAttrs: false,
});

const { blobURL, numPages } = defineProps<{
  blobURL: string;
  numPages: number;
}>();
</script>
<template>
  <vue-pdf-embed
      ref="pdfRef"
      :source="blobURL"
      :page="numPages">
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
