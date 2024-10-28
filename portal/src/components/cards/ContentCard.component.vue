<template>
  <template v-for="(f, index) of buckets" :key="index" v-loading="loading">
    <ul>
      <li v-if="f?.buckets.length > 0">
        <ul>
          <li><span class="font-semibold">{{ f.field }}</span></li>
          <template v-for="bucket of f?.buckets" :key="bucket.key">
            <li v-if="bucket.doc_count > 0" class="ml-4 pl-2">
              {{ bucket.key }}: {{ bucket.doc_count }}
            </li>
          </template>
        </ul>
      </li>
    </ul>
  </template>
</template>
<script>
export default {
  props: ['id', 'fields'],
  data() {
    return {
      buckets: [],
      loading: false,
    };
  },
  async mounted() {
    this.loading = true;
    await this.populateBuckets();
    this.loading = false;
  },
  methods: {
    async populateBuckets() {
      const items = await this.$elasticService.multi({
        filters: { '_collectionStack.@id': [this.id] },
        sort: 'relevance',
        order: 'desc',
      });
      const aggregations = items?.aggregations;
      this.buckets = [];
      for (const field of this.fields) {
        if (aggregations?.[field?.name]) {
          this.buckets.push({ field: field.display, buckets: aggregations[field.name]?.buckets });
        }
      }
    },
  },
};
</script>
