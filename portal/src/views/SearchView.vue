<script setup lang="ts">
import { useGtm } from '@gtm-support/vue-gtm';
import { inject, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';

import { useConfigurationStore } from '@/stores/configuration';

import { CloseBold } from '@element-plus/icons-vue';

import SearchBar from '@/components/SearchBar.vue';
import SearchAggs from '@/components/SearchAggs.vue';
import SearchAdvanced from '@/components/SearchAdvanced.vue';
import EntitySummary from '@/components/EntitySummary.vue';
import type { ApiService, EntityType, GetSearchResponse, SearchParams } from '@/services/api';

type Aggregation = {
  buckets: Array<{ name: string; count: number }>;
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

const api = inject<ApiService>('api');
if (!api) {
  throw new Error('API instance not provided');
}

const { ui } = useConfigurationStore();
const { searchFields } = ui;

const searchInput = ref(route.query.q || '');
const advancedSearchEnabled = ref(!!route.query.a);
const facets = ref<Aggregation[]>();
const isLoading = ref(false);
const filtersChanged = ref(false);
const errorDialogText = ref<string | undefined>();
const entities = ref<EntityType[]>([]);
const filters = ref<Record<string, string[]>>({});
const selectedOperation = ref(route.query.o || 'must');
const pageSize = ref(10);
const currentPage = ref(1);
const totals = ref(0);
const searchTime = ref(0);
const resetAdvancedSearch = ref(false);

const more = ref(false);
const clear = ref(false);
const filterButton = ref([]);
const isBrowse = ref(false);

const ordering = ui.search?.ordering || [
  { value: 'asc', label: 'Ascending' },
  { value: 'desc', label: 'Descending' },
];
const defaultOrder = ordering[0];
const selectedOrder = ref(defaultOrder);

const sorting = ui.search?.sorting || [{ value: 'relevance', label: 'Relevance' }];
const defaultSorting = ui.search?.searchSorting || sorting[0];
const selectedSorting = ref(defaultSorting);

watch(
  () => route.query,
  async () => {
    isLoading.value = true;

    if (route.query.s) {
      resetSearch();
    } else {
      await updateFilters();
      onInputChange(route.query.q?.toString() || '');
      currentPage.value = 1;
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

    await updateRoutes();
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

const search = async () => {
  filtersChanged.value = false;

  isLoading.value = true;

  try {
    const params: SearchParams = {
      query: route.query.a ? generateQueryString(route.query.a.toString()) : searchInput.value.toString(),
      searchType: route.query.a ? 'advanced' : 'basic',
      filters: filters.value,
      limit: pageSize.value,
      offset: (currentPage.value - 1) * pageSize.value,
      sort: selectedSorting.value?.value,
      order: selectedOrder.value?.value,
    };
    const results = await api.search(params);
    console.log('🪚 results:', JSON.stringify(results, null, 2));

    searchTime.value = results.searchTime;

    entities.value = [];

    if (results.entities) {
      totals.value = results.total;

      for (const entity of results.entities) {
        entities.value.push(entity);
      }

      more.value = true;
    } else {
      more.value = false;
    }

    if (results.facets) {
      facets.value = populateFacets(results.facets);
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

const generateQueryString = (rawSearchGroup: string) => {
  let qS = '';
  const searchGroup = JSON.parse(decodeURIComponent(rawSearchGroup));
  console.log('🪚 generate:', searchGroup, typeof searchGroup);
  searchGroup.forEach((sg, i) => {
    let lastOneSG = false;
    if (i + 1 === searchGroup.length) {
      lastOneSG = true;
    }
    if (sg.searchInput.length === 0) {
      sg.searchInput = '*';
    }
    if (sg.field === 'all_fields') {
      let qqq = '( ';
      Object.keys(searchFields).map((f, index, keys) => {
        let lastOne = false;
        if (index + 1 === keys.length) {
          lastOne = true;
        }
        let qq = '';
        qq = String.raw`${f} : ${sg.searchInput} ${!lastOne ? 'OR' : ''} `;
        qqq += qq;
      });
      qS += String.raw`${qqq} ) ${!lastOneSG ? sg.operation : ''} `;
    } else {
      qS += String.raw` ( ${sg.field}: ${sg.searchInput} ) ${!lastOneSG ? sg.operation : ''}`;
    }
  });
  return qS;
};

const populateFacets = (facets: GetSearchResponse['facets']) => {
  const a: Aggregation[] = [];
  // NOTE: below is converted to an ordered array not an object.
  const aggInfo = ui.aggregations;

  for (const facet of Object.keys(facets)) {
    const info = aggInfo.find((a) => a.name === facet);
    const display = info?.display;
    const order = info?.order;
    const name = info?.name;
    const hide = info?.hide;
    const active = info?.active;
    const help = info?.help;
    a.push({
      buckets: facets[facet],
      display: display || facet,
      order: order || 0,
      name: name || facet,
      hide: hide,
      active: active,
      help: help || '',
    });
  }

  return a.sort((a, b) => a.order - b.order);
};

const updateRoutes = async ({ searchGroup }: { searchGroup?: object[] } = {}) => {
  console.log('🪚 ⭕', filters.value);
  const query: { q?: string; f?: string; a?: string } = {};

  if (Object.keys(filters.value).length > 0) {
    query.f = encodeURIComponent(JSON.stringify(filters.value));
  } else {
    query.f = undefined;
  }

  if (searchGroup) {
    query.q = undefined;
    query.a = encodeURIComponent(JSON.stringify(searchGroup));
    currentPage.value = 1;
  } else {
    if (route.query.a) {
      query.a = route.query.a.toString();
      query.q = undefined;
    } else {
      query.q = searchInput.value ? searchInput.value.toString() : undefined;
    }
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
  resetAdvancedSearch.value = true;
  route.query.o = selectedOperation.value;
  selectedOrder.value = defaultOrder;
  filterButton.value = [];
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
  selectedSorting.value = sorting.find(({ value }) => value === sort) || defaultSorting;
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
  await updateRoutes();
};

const mergeFilters = (newFilters: Record<string, string[]>, aggsName: string) => {
  if (Object.keys(filters.value).length > 0) {
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
  await updateFilters();

  if (route.query.q) {
    searchInput.value = route.query.q.toString();
  }

  search();
};

doWork();
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
            <p class="text-xl text-gray-600 font-semibold py-1 px-2">
              Filters
            </p>
          </div>
        </div>
      </div>

      <div class="pt-2">
        <div class="flex w-full" v-for="facet of facets" :key="facet.name">
          <ul v-if="facet.buckets.length > 0 && !facet.hide"
            class="flex-1 w-full min-w-full bg-white rounded p-2 mb-4 shadow-md border">
            <li @click="facet.active = !facet.active"
              class="hover:cursor-pointer py-3 flex md:flex md:grow flex-row justify-between space-x-1">
              <span class="text-xl text-gray-600 font-semibold py-1 px-2">
                {{ facet.display }}
                <el-tooltip v-if="facet.help" class="box-item" effect="light" trigger="hover" :content="facet.help"
                  placement="top">
                  <el-button link>
                    <font-awesome-icon icon="fa-solid fa-circle-info" />
                  </el-button>
                </el-tooltip>
              </span>
              <span class="py-1 px-2">
                <font-awesome-icon v-if="facet.active" icon="fa fa-chevron-down" />
                <span v-else>
                  <span class="text-xs rounded-full w-32 h-32 text-white bg-purple-500 p-1">{{
                    facet.buckets.length
                  }}</span>&nbsp;
                  <font-awesome-icon icon="fa fa-chevron-right" />
                </span>
              </span>
            </li>
            <li v-if="facet.buckets.length <= 0" class="w-full min-w-full">&nbsp;</li>
            <SearchAggs :buckets="facet.buckets" :aggsName="facet.name" :ref="facet.name" v-show="facet.active"
              @is-active="facet.active = true" @changed-aggs="newAggs" />
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
                <el-button type="warning" @click="updateRoutes()">Apply
                  Filters
                </el-button>
              </el-button-group>

              <span class="my-1 mr-1" v-show="!filtersChanged" v-if="Object.keys(filters || {}).length > 0">Filtering
                by:</span>

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

              <el-button-group v-show="Object.keys(filters || {}).length > 0" class="mr-1">
                <el-button @click="clearFilters()">Clear Filters</el-button>
              </el-button-group>

              <span id="total_results" class="my-1 mr-2" v-show="totals">
                Total: <span>{{ totals }} ({{ searchTime }} ms) Index entries (Collections, Objects, Files and
                  Notebooks)</span>
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

        <div v-for="entity of entities" :key="entity.id" class="z-0 mt-0 mb-4 w-full" v-loading="isLoading">
          <!-- <SearchDetailElement :item="item" /> -->
          <EntitySummary :entity="entity" />
        </div>

        <div v-loading="isLoading" v-if="!entities.length">
          <el-row class="pb-4 items-center">
            <h5 class="mb-2 text-2xl tracking-tight">
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
          <el-button type="warning" @click="updateRoutes()">Apply Filters</el-button>
        </el-button-group>
      </div>
    </el-row>
  </el-row>
  <el-row></el-row>
</template>
