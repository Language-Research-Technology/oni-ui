<template>
  <template v-if="name === '_location'">
    <LeafletMap class="h-72 flex grow min-w-[200px] mr-4"
                :modelValue="fieldMap"
                :transformer="transformer"></LeafletMap>
  </template>
  <template v-else>
    <template v-if="isURL">
      <a class="break-words break-all underline text-blue-600 hover:text-blue-800 visited:text-purple-600"
         :href="field" target="_blank">{{field}}</a>
    </template>
    <template v-else>
      <el-link class="break-words break-all" type="primary" :href="this.link">{{ this.field }}</el-link>&nbsp;
      <el-tooltip v-if="field"
                  class="box-item"
                  effect="light"
                  trigger="click"
                  content="This is a sharable link, right click and copy it to share"
                  placement="top"
      >
        <el-button link>
          <font-awesome-icon icon="fa-solid fa-circle-info"/>
        </el-button>
      </el-tooltip>
    </template>
  </template>
</template>
<script>
import {first} from "lodash";
import transformer from './widgets/geo';
import LeafletMap from './widgets/LeafletMap.vue';

export default {
  components: {
    LeafletMap
  },
  props: ['name', 'field', 'routePath', 'filePath', 'parentId', 'crateId'],
  data() {
    return {
      isURL: false,
      link: '',
      fieldMap: {}
    }
  },
  mounted() {
    if (this.field) {
      if (this.name === '_location') {
        this.fieldMap = {'@type': ['Geometry'], asWKT: [this.field]};
      } else {
        this.isURL = this.testURL(this.field)
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
      } else {
        return `/${this.routePath}?id=${encodeURIComponent(this.field)}&_crateId=${encodeURIComponent(this.crateId)}`;
      }
    }
  }
}
</script>
