<template>
  <template v-if="total">
    <el-row>
      <el-col :span="24" class="divide-solid divide-y-2 divide-red-700">
        <div class="grid-content p-6">
          <h5 class="mb-2 text-2xl tracking-tight dark:text-white">
            {{ title }}: {{ total }}
          </h5>
        </div>
        <div></div>
      </el-col>
    </el-row>
    <el-row class="p-10">
      <el-col :xs="24" :sm="24" :md="24" :lg="24" :xl="24">
        <div class="py-2 w-full">
          <el-pagination class="items-center w-full"
                         background layout="prev, pager, next"
                         :total="total"
                         v-model:page-size="pageSize"
                         v-model:currentPage="currentPage"
                         @current-change="updatePages($event)"
                         @update:page-size="pageSize"/>
        </div>
        <div v-loading="loading">
          <ul v-for="item of items" :key="item.id">
            <li>
              <collection-item :field="item" :routePath="routePath"/>
            </li>
          </ul>
        </div>
      </el-col>
    </el-row>
  </template>
</template>
<script>
import {first} from 'lodash';
import CollectionItem from './CollectionItem.component.vue';
import ElasticResolveField from './ElasticResolveField.component.vue';
import {toRaw} from 'vue';
import toInt from 'validator/es/lib/toInt';

export default {
  components: {
    CollectionItem,
    ElasticResolveField,
  },
  props: ['title', 'id', 'conformsTo', 'routePath'],
  data() {
    return {
      items: null,
      total: 0,
      pageSize: 10,
      currentPage: 1,
      loading: false,
    };
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
      const params = {
        memberOf: this.id,
        conformsTo: this.conformsTo,
        limit: this.pageSize,
        sort: 'title',
        order: 'asc',
      };

      if (this.currentPage !== 1) {
        params.offset = (this.currentPage - 1) * this.pageSize;
      }

      this.loading = true;

      const response = await this.$api.getObjects(params);
      this.items = response.data;
      this.total = response.total;

      this.loading = false;
    },
    async updatePages(page) {
      this.currentPage = page;
      await this.setMembers();
    },
  },
};
</script>
