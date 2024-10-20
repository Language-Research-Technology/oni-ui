<template>
  <el-row :gutter="0" :offset="0" style="" class="pb-4 pt-0 p-2 px-3">
      <div class="pr-0">
        <div class="top-20 z-10 bg-white pb-3">
          <el-row :align="'middle'" class="mt-4 pb-2 border-0 border-b-[2px] border-solid border-red-700 text-2xl">
            <el-col>
              <span id="total_results"
                    class="my-1 mr-2" v-show="this.totals">Total: <span>{{ this.totals }} entries</span></span>
            </el-col>
            <el-col>
              <el-button size="large" @click="showMap()">
                <span>
                  <font-awesome-icon icon="fa-solid fa-map-location"/>&nbsp;Map View
                <el-tooltip content="View the results as a map. Note that current search and filter options will be reset."
                            placement="bottom-end" effect="light">
                  <font-awesome-icon icon="fa fa-circle-question"/>
                </el-tooltip>
                </span>
              </el-button>
            </el-col>
          </el-row>
        </div>
        <el-row class="pt-2">
          <el-col class="flex space-x-4 pb-2">
            <el-select v-model="selectedSorting" @change="sortResults" class="my-1">
              <template #prefix>Sort by:</template>
              <el-option
                  v-for="item in sorting"
                  :key="item.value"
                  :label="item.label"
                  :value="item.value"
              />
            </el-select>
            <el-select v-model="selectedOrder" @change="orderResults" class="my-1">
              <template #prefix>Order by:</template>
              <el-option
                  v-for="item in ordering"
                  :key="item.value"
                  :label="item.label"
                  :value="item.value"
              />
            </el-select>
          </el-col>
        </el-row>
        <div class="py-0 w-full pb-2">
          <el-pagination class="items-center w-full"
                         background layout="prev, pager, next"
                         :total="totals"
                         v-model:page-size="pageSize"
                         @update:page-size="pageSize"
                         v-model:currentPage="currentPage"
                         @current-change="updatePages($event, 'top_menu')"/>
        </div>
        <div v-for="item of this.items" :key="item._id"
             class="z-0 mt-0 mb-4 w-full"
             v-loading="loading">
          <search-detail-element v-if="item.record" :id="item.crateId" :href="getSearchDetailUrl(item)"
                                 :name="item.record.name"
                                 :conformsTo="item.conformsTo" :types="item.types"
                                 :_memberOf="item.memberOf" :highlight="item.description"
                                 :root="item.record._root"
                                 :parent="item.record._parent"
                                 :details="item.record" :score="item._score"/>
        </div>
        <div v-loading="loading" v-if="!this.items.length > 0">
          <el-row class="pb-4 items-center">
            <h5 class="mb-2 text-2xl tracking-tight dark:text-white">
              <span v-if="!loading">No items found</span>
            </h5>
          </el-row>
        </div>
        <div class="py-2 w-full">
          <el-pagination class="items-center w-full"
                         background layout="prev, pager, next"
                         :total="totals"
                         v-model:page-size="pageSize"
                         @update:page-size="pageSize"
                         v-model:currentPage="currentPage"
                         @current-change="updatePages($event, 'total_results')"/>
        </div>
      </div>
  </el-row>
  <el-dialog v-model="errorDialogVisible" width="40%" center>
    <el-alert title="Error" type="warning" :closable="false">
      <p class="break-normal">{{ this.errorDialogText }}</p>
    </el-alert>
    <template #footer>
        <span class="dialog-footer">
          <el-button type="primary" @click="errorDialogVisible = false">Close</el-button>
        </span>
    </template>
  </el-dialog>
  <el-row></el-row>
</template>


<script>

import {first, last, isEmpty, orderBy, find, isUndefined} from 'lodash';
import {CloseBold} from "@element-plus/icons-vue";
import {defineAsyncComponent, toRaw} from "vue";
import SearchDetailElement from './SearchDetailElement.component.vue';
import SearchAggs from './SearchAggs.component.vue';
import {putLocalStorage, getLocalStorage, removeLocalStorage} from '@/storage';
import SearchAdvanced from "./SearchAdvanced.component.vue";
import SearchMap from "./SearchMap.component.vue";

import {v4 as uuid} from 'uuid';

export default {
  components: {
    SearchBar: defineAsyncComponent(() =>
        import("@/components/SearchBar.component.vue")
    ),
    SearchAdvanced,
    SearchDetailElement,
    CloseBold,
    SearchAggs,
    SearchMap
  },
  data() {
    const sorting = this.$store.state.configuration.ui.search?.sorting || [
      {value: 'relevance', label: 'Relevance'}
    ];
    const ordering = this.$store.state.configuration.ui.search?.ordering || [
      {value: 'asc', label: 'Ascending'},
      {value: 'desc', label: 'Descending'}
    ];

    return {
      items: [],
      totals: 0,
      pageSize: 10,
      currentPage: 1,
      loading: false,
      errorDialogVisible: false,
      errorDialogText: '',
      conformsToNotebook: this.$store.state.configuration.ui.conformsTo?.notebook,
      sorting,
      ordering,
      selectedSorting: first(sorting),
      selectedOrder: first(ordering)
    };
  },
  async created() {
    console.log('created');
    await this.fetch();
    putLocalStorage({key: 'lastRoute', data: this.$route.fullPath});
  },
  async mounted() {
    console.log('mounted');
  },
  async updated() {
    console.log('updated');
    putLocalStorage({key: 'lastRoute', data: this.$route.fullPath});
  },
  methods: {
    first,
    isEmpty,
    isUndefined,
    async fetch() {
      this.loading = true;

      try {
        const params = {
          limit: this.pageSize,
          sortBy: this.selectedSorting.value,
          sortDirection: this.selectedOrder.value,
        };

        if (this.$route.query.conformsTo) {
          params.conformsTo = this.$route.query.conformsTo;
        }
        if (this.currentPage !== 1) {
          params.offset = (this.currentPage - 1) * this.pageSize;
        }

        const data = await this.$api.get('/objects', params);

        this.totals = data.total
        this.items = data.data;
      } catch (e) {
        this.errorDialogVisible = true;
        this.errorDialogText = e.message;
      }

      this.loading = false;
    },
    scrollToTop() {
      window.scrollTo(0, 0);
    },
    getSearchDetailUrl(item) {
      // TODO: this is not good, maybe do it with a ConformsTo to specify link.
      // But have to think about it because not all files have conformsTo!
      const { types } = item;
      const repoType = types.find(t => t === 'RepositoryCollection');
      const fileType = types.find(t => t === 'File');
      const itemType = types.find(t => t === 'RepositoryObject');

      const crateId = encodeURIComponent(item.crateId);

      if (repoType) {
        return `/collection?crateId=${crateId}`;
      }

      if (itemType) {
        return `/object?crateId=${crateId}`;
      }

      // FIXME: Deal with files
      // if (fileType) {
      //   let isNotebook;
      //   if (item._source?.['conformsTo']) {
      //     isNotebook = item._source['conformsTo'].find(c => c['@id'] === this.conformsToNotebook);
      //   }
      //
      //   if (isNotebook) {
      //     id = encodeURIComponent(item._id);
      //     return `/object?_id=${id}`;
      //   } else {
      //     const fileId = id;
      //     id = encodeURIComponent(first(item._source['_parent'])?.['@id']);
      //     return `/object?id=${id}&_crateId=${crateId}&fileId=${fileId}`
      //   }
      // }

      // Defaults to object if it doesnt know what it is
      return `/object?crateId=${crateId}`;
    },
    sortResults(sort) {
      this.currentPage = 1;
      this.selectedSorting = find(this.sorting, {value: sort});

      this.fetch();
    },
    orderResults(order) {
      this.currentPage = 1;
      this.selectedOrder = find(this.ordering, {value: order});
      this.fetch();
    },
    async updatePages(page, scrollTo) {
      this.currentPage = page;
      await this.fetch();
      this.scrollToTop();
    },
    showMap() {
      this.$router.push({path: '/map'});
    }
  }
};
</script>
<style>
html {
  scroll-behavior: smooth;
}
</style>
