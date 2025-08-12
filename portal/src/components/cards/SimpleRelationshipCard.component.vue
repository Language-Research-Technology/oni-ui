<template>
  <template v-if="objectTotals > 0">
    <template v-for="(f, index) of objects" :key="index">
      <ul>
        <li class="font-semibold" v-if="f">
          <el-link class="ml-2" :underline="true" type="primary" :href="'/object?_id=' + f._id">
            {{ first(f._source.name)?.['@value'] || f._id }}
          </el-link>
        </li>
      </ul>
    </template>
  </template>
  <template v-else>
    <p>No {{ objectName }} associated with this item.</p>
  </template>
</template>
<script>
import { first } from 'lodash';

export default {
  props: ['id', 'objectType', 'objectName'],
  data() {
    return {
      metaPath: '',
      objects: [{}],
      scrollId: '',
      objectTotals: 0,
      objectsScrollId: '',
    };
  },
  mounted() {
    this.getNextobjects();
  },
  methods: {
    first,
    async getNextobjects(scrollId) {
      const items = await this.$elasticService.multi({
        scroll: true,
        filters: {
          'input.@id': [this.id],
          '@type': [this.objectType],
        },
        sort: 'relevance',
        order: 'desc',
      });
      this.objectTotals = items?.hits?.total?.value;
      this.objectsScrollId = items?._scroll_id;
      const thisItems = items?.hits?.hits;
      if (thisItems) {
        this.objects = thisItems;
      } else {
        this.objects = this.objects.concat(thisItems);
      }
      this.loading = false;
    },
  },
};
</script>
