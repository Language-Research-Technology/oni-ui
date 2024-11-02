<template>
  <ul>
    <li class="font-semibold">
      <el-link
          :underline="true"
          type="primary"
          href="#"
          @click.prevent="generateDownloadLink(false)">
        Download metadata
      </el-link>
    </li>
    <li class="font-semibold">
      <el-link
          :underline="true"
          type="primary"
          href="#"
          rel="noreferrer noopener"
          @click.prevent="generateDownloadLink(true)">
        Open metadata in a new window
      </el-link>
    </li>
  </ul>
</template>
<script>
export default {
  props: ['id'],
  methods: {
    async generateDownloadLink(onBlank) {
      const metadata = await this.$api.getCrate(this.id);
      const json = JSON.stringify(metadata, null, 2);
      const blob = new Blob([json], { type: 'application/json' });

      const url = URL.createObjectURL(blob);
      if (onBlank) {
        window.open(url, '_blank', 'noopener,noreferrer');
      } else {
        const a = document.createElement('a');
        a.href = url;
        a.download = 'ro-crate-metadata.json';
        a.click();
      }
    }
  }
}
</script>
