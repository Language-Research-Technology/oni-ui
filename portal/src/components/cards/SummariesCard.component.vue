<template>
  <template v-for="(f, index) of buckets" :key="f.field+'_'+index" v-loading="loading">
    <ul>
      <li v-if="f?.buckets.length > 1">
        <ul>
          <li><span class="font-semibold">{{ f.field }}</span></li>
          <template v-for="bucket of f?.buckets" :key="bucket.key">
            <li v-if="bucket.doc_count > 0" class="ml-4 pl-2">
              <el-link :underline="true"
                       type="primary"
                       :href="getSearchUrl(f.name, bucket.key)">{{ bucket.key }}
                <!--: {{ bucket.doc_count }}--></el-link>
            </li>
          </template>
        </ul>
      </li>
      <li v-else-if="f?.buckets.length === 1">
        <ul>
          <li><span class="font-semibold">{{ f.field }}</span></li>
          <template v-for="bucket of f?.buckets" :key="bucket.key">
            <li class="ml-4 pl-2">{{ bucket.key }}</li>
          </template>
        </ul>
      </li>
    </ul>
  </template>
</template>
<script>
import { first } from 'lodash';

export default {
  props: ['aggregations', 'fields', 'name', 'id', 'root', 'link'],
  data() {
    return {
      buckets: [],
      loading: false,
    };
  },
  mounted() {
    this.loading = true;
    this.populateBuckets();
    this.loading = false;
  },
  computed() {
    this.loading = true;
    this.populateBuckets();
    this.loading = false;
  },
  watch: {
    aggregations: {
      handler() {
        if (this.aggregations) {
          this.loading = true;
          this.populateBuckets();
          this.loading = false;
        }
      },
      flush: 'post',
      immediate: true,
    },
  },
  methods: {
    populateBuckets() {
      this.buckets = [];
      for (const field of this.fields) {
        if (this.aggregations?.[field?.name]) {
          this.buckets.push({
            name: field.name,
            field: field.display,
            buckets: this.aggregations[field.name]?.buckets,
          });
        }
      }
    },
    getSearchUrl(name, bucket) {
      const part = {};
      part[name] = [bucket];
      const root = first(this.root);
      const rootName = first(root?.name)?.['@value'];
      if (rootName) {
        part['_root.name.@value'] = [rootName];
      } else {
        part['_collectionStack.@id'] = [this.id];
      }
      const stringify = JSON.stringify(part);
      //console.log(`/search?f=${stringify}`);
      return `/search?f=${encodeURIComponent(stringify)}`;
    },
    getExternalUrlFromId(name, bucket) {
      return id;
    },
  },
};
</script>
