<template>
  <el-row>
    <el-col :span="24" class="divide-solid divide-y-2 divide-red-700">
      <div class="grid-content p-6">
        <h5 class="mb-2 text-2xl tracking-tight dark:text-white">
          {{ title }}: {{ items?.total }}
        </h5>
      </div>
      <div></div>
    </el-col>
  </el-row>
  <el-row class="p-10">
    <el-col :xs="24" :sm="24" :md="24" :lg="24" :xl="24">
      <template v-if="Array.isArray(items?.aggregations)">
        <ul v-for="(index, d) of items.aggregations">
          <li>{{ d._source }}</li>
        </ul>
      </template>
      <template v-else>{{ items?.data?._source }}</template>
    </el-col>
    <el-col :xs="24" :sm="24" :md="24" :lg="24" :xl="24">
      <div class="py-2 w-full">
        <el-pagination class="items-center w-full"
                       background layout="prev, pager, next"
                       :total="items?.total || 0"
                       v-model:page-size="pageSize"
                       v-model:currentPage="currentPage"
                       @current-change="updatePages($event)"
                       @update:page-size="pageSize"/>
      </div>
      <template v-if="Array.isArray(items?.data)">
        <div v-loading="loading">
          <ul v-for="d of items.data" :key="d._id">
            <li>
              <collection-item :field="d._source" :routePath="routePath"/>
            </li>
          </ul>
        </div>
      </template>
      <template v-else>
        <elastic-resolve-field :field="items?.data?._source"/>
      </template>
    </el-col>
  </el-row>
</template>
<script>
import {first} from "lodash";
import CollectionItem from "./CollectionItem.component.vue";
import ElasticResolveField from "./ElasticResolveField.component.vue";
import {toRaw} from "vue";
import toInt from "validator/es/lib/toInt";

export default {
  components: {
    CollectionItem,
    ElasticResolveField
  },
  props: ['title', 'id', 'conformsTo', 'routePath'],
  data() {
    return {
      items: [],
      pageSize: 10,
      currentPage: 1,
      loading: false
    }
  },
  async mounted() {
    await this.setMembers();
  },
  async updated() {
    await this.setMembers();
  },
  watch: {},
  methods: {
    toInt,
    first,
    async setMembers() {
      this.items = await this.filter({
        '_memberOf.@id': [this.id],
        'conformsTo.@id': [this.conformsTo]
      }, true);
    },
    async updatePages(page) {
      this.currentPage = page;
      await this.setMembers();
    },
    //TODO: refactor this integrate to multi
    async filter(filters) {
      this.loading = true;
      const items = await this.$elasticService.multi({
        multi: this.searchQuery,
        filters: toRaw(filters),
        sort: 'relevance',
        order: 'desc',
        operation: 'must',
        pageSize: this.pageSize,
        searchFrom: (this.currentPage - 1) * this.pageSize
      });
      this.loading = false;
      if (items?.hits?.hits.length > 0) {
        return {
          data: items?.hits?.hits,
          aggregations: items?.aggregations,
          total: items.hits?.total.value,
          scrollId: items?._scroll_id,
          route: null
        }
      }
    }
  }
}
</script>
