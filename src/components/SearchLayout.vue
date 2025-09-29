<script setup lang="ts">
import { CloseBold } from '@element-plus/icons-vue';
import { useRoute, useRouter } from 'vue-router';
import Facet from '@/components/Facet.vue';
import SearchAdvanced from '@/components/SearchAdvanced.vue';
import SearchBar from '@/components/SearchBar.vue';
import type { AdvancedSearchLine, FacetType, SetSearchParamsOptions } from '@/composables/search';
import { ordering } from '@/composables/search';
import type { EntityType } from '@/services/api';

const router = useRouter();
const route = useRoute();

const {
  searchInput,
  advancedSearchLines,
  filters,
  advancedSearchEnabled,
  sorting,
  entities,
  totals,
  searchTime,
  isMap,
  selectedSorting,
  selectedOrder,
  pageSize,
  currentPage,
  isLoading,
  errorDialogText,
  facets,

  updateRoutes,
  onInputChange,
  updateFilter,
  filtersChanged,
  clearFilter,
  resetSearch,
  sortResults,
  orderResults,
  updatePages,
  setSearchParams,
} = defineProps<{
  isLoading: boolean;
  advancedSearchLines: AdvancedSearchLine[];
  errorDialogText: string | undefined;
  searchInput: string;
  totals: number;
  searchTime: number;
  isMap: boolean;
  facets: FacetType[] | undefined;
  entities: EntityType[];
  filters: Record<string, string[]>;
  filtersChanged: boolean;
  advancedSearchEnabled: boolean;
  sorting: { value: string; label: string }[];
  selectedSorting: { value: string; label: string };
  selectedOrder: { value: string; label: string };
  pageSize: number;
  currentPage: number;
  updateRoutes: () => void;
  onInputChange: (value: string) => void;
  updateFilter: (name: string, selectedValues: string[]) => void;
  clearFilter: (f: string, filterKey: string) => void;
  clearFilters: () => void;
  sortResults: (by: string) => void;
  orderResults: (by: string) => void;
  updatePages: (page: number) => void;
  resetSearch: () => void;
  setSearchParams: (options: SetSearchParamsOptions) => void;
}>();

const clean = (value: string) => {
  if (value === 'true') {
    return 'Yes';
  }
  if (value === 'false') {
    return 'No';
  }
  return value.replace(/@|_|(\..*)/g, '');
};
</script>

<template>
  <el-row :gutter="0" :offset="0" style="" class="pb-4 pt-0">
    <el-col :xs="24" :sm="9" :md="9" :lg="7" :xl="7" :offset="0"
      class="h-full max-h-screen overflow-y-auto flex flex-col p-2" data-scroll-to-top>
      <div v-show="!advancedSearchEnabled"
        class="flex-1 w-full min-w-full bg-white rounded-sm mt-4 mb-4 shadow-md border">
        <SearchBar ref='searchBar' :searchInput="searchInput" class="grow justify-items-center items-center m-4"
          @set-search-params="setSearchParams" @update-search-input="onInputChange" @do-search="updateRoutes"
          searchPath="search" />
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
          <ul v-if="facet.buckets.length > 0"
            class="flex-1 w-full min-w-full bg-white rounded-sm p-2 mb-4 shadow-md border">
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
                  <span class="text-xs rounded-full w-32 h-32 text-white bg-purple-500 p-1">
                    {{ facet.buckets.length }}
                  </span>
                  &nbsp;
                  <font-awesome-icon icon="fa fa-chevron-right" />
                </span>
              </span>
            </li>
            <li v-if="facet.buckets.length <= 0" class="w-full min-w-full">&nbsp;</li>
            <Facet :buckets="facet.buckets" :facetName="facet.name" :ref="facet.name" v-show="facet.active"
              :initialSelectedFacetValues="filters[facet.name]" @is-active="facet.active = true"
              @updated="updateFilter" />
          </ul>
        </div>
      </div>
    </el-col>

    <el-col :xs="24" :sm="15" :md="15" :lg="17" :xl="17" :offset="0" class="p-2 px-3" data-scroll-to-top>

      <div v-if="errorDialogText" width="100%" center class="mt-4 mb-4">
        <el-alert title="Message" type="warning" :closable="false">
          <p class="break-normal">{{ errorDialogText }}</p>
        </el-alert>
      </div>

      <div class="pr-0">
        <div v-show="advancedSearchEnabled" data-scroll-to-top
          class="flex-1 w-full min-w-full bg-white rounded-sm mt-4 mb-4 shadow-md border">
          <SearchAdvanced :advancedSearch="advancedSearchEnabled" :advancedSearchLines="advancedSearchLines"
            :setSearchParams="setSearchParams" />
        </div>
        <div class="top-20 z-10 bg-white pb-3">
          <el-row :align="'middle'" class="mt-4 pb-2 border-0 border-b-[2px] border-solid border-red-700 text-2xl">
            <el-col :xs="24" :sm="24" :md="18" :lg="18" :xl="16">
              <el-button-group class="mr-1" v-show="filtersChanged">
                <el-button type="warning" @click="updateRoutes()">
                  Apply Filters
                </el-button>
              </el-button-group>

              <span class="my-1 mr-1" v-show="!filtersChanged" v-if="Object.keys(filters || {}).length > 0">
                Filtering by:
              </span>

              <el-button-group v-show="!filtersChanged" class="my-1 mr-2" v-for="(filter, filterKey) of filters"
                :key="filterKey">
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

              <span id="total_results" class="my-1 mr-2" v-show="totals !== undefined">
                Total: <span>{{ totals }} ({{ searchTime }} ms) Index entries (Collections, Objects and Files</span>
              </span>
            </el-col>

            <el-col :xs="24" :sm="24" :md="6" :lg="6" :xl="6">
              <el-button size="large" @click="router.push({ path: isMap ? '/search' : '/map', query: route.query })">
                <span>
                  <font-awesome-icon :icon="`fa-solid fa-${isMap ? 'map-location' : 'list'}`" />
                  &nbsp;
                  {{ isMap ? 'List' : 'Map' }} View
                  <el-tooltip
                    :content="`View the results as a ${isMap ? 'list' : 'map'}. Note that current search and filter options will be reset.`"
                    placement="bottom-end" effect="light">
                    <font-awesome-icon icon="fa fa-circle-question" />
                  </el-tooltip>
                </span>
              </el-button>
            </el-col>
            <el-col v-if="isMap">
              <p class="text-sm">
                <font-awesome-icon icon="fa fa-triangle-exclamation" />
                Filter and Search results will only show results on the current map view, move or resize the map
                to view other results.
              </p>
            </el-col>
          </el-row>
        </div>

        <el-row :span="24" class="pt-2 flex gap-4 pb-2" v-if="!isMap">
          <el-button-group class="my-1">
            <el-button type="default" v-on:click="resetSearch">RESET SEARCH</el-button>
          </el-button-group>
          <template v-if="!isMap">
            <el-select :model-value="selectedSorting" @change="sortResults" class="my-1 !w-sm">
              <template #prefix>Sort by:</template>
              <el-option v-for="item in sorting" :key="item.value" :label="item.label" :value="item.value" />
            </el-select>
            <el-select :model-value="selectedOrder" @change="orderResults" class="my-1 !w-sm">
              <template #prefix>Order by:</template>
              <el-option v-for="item in ordering" :key="item.value" :label="item.label" :value="item.value" />
            </el-select>
          </template>
        </el-row>

        <div class="py-0 w-full pb-2" v-if="!isMap">
          <el-pagination class="items-center w-full" background layout="prev, pager, next" :total="totals"
            :page-size="pageSize" :currentPage="currentPage" @current-change="updatePages($event)" />
        </div>

        <slot />

        <div v-loading="isLoading" v-if="!entities.length">
          <el-row class="pb-4 items-center">
            <h5 class="mb-2 text-2xl tracking-tight">
              <span v-if="!isLoading">No items found</span>
            </h5>
          </el-row>
          <el-row>
            <p class="text-center">
              <el-button type="primary" v-on:click="resetSearch">RESET SEARCH</el-button>
            </p>
          </el-row>
        </div>

        <div class="py-2 w-full" v-if="!isMap">
          <el-pagination class="items-center w-full" background layout="prev, pager, next" :total="totals"
            :page-size="pageSize" :currentPage="currentPage" @current-change="updatePages($event)" />
        </div>
      </div>
    </el-col>
  </el-row>

  <el-row v-show="filtersChanged" class="bg-white rounded-sm m-4 p-4 px-8 shadow-md border" role="alert"
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
