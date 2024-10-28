<template>
  <template v-if="isURL">
    <a class="break-words underline text-blue-600 hover:text-blue-800 visited:text-purple-600"
       :href="this.field?.['@id']" target="_blank">{{
        first(this.field?.['name'])?.['@value'] || this.field?.['@id']
      }}</a>
  </template>
  <template v-else-if="value">{{ this.field?.['@value'] }}</template>
  <template v-else>
    <p>
      <el-link type="primary" :href="this.link">{{ first(this.field?.['name'])?.['@value'] || this.field?.['@id'] }}
      </el-link>
    </p>
  </template>
</template>
<script>
import { first } from 'lodash';
//  {{ first(field)?.['@value'] }}
export default {
  props: ['field', 'routePath'],
  data() {
    return {
      isURL: false,
      value: false,
      link: '',
    };
  },
  mounted() {
    const id = this.field?.['@id'];
    const tryCrateId = this.field?._crateId;
    const crateId = first(tryCrateId)?.['@value'];
    this.isURL = this.testURL(id);
    if (!this.isURL) {
      this.link = `/${this.routePath}?id=${encodeURIComponent(id)}&_crateId=${encodeURIComponent(crateId || id)}`;
    }
  },
  methods: {
    first,
    testURL(url) {
      return url.startsWith('http');
    },
  },
};
</script>
