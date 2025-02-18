<template>
  <template v-for="(f, index) of buckets" :key="f.field+'_'+index" v-loading="loading">
    <h5><span class="font-semibold">{{ f.field }}</span></h5>
    <ul class="list-disc my-2 mx-3 pl-2" v-if="f?.buckets.length > 0">
      <template v-for="bucket of f?.buckets" :key="bucket.key">
        <li>{{ bucket.key }}</li>
      </template>
    </ul>
  </template>
</template>
<script>
import { first } from 'lodash';
import PropertyValue from '../PropertyValue.component.vue';

export default {
  components: {
    PropertyValue,
  },
  props: ['aggregations', 'fields', 'name', 'id', 'root', 'external', 'fieldName'],
  data() {
    return {
      buckets: [],
      loading: false,
    };
  },
  async mounted() {
    this.loading = true;
    const result = await this.filter({ '_collectionStack.@id': [this.id] });
    this.buckets = result.aggregations;
    this.loading = false;
  },
  computed() {
    this.loading = true;
    this.populateBuckets();
    this.loading = false;
  },
  watch: {},
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
    //TODO: refactor this integrate to multi
    async filter(filters) {
      const items = await this.$elasticService.multi({
        filters: filters,
        aggs: this.aggregations,
        sort: 'relevance',
        order: 'desc',
      });
      if (items?.hits?.hits.length > 0) {
        return {
          data: items?.hits?.hits,
          aggregations: items?.aggregations,
          total: items.hits?.total.value,
          scrollId: items?._scroll_id,
          route: null,
        };
      }
    },
  },
};
</script>
