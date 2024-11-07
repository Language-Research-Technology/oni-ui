<template>
  <vue-pdf-embed
      ref="pdfRef"
      :source="pdfData"
      :page="numPages || undefined">
  </vue-pdf-embed>
</template>

<script>
import 'element-plus/theme-chalk/display.css';
import VuePdfEmbed from 'vue-pdf-embed';

export default {
  components: {
    VuePdfEmbed,
  },
  inheritAttrs: false,
  props: ['blobURL', 'numPages'],
  data() {
    return {
      pdfData: '',
    };
  },
  mounted() {
    this.pdfData = this.blobURL;
  },
};
</script>
<style>
.vue-pdf-embed {
  margin: auto;
}

.vue-pdf-embed canvas {
  width: 100% !important;
  height: auto !important;
}
</style>