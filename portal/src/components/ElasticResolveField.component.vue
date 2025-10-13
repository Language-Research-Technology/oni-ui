<template>
  <template v-if="name === '_contentLocation'">
    {{field}}
    <LeafletMap class="h-72 flex grow min-w-[200px] mr-4"
                :modelValue="fieldMap"
                :transformer="transformer"
                :enableDrawing="false"></LeafletMap>
    <p class="text-sm">This map is not designed or suitable for Native Title research.</p>
  </template>
  <template v-else>
    <template v-if="isURL">
      <a class="break-words break-all underline text-blue-600 hover:text-blue-800 visited:text-purple-600"
         :href="field" target="_blank">{{field}}</a>
    </template>
    <template v-else>
      <span class="break-words break-all">{{ this.field }}</span>
    </template>
  </template>
</template>
<script>
import { first } from 'lodash';
import LeafletMap from './widgets/LeafletMap.vue';
import transformer from './widgets/geo';

export default {
  components: {
    LeafletMap,
  },
  props: ['name', 'field', 'routePath', 'filePath', 'parentId', 'crateId'],
  data() {
    return {
      isURL: false,
      link: '',
      fieldMap: {},
    };
  },
  mounted() {
    if (this.field) {
      if (this.name === '_contentLocation' || this.name === '_spatialCoverage') {
        this.fieldMap = { '@type': ['Geometry'], asWKT: [this.field] };
      } else {
        this.isURL = this.testURL(this.field);
        if (!this.isURL) {
          this.link = this.tryResolve();
        }
      }
    }
  },
  methods: {
    transformer,
    first,
    testURL(url) {
      if (typeof url === 'string') {
        return url.startsWith('http');
      }
    },
    tryResolve(uri) {
      if (this.filePath) {
        return `/${this.routePath}?id=${encodeURIComponent(this.parentId)}&_crateId=${encodeURIComponent(this.crateId)}&fileId=${this.filePath}`;
      }
      return `/${this.routePath}?id=${encodeURIComponent(this.field)}&_crateId=${encodeURIComponent(this.crateId)}`;
    },
  },
};
</script>
