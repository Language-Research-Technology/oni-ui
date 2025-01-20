<script setup lang="ts">
import { useGtm } from '@gtm-support/vue-gtm';
import { inject, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';

import { useConfigurationStore } from '@/stores/configuration';
import type { ElasticService } from '@/services/elastic';

import { CloseBold } from '@element-plus/icons-vue';

import SearchBar from '@/components/SearchBar.vue';
import SearchAggs from '@/components/SearchAggs.vue';
import SearchAdvanced from '@/components/SearchAdvanced.vue';
import SearchDetailElement, { type ItemType } from '@/components/SearchDetailElement.vue';

type Aggregation = {
  buckets: Array<{ key: string; doc_count: number }>;
  display: string;
  order: number;
  name: string;
  active?: boolean;
  help: string;
  hide?: boolean;
};

const router = useRouter();
const route = useRoute();
const gtm = useGtm();

const es = inject<ElasticService>('es');
if (!es) {
  throw new Error('ES instance not provided');
}

const { ui } = useConfigurationStore();
const { searchFields } = ui;

const searchInput = ref(route.query.q || '');
const advancedSearchEnabled = ref(false);
const aggregations = ref<Aggregation[]>();
const isStart = ref(false);
const isLoading = ref(false);
const selectedSorting = ref();
const filtersChanged = ref(false);
const errorDialogText = ref<string | undefined>();
const items = ref<ItemType[]>([]);
const filters = ref<Record<string, string[]>>({});
const selectedOperation = ref(route.query.o || 'must');
const pageSize = ref(10);
const currentPage = ref(1);
const advancedQueries = ref<{ queryString: string; searchGroup: string }>();
const selectedOrder = ref(ui.search?.defaultOrder || { value: 'asc', label: 'Ascending' });
const totals = ref(0);
const resetAdvancedSearch = ref(false);

const more = ref(false);
const clear = ref(false);
const filterButton = ref([]);
const isBrowse = ref(false);

const defaultOrder = ui.search?.defaultOrder || { value: 'asc', label: 'Ascending' };
const ordering = ui.search?.ordering || [
  { value: 'asc', label: 'Ascending' },
  { value: 'desc', label: 'Descending' },
];

const startSorting = ui.search?.startSorting || {
  value: '_isTopLevel.@value.keyword',
  label: 'Collections',
};

const searchSorting = ui.search?.searchSorting || {
  value: 'relevance',
  label: 'Relevance',
};

const defaultSorting = ui.search?.defaultSorting || {
  value: 'relevance',
  label: 'Relevance',
};
const sorting = ui.search?.sorting || [{ value: 'relevance', label: 'Relevance' }];

watch(
  () => route.query,
  async () => {
    isLoading.value = true;

    if (route.query.s) {
      isStart.value = true;
      resetSearch();
    } else {
      await updateFilters();
      onInputChange(route.query.q?.toString() || '');
      currentPage.value = 1;
      if (route.query.a) {
        updateAdvancedQueries();
      }
      await search();
    }
    isLoading.value = false;
  },
);

const clearFilter = async (f: string, filterKey: string) => {
  if (filters.value[filterKey]) {
    filters.value[filterKey].splice(filters.value[filterKey].indexOf(f), 1);
    if (filters.value[filterKey].length === 0) {
      delete filters.value[filterKey];
    }

    //if there is an update on the filter the site will do another search.
    await updateRoutes({ updateFilters: true });
  }
};

const updateFilters = async () => {
  filters.value = {};

  if (!route.query.f) {
    return;
  }

  const filterQuery = JSON.parse(decodeURIComponent(route.query.f.toString())) as Record<string, string[]>;
  for (const [key, val] of Object.entries(filterQuery)) {
    filters.value[key] = val;
    if (filters.value[key].length === 0) {
      delete filters.value[key];
    }
  }
};

const updateAdvancedQueries = () => {
  advancedSearchEnabled.value = true;
  const searchGroup = JSON.parse(decodeURIComponent(route.query.a?.toString() || ''));
  const queryString = es.queryString(searchGroup);
  advancedQueries.value = { queryString, searchGroup };
};

const search = async () => {
  if (isStart.value) {
    //Revert start to sorting by the startSorting
    selectedSorting.value = startSorting;
    isStart.value = false;
  } else if (searchInput.value) {
    // If there is a query sort by relevance
    selectedSorting.value = searchSorting;
  } else if (advancedSearchEnabled.value) {
    // If advanced search is enabled sort by relevance
    selectedSorting.value = searchSorting;
  } else if (!selectedSorting.value) {
    // If there is one selected sorting do that
    selectedSorting.value = defaultSorting;
  }
  filtersChanged.value = false;

  isLoading.value = true;
  try {
    const results = await es.multi<ItemType>({
      multi: searchInput.value.toString(),
      filters: filters.value,
      searchFields,
      sort: selectedSorting.value.value,
      order: selectedOrder.value.value,
      sortField: selectedSorting.value?.field, //This is not mandatory but if field exists in sorting it will sort by this field
      operation: selectedOperation.value.toString(),
      pageSize: pageSize.value,
      searchFrom: (currentPage.value - 1) * pageSize.value,
      queries: advancedQueries.value,
    });

    items.value = [];

    if (results.hits) {
      totals.value = results.total;

      for (const hit of results.hits) {
        items.value.push(hit);
      }

      more.value = true;
    } else {
      more.value = false;
    }

    if (results.aggregations) {
      aggregations.value = populateAggregations(results.aggregations);
    }

    isLoading.value = false;

    gtm?.trackEvent({
      event: '/search',
      category: 'search',
      label: 'search',
    });
  } catch (e) {
    const err = e as Error;
    errorDialogText.value = err.message;
    isLoading.value = false;
  }
};

const populateAggregations = (aggregations: Record<string, { buckets: { key: string; doc_count: number }[] }>) => {
  const a: Aggregation[] = [];
  // NOTE: below is converted to an ordered array not an object.
  const aggInfo = ui.aggregations;

  for (const agg of Object.keys(aggregations)) {
    const info = aggInfo.find((a) => a.name === agg);
    const display = info?.display;
    const order = info?.order;
    const name = info?.name;
    const hide = info?.hide;
    const active = info?.active;
    const help = info?.help;
    a.push({
      buckets: aggregations[agg]?.buckets,
      display: display || agg,
      order: order || 0,
      name: name || agg,
      hide: hide,
      active: active,
      help: help || '',
    });
  }

  return a.sort((a, b) => a.order - b.order);
};

const updateRoutes = async ({
  queries,
  updateFilters = false,
}: { queries?: { queryString: string; searchGroup: string }; updateFilters?: boolean } = {}) => {
  const query: { q?: string; f?: string; a?: string; r?: string } = {};

  let localFilterUpdate = false;

  if (!isEmpty(filters.value) || updateFilters) {
    query.f = encodeURIComponent(JSON.stringify(filters.value));
    localFilterUpdate = true;
  } else {
    query.f = undefined;
  }

  if (route.query.f && !localFilterUpdate) {
    query.f = route.query.f.toString();
  }

  let localSearchGroupUpdate = false;
  if (queries?.searchGroup) {
    advancedQueries.value = queries;

    query.q = undefined;
    query.a = queries.searchGroup;
    currentPage.value = 1;
    localSearchGroupUpdate = true;
  }
  if (route.query.a) {
    query.a = route.query.a.toString();
    query.q = undefined;
    updateAdvancedQueries();
  } else {
    advancedQueries.value = undefined; //clear advanced search
    query.q = searchInput.value ? searchInput.value?.toString() : undefined;
  }

  await router.push({ path: 'search', query, replace: true });
};

const onInputChange = (value: string) => {
  searchInput.value = value;
};

const resetSearch = async () => {
  scrollToTop();
  clear.value = !clear.value;
  searchInput.value = '';
  route.query.q = '';
  route.query.f = '';
  route.query.t = '';
  if (resetAdvancedSearch.value) {
    advancedSearchEnabled.value = false;
  } else {
    advancedSearchEnabled.value = !!route.query.a;
  }
  advancedQueries.value = undefined;
  resetAdvancedSearch.value = true;
  route.query.sf = encodeURIComponent(searchFields.value.toString());
  route.query.o = selectedOperation.value;
  selectedOrder.value = defaultOrder;
  filterButton.value = [];
  isStart.value = true;
  isBrowse.value = false;
  currentPage.value = 1;
  filters.value = {};
  await clearAggregations();
  const query = {};
  await router.push({ path: 'search', query });
};

const scrollToTop = () => {
  setTimeout(() => {
    window.scrollTo(0, 0);
    const ids = ['search_results', 'search_aggregation', 'advanced_search_box'];

    for (const id of ids) {
      const el = document.getElementById(id);
      if (el && el.scrollTop > 0) {
        el.scrollTo({ top: 0 });
      }
    }
  }, 100);
};

const clearAggregations = async () => {
  // if (aggregations.value) {
  // for (const agg of aggregations.value) {
  //TODO: ask cos this may be silly?!?
  //this.$refs[agg][0].clear();
  // const name = agg?.name;
  // TODO: JF Put this back
  // if (this.$refs[name]) {
  //   for (const r of this.$refs[name]) {
  //     r.clear();
  //   }
  // }
  // }
  // }
  filters.value = {};
};

const clean = (value: string) => {
  if (value === 'true') {
    return 'Yes';
  }
  if (value === 'false') {
    return 'No';
  }
  return value.replace(/@|_|(\..*)/g, '');
};

const sortResults = (sort: string) => {
  currentPage.value = 1;
  selectedSorting.value = sorting.find(({ value }) => value === sort);
  search();
};

const orderResults = (order: string) => {
  currentPage.value = 1;
  selectedOrder.value = ordering.find(({ value }) => value === order) || defaultOrder;
  search();
};

const updatePages = async (page: number) => {
  currentPage.value = page;
  await search();
  scrollToTop();
};

const clearFilters = async () => {
  filters.value = {};
  await updateRoutes({ updateFilters: true });
};

const isEmpty = (obj: Record<string, unknown>) => Object.keys(obj).length === 0;

const mergeFilters = (newFilters: Record<string, string[]>, aggsName: string) => {
  if (isEmpty(filters.value)) {
    filters.value = newFilters;
  } else {
    filters.value[aggsName] = newFilters[aggsName] || [];
    if (filters.value[aggsName].length === 0) {
      delete filters.value[aggsName];
    }
  }
};

const newAggs = ({ query, aggsName }: { query: Record<string, string>; aggsName: string }) => {
  if (query.f) {
    //In here we need to merge the filters
    const decodedFilters = JSON.parse(decodeURIComponent(query.f));
    mergeFilters(decodedFilters, aggsName);
  }

  if (query.q) {
    searchInput.value = decodeURIComponent(query.q);
  }

  filtersChanged.value = true;
};

const enableAdvancedSearch = () => {
  advancedSearchEnabled.value = true;
  searchInput.value = '';
  scrollToTop();
};

const basicSearch = () => {
  advancedSearchEnabled.value = false;
  resetAdvancedSearch.value = true;
  resetSearch();
};
const showMap = () => {
  router.push({ path: '/map' });
};

const doWork = async () => {
  isStart.value = true;
  await updateFilters();

  if (route.query.q) {
    searchInput.value = route.query.q.toString();
  }

  if (route.query.a) {
    updateAdvancedQueries();
  } else {
    advancedSearchEnabled.value = false;
    // TODO: JF do we need this?
    // removeLocalStorage({ key: 'advancedQueries' });
  }

  search();
};

doWork();

//   async mounted() {
//     console.log('mounted');
//     await this.updateFilters({});
//     if (this.$route.query.o) {
//       this.selectedOperation = this.$route.query.o;
//     }
//     if (this.$route.query.a) {
//       this.updateAdvancedQueries();
//     } else {
//       this.advancedSearchEnabled = false;
//     }
//   },
//   async updated() {
//     console.log('updated');
//     if (this.$route.query.q) {
//       this.advancedSearchEnabled = false;
//     }
//     // await this.updateFilters({});
//   },
</script>

<template>
  <el-row :gutter="0" :offset="0" style="" class="pb-4 pt-0">
    <el-col :xs="24" :sm="9" :md="9" :lg="7" :xl="7" :offset="0"
      class="h-full max-h-screen overflow-y-auto flex flex-col p-2" id="search_aggregation">
      <div v-show="!advancedSearchEnabled" class="flex-1 w-full min-w-full bg-white rounded mt-4 mb-4 shadow-md border">
        <SearchBar ref='searchBar' :searchInput="searchInput.toString()"
          class="grow justify-items-center items-center m-4" @enable-advanced="enableAdvancedSearch"
          @update-search-input="onInputChange" @do-search="updateRoutes" :searchPath="'search'" />
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
          <ul v-if="aggs.buckets?.length > 0 && !aggs['hide']"
            class="flex-1 w-full min-w-full bg-white rounded p-2 mb-4 shadow-md border">
            <li @click="aggs.active = !aggs.active"
              class="hover:cursor-pointer py-3 flex md:flex md:grow flex-row justify-between space-x-1">
              <span class="text-xl text-gray-600 dark:text-gray-300 font-semibold py-1 px-2">
                {{ aggs.display }}
                <el-tooltip v-if="aggs.help" class="box-item" effect="light" trigger="hover" :content="aggs.help"
                  placement="top">
                  <el-button link>
                    <font-awesome-icon icon="fa-solid fa-circle-info" />
                  </el-button>
                </el-tooltip>
              </span>
              <span class="py-1 px-2">
                <font-awesome-icon v-if="aggs.active" icon="fa fa-chevron-down" />
                <span v-else>
                  <span class="text-xs rounded-full w-32 h-32 text-white bg-purple-500 p-1">{{
                    aggs?.buckets?.length
                  }}</span>&nbsp;
                  <font-awesome-icon icon="fa fa-chevron-right" />
                </span>
              </span>
            </li>
            <li v-if="aggs?.buckets?.length <= 0" class="w-full min-w-full">&nbsp;</li>
            <SearchAggs :buckets="aggs.buckets" :aggsName="aggs.name" :ref="aggs.name" v-show="aggs.active"
              @is-active="aggs.active = true" @changed-aggs="newAggs" />
          </ul>
        </div>
      </div>
    </el-col>

    <el-col :xs="24" :sm="15" :md="15" :lg="17" :xl="17" :offset="0"
      class="max-h-screen overflow-y-auto flex flex-row h-screen p-2 px-3" id="search_results">

      <div class="pr-0">

        <div v-show="advancedSearchEnabled" id="advanced_search_box"
          class="flex-1 w-full min-w-full bg-white rounded mt-4 mb-4 shadow-md border">
          <SearchAdvanced :advancedSearch="advancedSearchEnabled" :fields="searchFields" @basic-search="basicSearch"
            @do-advanced-search="updateRoutes" :resetAdvancedSearch="resetAdvancedSearch" />
        </div>
        <div class="top-20 z-10 bg-white pb-3">
          <el-row :align="'middle'" class="mt-4 pb-2 border-0 border-b-[2px] border-solid border-red-700 text-2xl">
            <el-col :xs="24" :sm="24" :md="18" :lg="18" :xl="16">
              <el-button-group class="mr-1" v-show="filtersChanged">
                <el-button type="warning" @click="updateRoutes({ updateFilters: true })">Apply
                  Filters
                </el-button>
              </el-button-group>

              <span class="my-1 mr-1" v-show="!filtersChanged" v-if="!isEmpty(filters)">Filtering by:</span>

              <el-button-group v-show="!filtersChanged" class="my-1 mr-2" v-for="(filter, filterKey) of filters"
                :key="filterKey" v-model="filters">
                <el-button plain>{{ clean(filterKey) }}</el-button>
                <el-button v-if="filter && filter.length > 0" v-for="f of filter" :key="f" color="#626aef" plain
                  @click="clearFilter(f, filterKey)" class="text-2xl">
                  {{ clean(f) }}
                  <el-icon class="el-icon--right">
                    <CloseBold />
                  </el-icon>
                </el-button>
              </el-button-group>

              <el-button-group v-show="!isEmpty(filters)" class="mr-1">
                <el-button @click="clearFilters()">Clear Filters</el-button>
              </el-button-group>

              <span id="total_results" class="my-1 mr-2" v-show="totals">
                Total: <span>{{ totals }} Index entries (Collections, Objects, Files and Notebooks)</span>
              </span>
            </el-col>
            <el-col :xs="24" :sm="24" :md="6" :lg="6" :xl="6">
              <el-button size="large" @click="showMap()">
                <span>
                  <font-awesome-icon icon="fa-solid fa-map-location" />&nbsp;Map View
                  <el-tooltip
                    content="View the results as a map. Note that current search and filter options will be reset."
                    placement="bottom-end" effect="light">
                    <font-awesome-icon icon="fa fa-circle-question" />
                  </el-tooltip>
                </span>
              </el-button>
            </el-col>
          </el-row>
        </div>

        <el-row class="pt-2">
          <el-col :span="24" class="flex space-x-4 pb-2">
            <el-button-group class="my-1">
              <el-button type="default" v-on:click="resetSearch">RESET SEARCH</el-button>
            </el-button-group>
            <el-select v-model="selectedSorting" @change="sortResults" class="my-1">
              <template #prefix>Sort by:</template>
              <el-option v-for="item in sorting" :key="item.value" :label="item.label" :value="item.value" />
            </el-select>
            <el-select v-model="selectedOrder" @change="orderResults" class="my-1">
              <template #prefix>Order by:</template>
              <el-option v-for="item in ordering" :key="item.value" :label="item.label" :value="item.value" />
            </el-select>
          </el-col>
        </el-row>

        <div class="py-0 w-full pb-2">
          <el-pagination class="items-center w-full" background layout="prev, pager, next" :total="totals"
            v-model:page-size="pageSize" @update:page-size="pageSize" v-model:currentPage="currentPage"
            @current-change="updatePages($event)" />
        </div>

        <div v-for="item of items" :key="item._id" class="z-0 mt-0 mb-4 w-full" v-loading="isLoading">
          <SearchDetailElement :item="item" />
        </div>

        <div v-loading="isLoading" v-if="!items.length">
          <el-row class="pb-4 items-center">
            <h5 class="mb-2 text-2xl tracking-tight dark:text-white">
              <span v-if="!isLoading">No items found</span>
            </h5>
          </el-row>
          <el-row>
            <p class="text-center">
              <el-button type="primary" v-on:click="resetSearch">RESTART SEARCH</el-button>
            </p>
          </el-row>
        </div>

        <div class="py-2 w-full">
          <el-pagination class="items-center w-full" background layout="prev, pager, next" :total="totals"
            v-model:page-size="pageSize" @update:page-size="pageSize" v-model:currentPage="currentPage"
            @current-change="updatePages($event)" />
        </div>
      </div>
    </el-col>
  </el-row>

  <el-dialog v-model="errorDialogText" width="40%" center>
    <el-alert title="Error" type="warning" :closable="false">
      <p class="break-normal">{{ errorDialogText }}</p>
    </el-alert>
    <template #footer>
      <span class="dialog-footer">
        <el-button type="primary" @click="errorDialogText = undefined">Close</el-button>
      </span>
    </template>
  </el-dialog>

  <el-row v-show="filtersChanged" class="bg-white rounded m-4 p-4 px-8 shadow-md border" role="alert"
    style="bottom: 16px; z-index: 2044; position: fixed">
    <el-row class="p-2">
      <div class="w-full">
        <el-button-group class="self-center">
          <el-button @click="clearFilters()">Clear Filters</el-button>
          <el-button type="warning" @click="updateRoutes({ updateFilters: true })">Apply Filters</el-button>
        </el-button-group>
      </div>
    </el-row>
  </el-row>
  <el-row></el-row>
</template>
