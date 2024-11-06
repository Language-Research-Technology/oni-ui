<template>
  <template v-if="buckets.length>0" class="w-full" v-for="(b, index) of buckets" :key="b.key+'_'+index">
    <AggregationAsIcon v-if="asIcons" :item="b.key" :id="id" :field="field"/>
    <span v-else>{{ b.key }}<span v-if="index + 1 < buckets.length">,&nbsp;</span></span>
  </template>
  <template class="w-full" v-else>
    <AggregationAsIcon v-if="asIcons" :item="item" :field="field"/>
  </template>
</template>
<script>
import { isUndefined, orderBy, uniqBy } from 'lodash';
import AggregationAsIcon from '../widgets/AggregationAsIcon.component.vue';

export default {
  components: { AggregationAsIcon },
  props: ['aggregations', 'field', 'asIcons', 'id', 'item'],
  data() {
    return {
      licenses: this.$store.state.configuration.ui?.licenses || [],
    };
  },
  computed: {
    buckets() {
      const buckets = [];
      const bucketAggs = this.aggregations?.[this.field.name]?.buckets;
      if (Array.isArray(bucketAggs) && bucketAggs.length > 0) {
        for (const bucket of bucketAggs) {
          let key = '';
          if (this.field.name === 'license.@id') {
            key = this.findLicense(bucket.key);
          } else {
            key = bucket.key;
          }
          buckets.push({
            key,
            name: this.field.name,
            display: this.field.display,
          });
        }
        const uniqueBuckets = uniqBy(buckets, 'key');
        const orderedBuckets = orderBy(uniqueBuckets, ['key']);
        return orderedBuckets;
      }
      return [];
    },
  },
  methods: {
    findLicense(key) {
      const license = this.licenses.find((l) => l.license === key);
      if (license) {
        if (isUndefined(license.access)) {
          return 'login';
        }
        return license.access;
      }
      return 'public';
    },
  },
};
</script>
