<template>
  <el-row v-if="zip.url">
    <el-col>
      <p v-if="zip?.numberOfFiles && zip?.expandedSize">
        Files: {{ zip.numberOfFiles }}, Size: {{ zip.expandedSize }}
      </p>
      <el-link
          :underline="true"
          type="primary"
          :href="zip.url"
          :download="zip.name">
        {{ zip.name }}
      </el-link>
    </el-col>
  </el-row>
</template>
<script>

import convertSize from "convert-size";

export default {
  props: ['name', 'id'],
  data() {
    return {
      zip: {
        url: undefined,
        name: undefined,
        expandedSize: '',
        numberOfFiles: 0
      }
    }
  },
  watch: {
    'name': {
      handler(newValue, oldValue) {
        let fileName;
        if (newValue && newValue[0] && newValue?.[0]['@value']) {
          fileName = newValue?.[0]['@value'];
        } else {
          fileName = this.id;
        }
        this.zip.name = fileName + '.zip';
      },
      deep: true
    },
    'id': {
      async handler(newValue, oldValue) {
        await this.getObjectZip(newValue);
      },
      immediate: true
    }
  },
  mounted() {
    let zipFileName = '';
    if (this.name && this.name[0] && this.name?.[0]['@value']) {
      zipFileName = this.name?.[0]['@value'];
    } else {
      zipFileName = this.id;
    }
    this.zip.name = zipFileName + '.zip';
  },
  methods: {
    async getObjectZip(id) {
      const route = `/object/${encodeURIComponent(id)}.zip`;
      let response = await this.$http.head({route});
      if (response.status === 200) {
        //TODO: response headers
        //TODO: calculate size from bites from the header called
        this.zip.url = `/api${route}`;
        try {
          const expandedSize = response.headers.get('Content-Length-Estimate')
          this.zip.expandedSize = convertSize(parseInt(expandedSize), {accuracy: 2});
        } catch (e) {
          console.error(e);
        }
        const numberOfFiles = response.headers.get('Archive-File-Count')
        this.zip.numberOfFiles = numberOfFiles;
      }
    }
  }
}
</script>
