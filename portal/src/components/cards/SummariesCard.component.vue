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
  props: ['aggregations', 'fields', 'name', 'id', 'root', 'link', 'title'],
  data() {
    return {
      buckets: [],
      loading: false
    };
  },
  mounted() {
    //this.populateBuckets();
  },
  computed() {
    //this.populateBuckets();
  },
  watch: {
    aggregations: {
      handler() {
        if (this.aggregations) {
          this.populateBuckets();
        }
      },
      flush: 'post',
      immediate: true,
    },
  },
  methods: {
    populateBuckets() {
      this.loading = true;
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
      if(this.buckets.length === 0) {
        // Hack to show no data found
        this.buckets = [{
          field: `No ${this.title} Found`,
          buckets: [{}]
        }];
      }
      this.loading = false;
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
