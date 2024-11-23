<template>
  <span v-if="iconName" class="p-1 m-1">
    <span class="justify-center">
      <el-tooltip class="box-item" effect="dark" :content="`File Format: ${mediaType}`" placement="bottom">
      <font-awesome-icon :icon="['fa-solid', iconName]" size="2x" style="color: rgba(0,0,0,0.55);"/>
      </el-tooltip>
    </span>
  </span>
</template>
<script>
export default {
  props: ['mediaType'],
  data() {
    return {
      iconName: 'file',
    };
  },
  created() {
    this.iconName = this.detectIconName(this.mediaType);
  },
  methods: {
    detectIconName(mediaType) {
      if (mediaType.startsWith('video')) {
        return 'file-video';
      }

      if (mediaType.startsWith('audio')) {
        return 'file-audio';
      }

      if (mediaType.startsWith('image')) {
        return 'file-image';
      }

      if (mediaType.includes('xml')) {
        return 'file-code';
      }

      switch (mediaType) {
        case 'text/csv':
          return 'file-csv';
        case 'text/plain':
          return 'file-lines';
        case 'application/zip':
          return 'file-zipper';
        case 'application/pdf':
          return 'file-pdf';
        case 'application/msword':
        case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
          return 'file-word';
        case 'application/x-ipynb+json':
          return 'clipboard';
      }

      if (mediaType.startsWith('text')) {
        return 'file-lines';
      }

      console.log(`Need mediaType icon for ${mediaType}`);
    },
  },
};
</script>
