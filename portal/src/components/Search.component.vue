<template>
  <el-row :gutter="0" :offset="0" style="" class="pb-4 pt-0">
    <el-col :xs="24" :sm="9" :md="9" :lg="7" :xl="7" :offset="0"
            class="h-full max-h-screen overflow-y-auto flex flex-col h-screen p-2"
            id="search_aggregation">
      <div v-show="!advancedSearch"
           class="flex-1 w-full min-w-full bg-white rounded mt-4 mb-4 shadow-md border">
        <search-bar ref='searchBar' @populate='populate' :searchInput="searchInput"
                    @search="search" :clearSearch="clear" :filters="this.filters" :fields="searchFields"
                    class="grow justify-items-center items-center m-4"
                    @advanced-search="enableAdvancedSearch" :enableAdvancedSearch="advancedSearch"
                    @updateSearchInput="onInputChange"
                    @basicSearch="updateRoutes" :searchPath="'search'"/>
      </div>
      <div class="flex-1 w-full min-w-full bg-white mt-4 mb-4 border-b-2">
        <div class="py-3 px-2">
          <div class="">
            <p class="text-xl text-gray-600 dark:text-gray-300 font-semibold py-1 px-2">
              Filters
            </p>
          </div>
        </div>
      </div>
      <div class="pt-2">
        <div class="flex w-full" v-for="aggs of aggregations" :key="aggs.name">
          <ul v-if="aggs?.buckets?.length > 0 && !aggs['hide']"
              class="flex-1 w-full min-w-full bg-white rounded p-2 mb-4 shadow-md border">
            <li @click="aggs.active = !aggs.active"
                class="hover:cursor-pointer py-3 flex md:flex md:grow flex-row justify-between space-x-1">
                <span class="text-xl text-gray-600 dark:text-gray-300 font-semibold py-1 px-2">
                  {{ aggs.display }}
                      <el-tooltip v-if="aggs.help"
                                  class="box-item"
                                  effect="light"
                                  trigger="hover"
                                  :content="aggs.help"
                                  placement="top"
                      >
                      <el-button link>
                        <font-awesome-icon icon="fa-solid fa-circle-info"/>
                      </el-button>
                    </el-tooltip>
                </span>
              <span class="py-1 px-2">
                    <font-awesome-icon v-if="aggs.active" icon="fa fa-chevron-down"/>
                  <span v-else>
                    <span class="text-xs rounded-full w-32 h-32 text-white bg-purple-500 p-1">{{
                        aggs?.buckets?.length
                      }}</span>&nbsp;
                    <font-awesome-icon icon="fa fa-chevron-right"/>
                    </span>
                </span>
            </li>
            <li v-if="aggs?.buckets?.length <= 0" class="w-full min-w-full">&nbsp;</li>
            <search-aggs :buckets="aggs.buckets" :aggsName="aggs.name" :ref="aggs.name"
                         v-show="aggs.active" @is-active="aggs.active = true"
                         @changed-aggs="newAggs"/>
          </ul>
        </div>
      </div>
    </el-col>
    <el-col :xs="24" :sm="15" :md="15" :lg="17" :xl="17" :offset="0"
            class="max-h-screen overflow-y-auto flex flex-row h-screen p-2 px-3"
            id="search_results">
      <div v-show="advancedSearch" id="advanced_search_box"
           class="flex-1 w-full min-w-full bg-white rounded mt-4 mb-4 shadow-md border">
        <search-advanced :advancedSearch="advancedSearch" :fields="searchFields"
                         @basic-search="basicSearch"
                         @do-advanced-search="updateRoutes" :resetAdvancedSearch="resetAdvancedSearch"/>
      </div>
      <div class="pr-0">
        <div class="top-20 z-10 bg-white pb-3">
          <el-row :align="'middle'" class="mt-4 pb-2 border-0 border-b-[2px] border-solid border-red-700 text-2xl">
            <el-col :xs="24" :sm="24" :md="18" :lg="18" :xl="16">
              <el-button-group class="mr-1">
                <el-button type="warning" v-show="changedFilters" @click="updateRoutes({updateFilters: true})">Apply
                  Filters
                </el-button>
              </el-button-group>
              <span class="my-1 mr-1" v-show="!changedFilters" v-if="!isEmpty(this.filters)">Filtering by:</span>
              <el-button-group v-show="!changedFilters"
                               class="my-1 mr-2" v-for="(filter, filterKey) of this.filters" :key="filterKey"
                               v-model="this.filters">
                <el-button plain>{{ clean(filterKey) }}</el-button>
                <el-button v-if="filter && filter.length > 0" v-for="f of filter" :key="f" color="#626aef" plain
                           @click="this.updateFilters({clear: {f, filterKey }})" class="text-2xl">
                  {{ clean(f) }}
                  <el-icon class="el-icon--right">
                    <CloseBold/>
                  </el-icon>
                </el-button>
              </el-button-group>
              <el-button-group class="mr-1">
                <el-button v-show="!isEmpty(this.filters)" @click="clearFilters()">Clear Filters</el-button>
              </el-button-group>
              <span id="total_results"
                    class="my-1 mr-2" v-show="this.totals['value']">Total: <span>{{ this.totals['value'] }} Index entries (Collections, Objects, Files and Notebooks)</span></span>
            </el-col>
            <el-col :xs="24" :sm="24" :md="6" :lg="6" :xl="6">
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
          <el-col :span="24" class="flex space-x-4 pb-2">
            <el-button-group class="my-1">
              <el-button type="default" v-on:click="this.resetSearch">RESET SEARCH</el-button>
            </el-button-group>
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
                         :total="totals['value'] || 0"
                         v-model:page-size="pageSize"
                         @update:page-size="pageSize"
                         v-model:currentPage="currentPage"
                         @current-change="updatePages($event, 'top_menu')"/>
        </div>
        <div v-for="item of this.items" :key="item._id"
             class="z-0 mt-0 mb-4 w-full"
             v-loading="loading">
          <search-detail-element v-if="item._source" :id="item._source['@id']" :href="getSearchDetailUrl(item)"
                                 :name="first(item._source.name)?.['@value'] || first(first(item._source.identifier)?.value)?.['@value']"
                                 :conformsTo="item.conformsTo" :types="item._source?.['@type']"
                                 :_memberOf="item._source?._memberOf" :highlight="item?.highlight"
                                 :root="item._source?._root"
                                 :parent="item._source?._parent" :aggregations="aggregations"
                                 :details="item._source" :score="item._score"/>
        </div>
        <div v-loading="loading" v-if="!this.items.length > 0">
          <el-row class="pb-4 items-center">
            <h5 class="mb-2 text-2xl tracking-tight dark:text-white">
              <span v-if="!loading">No items found</span>
            </h5>
          </el-row>
          <el-row>
            <p class="text-center">
              <el-button type="primary" v-on:click="this.resetSearch">RESTART SEARCH</el-button>
            </p>
          </el-row>
        </div>
        <el-row v-if="noMoreResults" class="flex justify-center p-6">
          <h5 class="mb-2 text-1xl tracking-tight dark:text-white">
            No more items found with that filter or search query
          </h5>
        </el-row>
        <div class="py-2 w-full">
          <el-pagination class="items-center w-full"
                         background layout="prev, pager, next"
                         :total="totals['value'] || 0"
                         v-model:page-size="pageSize"
                         @update:page-size="pageSize"
                         v-model:currentPage="currentPage"
                         @current-change="updatePages($event, 'total_results')"/>
        </div>
      </div>
    </el-col>
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
  <el-row v-show="changedFilters"
          class="bg-white rounded m-4 p-4 px-8 shadow-md border"
          role="alert"
          style="bottom: 16px; z-index: 2044; position: fixed">
    <el-row class="p-2">
      <div class="w-full">
        <el-button-group class="self-center">
          <el-button @click="clearFilters()">Clear Filters</el-button>
          <el-button type="warning" @click="updateRoutes({updateFilters: true})">Apply Filters</el-button>
        </el-button-group>
      </div>
    </el-row>
  </el-row>
  <el-row></el-row>
</template>


<script>
import { getLocalStorage, putLocalStorage, removeLocalStorage } from '@/storage';
import { CloseBold } from '@element-plus/icons-vue';
import { find, first, isEmpty, isUndefined, last, orderBy, toArray } from 'lodash';
import { defineAsyncComponent, toRaw } from 'vue';
import SearchAdvanced from './SearchAdvanced.component.vue';
import SearchAggs from './SearchAggs.component.vue';
import SearchDetailElement from './SearchDetailElement.component.vue';
import SearchMap from './SearchMap.component.vue';

import { v4 as uuid } from 'uuid';

export default {
  components: {
    SearchBar: defineAsyncComponent(() => import('@/components/SearchBar.component.vue')),
    SearchAdvanced,
    SearchDetailElement,
    CloseBold,
    SearchAggs,
    SearchMap,
  },
  data() {
    return {
      searchInput: '',
      items: [],
      totals: {},
      pageSize: 10,
      currentPage: 1,
      more: false,
      aggregations: {},
      memberOfBuckets: [],
      filters: {},
      clear: false,
      filterButton: [],
      loading: false,
      top: {},
      showTopCollections: false,
      showRepositoryCollections: false,
      collections: [],
      collectionTotals: 0,
      isStart: false,
      newSearch: true,
      isBrowse: false,
      errorDialogVisible: false,
      errorDialogText: '',
      conformsToNotebook: this.$store.state.configuration.ui.conformsTo?.notebook,
      noMoreResults: false,
      searchFields: this.$store.state.configuration.ui.searchFields, // Comes from merged API configuration
      sorting: this.$store.state.configuration.ui.search?.sorting || [{ value: 'relevance', label: 'Relevance' }],
      searchSorting: this.$store.state.configuration.ui.search?.searchSorting || {
        value: 'relevance',
        label: 'Relevance',
      },
      selectedSorting: null,
      startSorting: this.$store.state.configuration.ui.search?.startSorting || {
        value: '_isTopLevel.@value.keyword',
        label: 'Collections',
      },
      defaultSorting: this.$store.state.configuration.ui.search?.defaultSorting || {
        value: 'relevance',
        label: 'Relevance',
      },
      ordering: this.$store.state.configuration.ui.search?.ordering || [
        { value: 'asc', label: 'Ascending' },
        { value: 'desc', label: 'Descending' },
      ],
      defaultOrder: this.$store.state.configuration.ui.search?.defaultOrder || { value: 'asc', label: 'Ascending' },
      selectedOrder: this.$store.state.configuration.ui.search?.defaultOrder || { value: 'asc', label: 'Ascending' },
      searchFrom: 0,
      selectedOperation: 'must',
      changedFilters: false,
      advancedSearch: false,
      advancedQueries: null,
      resetAdvancedSearch: false,
    };
  },
  watch: {
    async '$route.query'() {
      this.loading = true;
      if (this.$route.query.s) {
        this.isStart = true;
        this.resetSearch();
      } else {
        await this.updateFilters({});
        this.onInputChange(this.$route.query.q);
        this.currentPage = 1;
        if (this.$route.query.a) {
          this.updateAdvancedQueries();
        }
        await this.search();
      }
      this.loading = false;
    },
  },
  async created() {
    console.log('created');
    this.isStart = true;
    await this.updateFilters({});
    if (this.$route.query.q) {
      this.searchInput = this.$route.query.q;
    }
    if (this.$route.query.a) {
      this.updateAdvancedQueries();
    } else {
      this.advancedSearch = false;
      removeLocalStorage({ key: 'advancedQueries' });
    }
    this.loading = true;
    // const aggregations = await this.$elasticService.multi({
    //   multi: '',
    //   filters: {},
    //   sort: this.sorting[0].value,
    //   order: 'desc',
    //   operation: 'must',
    //   pageSize: 10,
    //   searchFrom: 0
    // });
    // this.aggregations = this.populateAggregations(aggregations['aggregations']);
    await this.search();
    this.loading = false;
    putLocalStorage({ key: 'lastRoute', data: this.$route.fullPath });
  },
  async mounted() {
    console.log('mounted');
    await this.updateFilters({});
    if (this.$route.query.o) {
      this.selectedOperation = this.$route.query.o;
    }
    if (!this.$route.query.sf) {
      this.searchFields = this.$store.state.configuration.ui.searchFields;
    }
    if (this.$route.query.a) {
      this.updateAdvancedQueries();
    } else {
      this.advancedSearch = false;
    }
  },
  async updated() {
    console.log('updated');
    if (this.$route.query.q) {
      this.advancedSearch = false;
    }
    // await this.updateFilters({});
    putLocalStorage({ key: 'lastRoute', data: this.$route.fullPath });
  },
  methods: {
    toArray,
    first,
    isEmpty,
    isUndefined,
    async updateFilters({ clear, empty }) {
      try {
        // updating filters from command
        if (clear?.f && clear?.filterKey) {
          if (this.filters[clear.filterKey]) {
            this.filters[clear.filterKey].splice(this.filters[clear.filterKey].indexOf(clear.f), 1);
            if (isEmpty(this.filters[clear.filterKey])) {
              delete this.filters[clear.filterKey];
            }
            //if there is an update on the filter the site will do another search.
            await this.updateRoutes({ updateFilters: true });
          }
        } else {
          // or updating filters from routes
          if (isEmpty(this.$route.query.f)) {
            this.filters = {};
          } else {
            let filterQuery;
            const filters = decodeURIComponent(this.$route.query.f);
            filterQuery = JSON.parse(filters);
            this.filters = {};
            for (const [key, val] of Object.entries(filterQuery)) {
              this.filters[key] = val;
              if (this.filters[key].length === 0) {
                delete this.filters[key];
              }
            }
          }
        }
      } catch (e) {
        console.error(e);
      }
    },
    async updateRoutes({ queries, updateFilters }) {
      let filters;
      const query = {};
      let localFilterUpdate = false;
      if (!isEmpty(this.filters) || updateFilters) {
        filters = toRaw(this.filters);
        filters = encodeURIComponent(JSON.stringify(filters));
        query.f = filters;
        localFilterUpdate = true;
      } else {
        query.f = undefined;
      }
      if (this.$route.query.f && !localFilterUpdate) {
        query.f = this.$route.query.f;
      }
      let localSearchGroupUpdate = false;
      if (queries?.searchGroup) {
        this.advancedQueries = queries;
        query.q = undefined;
        query.a = queries.searchGroup;
        this.currentPage = 1;
        //this.selectedSorting = this.sorting[0];
        localSearchGroupUpdate = true;
      }
      if (this.$route.query.a && !localSearchGroupUpdate) {
        query.a = this.$route.query.a;
        query.q = undefined;
        this.updateAdvancedQueries();
      } else {
        this.advancedQueries = null; //clear advanced search
        query.q = this.searchInput;
      }
      query.r = uuid();
      await this.$router.push({ path: 'search', query, replace: true });
    },
    updateAdvancedQueries() {
      this.advancedSearch = true;
      let searchGroup;
      try {
        searchGroup = JSON.parse(decodeURIComponent(this.$route.query.a));
      } catch (e) {
        throw new Error('There was a problem with your advanced query please try again');
      }
      const queryString = this.$elasticService.queryString(searchGroup);
      this.advancedQueries = { queryString, searchGroup };
    },
    async bucketSelected({ checkedBuckets, id }) {
      // this.filters[id] = checkedBuckets.map((k) => {
      //   return {key: k}
      // });
      this.filters[id] = checkedBuckets;
      await this.updateRoutes({ updateFilters: true });
    },
    populate({ items, newSearch, aggregations }) {
      this.items = [];
      if (newSearch) {
        this.newSearch = true;
      }
      if (items?.hits) {
        const thisItems = items.hits.hits;
        this.totals = items.hits.total;
        if (thisItems.length > 0) {
          for (const item of thisItems) {
            this.items.push(item);
          }
          this.more = true;
        } else {
          this.more = false;
        }
      }
      if (items?.aggregations) {
        this.aggregations = this.populateAggregations(items.aggregations);
        this.memberOfBuckets = items.aggregations?.['_memberOf.name.@value'];
      }
    },
    populateAggregations(aggregations) {
      const a = {};
      //Note: below is converted to an ordered array not an object.
      const aggInfo = this.$store.state.configuration.ui.aggregations;
      for (const agg of Object.keys(aggregations)) {
        const info = aggInfo.find((a) => a.name === agg);
        const display = info?.display;
        const order = info?.order;
        const name = info?.name;
        const hide = info?.hide;
        const active = info?.active;
        const help = info?.help;
        a[agg] = {
          buckets: aggregations[agg]?.buckets || aggregations[agg]?.values?.buckets,
          display: display || agg,
          order: order || 0,
          name: name || agg,
          hide: hide,
          active: active,
          help: help || '',
        };
      }
      return orderBy(a, 'order');
    },
    onInputChange(value) {
      this.searchInput = value;
    },
    async resetSearch() {
      this.scrollToTop();
      this.clear = !this.clear;
      this.searchInput = '';
      this.$route.query.q = '';
      this.$route.query.f = '';
      this.$route.query.t = '';
      if (this.resetAdvancedSearch) {
        this.advancedSearch = false;
      } else {
        this.advancedSearch = this.$route.query.a || false;
      }
      this.advancedQueries = null;
      this.resetAdvancedSearch = true;
      this.searchFields = this.$store.state.configuration.ui.searchFields;
      this.$route.query.sf = encodeURIComponent(this.searchFields);
      this.$route.query.o = this.selectedOperation;
      this.selectedOrder = this.defaultOrder;
      this.filterButton = [];
      this.isStart = true;
      this.isBrowse = false;
      this.currentPage = 1;
      this.filters = {};
      await this.clearAggregations();
      // await this.search();
      const query = {};
      await this.$router.push({ path: 'search', query });
    },
    scrollToTop() {
      setTimeout(() => {
        console.log('ran scrolling to top');
        document.body.scrollTop = 0; // For Safari
        document.documentElement.scrollTop = 0; // For Chrome, Firefox, IE and Opera
        window.scrollTo(0, 0);
        document.getElementById('search_results').scrollTop = 0;
        document.getElementById('search_aggregation').scrollTop = 0;
        document.getElementById('advanced_search_box').scrollTop = 0;
      }, 100);
    },
    scrollToId(id) {
      setTimeout(() => {
        // window.scroll({top: 0, left:0, behavior: 'smooth'});
        document.body.scrollTop = 0; // For Safari
        document.documentElement.scrollTop = 0; // For Chrome, Firefox, IE and Opera
        document.body.scrollTop = 0; // For Safari
        document.documentElement.scrollTop = 0; // For Chrome, Firefox, IE and Opera
        window.scrollTo(0, 0);
        const element = document.getElementById(id);
        element.scrollIntoView({ behavior: 'smooth' });
        element.scrollTop = 0;
      }, 100);
    },
    scrollToSelector(selector) {
      setTimeout(() => {
        // window.scroll({top: 0, left:0, behavior: 'smooth'});
        document.body.scrollTop = 0; // For Safari
        document.documentElement.scrollTop = 0; // For Chrome, Firefox, IE and Opera
        window.scrollTo(0, 0);
        const element = document.querySelector(selector);
        element.scrollIntoView({ behavior: 'smooth' });
        element.scrollTop = 0;
      }, 100);
    },
    async clearAggregations() {
      if (this.aggregations) {
        for (const agg of this.aggregations) {
          //TODO: ask cos this may be silly?!?
          //this.$refs[agg][0].clear();
          const name = agg?.name;
          if (this.$refs[name]) {
            for (const r of this.$refs[name]) {
              r.clear();
            }
          }
        }
      }
      this.filters = {};
    },
    async search() {
      this.loading = true;
      if (this.isStart) {
        //Revert start to sorting by the startSorting
        this.selectedSorting = this.startSorting;
        this.isStart = false;
      } else if (this.searchInput) {
        // If there is a query sort by relevance
        this.selectedSorting = this.searchSorting;
      } else if (this.advancedSearch) {
        // If advanced search is enabled sort by relevance
        this.selectedSorting = this.searchSorting;
      } else if (!this.selectedSorting) {
        // If there is one selected sorting do that
        this.selectedSorting = this.defaultSorting;
      }
      this.changedFilters = false;
      this.noMoreResults = false;
      let filters = {};
      if (!isEmpty(this.filters)) {
        filters = this.filters;
      } else {
        filters = {};
      }
      try {
        this.items = await this.$elasticService.multi({
          multi: this.searchInput,
          filters: toRaw(this.filters),
          searchFields: this.searchFields,
          sort: this.selectedSorting.value,
          order: this.selectedOrder.value,
          sortField: this.selectedSorting?.field, //This is not mandatory but if field exists in sorting it will sort by this field
          operation: this.selectedOperation,
          pageSize: this.pageSize,
          searchFrom: (this.currentPage - 1) * this.pageSize,
          queries: this.advancedQueries,
        });
        this.populate({ items: this.items, newSearch: true, aggregations: this.aggregations });
        this.loading = false;
        this.$gtag.event('search', {
          event_category: 'search',
          event_label: 'search',
        });
      } catch (e) {
        this.errorDialogVisible = true;
        this.errorDialogText = e.message;
        this.loading = false;
      }
    },
    getSearchDetailUrl(item) {
      //console.log(item);
      //TODO: this is not good, maybe do it with a ConformsTo to specify link. But have to think about it because not
      //      all files have conformsTo!
      let url;
      const types = item._source['@type'];
      const repoType = types.find((t) => t === 'RepositoryCollection');
      const fileType = types.find((t) => t === 'File');
      const itemType = types.find((t) => t === 'RepositoryObject');
      let id = encodeURIComponent(item._source['@id']);
      const crateId = encodeURIComponent(first(item._source._crateId)?.['@value']);
      if (repoType) {
        url = `/collection?id=${id}&_crateId=${crateId}`;
      } else if (itemType) {
        url = `/object?id=${id}&_crateId=${crateId}`;
      } else if (fileType) {
        let isNotebook;
        if (item._source?.conformsTo) {
          isNotebook = item._source.conformsTo.find((c) => c['@id'] === this.conformsToNotebook);
        }
        if (isNotebook) {
          id = encodeURIComponent(item._id);
          url = `/object?_id=${id}`;
        } else {
          const fileId = id;
          id = encodeURIComponent(first(item._source._parent)?.['@id']);
          url = `/object?id=${id}&_crateId=${crateId}&fileId=${fileId}`;
        }
      } else {
        //Defaults to object if it doesnt know what it is
        url = `/object?id=${id}&_crateId=${crateId}`;
      }
      return url;
    },
    clean(string) {
      if (string === 'true') {
        return 'Yes';
      }
      if (string === 'false') {
        return 'No';
      }
      string = string.replace(/@|_|(\..*)/g, '');
      return string;
    },
    sortResults(sort) {
      this.currentPage = 1;
      this.selectedSorting = find(this.sorting, { value: sort });

      this.search();
    },
    orderResults(order) {
      this.currentPage = 1;
      this.selectedOrder = find(this.ordering, { value: order });
      this.search();
    },
    async updatePages(page, scrollTo) {
      this.currentPage = page;
      await this.search();
      this.scrollToTop(); //Id(scrollTo);
    },
    async clearFilters() {
      this.filters = {};
      await this.updateRoutes({ updateFilters: true });
    },
    newAggs({ query, aggsName }) {
      if (query.f) {
        //In here we need to merge the filters
        const decodedFilters = JSON.parse(decodeURIComponent(query.f));
        this.mergeFilters(decodedFilters, aggsName);
      }
      if (query.q) {
        this.searchInput = decodeURIComponent(query.q);
      }
      console.log(isEmpty(this.filters));
      this.changedFilters = true;
    },
    enableAdvancedSearch() {
      this.advancedSearch = true;
      this.scrollToTop(); //('advanced_search_box');
      this.searchInput = '';
    },
    basicSearch() {
      this.advancedSearch = false;
      this.resetAdvancedSearch = true;
      this.resetSearch();
    },
    mergeFilters(newFilters, aggsName) {
      const filters = toRaw(this.filters);
      if (isEmpty(this.filters)) {
        this.filters = newFilters;
      } else {
        this.filters[aggsName] = newFilters[aggsName] || [];
        if (isEmpty(this.filters[aggsName])) {
          delete this.filters[aggsName];
        }
      }
      console.log('is this.filters empty?');
      console.log(isEmpty(this.filters));
      // this.filters = filters;
    },
    showMap() {
      this.$router.push({ path: '/map' });
    },
  },
};
</script>
<style>
html {
  scroll-behavior: smooth;
}
</style>
