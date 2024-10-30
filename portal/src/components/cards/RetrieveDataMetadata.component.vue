<template>
  <ul>
    <li class="font-semibold">
      <el-link
          :underline="true"
          type="primary"
          :href="link" download="ro-crate-metadata.json">
        Download metadata
      </el-link>
    </li>
    <li class="font-semibold">
      <el-link
          :underline="true"
          type="primary"
          :href="link" target="_blank" rel="noreferrer noopener">
        Open metadata in a new window
      </el-link>
    </li>
  </ul>
</template>
<script>
export default {
  props: ['id'],
  data() {
    return {
      link: '',
    };
  },
  async mounted() {
    // TODO: This happends at mount but we should only grab it if they click on the link or cache it from the original call
    const metadata = await this.$api.getCrate(this.id);
    const json = JSON.stringify(metadata, null, 2);
    const blob = new Blob([json], { type: 'application/json' });

    this.link = URL.createObjectURL(blob);
  },
};
</script>
