<script setup lang="ts">
import { useSearch } from '@/composables/search';

import EntitySummary from '@/components/EntitySummary.vue';
import SearchLayout from '@/components/SearchLayout.vue';

const {
  advancedSearchEnabled,
  searchInput,
  facets,
  filters,
  entities,
  isLoading,
  totals,
  searchTime,
  isMap,
  selectedSorting,
  selectedOrder,
  pageSize,
  currentPage,
  errorDialogText,

  onInputChange,
  updateRoutes,
  updateFilter,
  filtersChanged,
  clearFilters,
  clearFilter,
  resetSearch,
  sortResults,
  orderResults,
  updatePages,
  clearError,
  setSearchParams,
} = useSearch('list');

console.log('🪚 setSearchParams: VIEW', JSON.stringify(setSearchParams, null, 2));
console.log('🪚 updateRoutes:', JSON.stringify(updateRoutes, null, 2));
</script>

<template>
  <SearchLayout :searchInput="searchInput" :filters="filters" :facets="facets" :entities="entities"
    :clearFilter="clearFilter" :onInputChange="onInputChange" :clearError="clearError" :filtersChanged="filtersChanged"
    :updateRoutes="updateRoutes" :clearFilters=clearFilters :updateFilter="updateFilter" :totals="totals"
    :resetSearch="resetSearch" :isMap="isMap" :isLoading="isLoading" :searchTime="searchTime" :sortResults="sortResults"
    :selectedOrder="selectedOrder" :selectedSorting="selectedSorting" :orderResults="orderResults" :pageSize="pageSize"
    :errorDialogText="errorDialogText" :currentPage="currentPage" :updatePages="updatePages"
    :setSearchParams="setSearchParams" :advancedSearchEnabled="advancedSearchEnabled">
    <div v-for="entity of entities" :key="entity.id" class="z-0 mt-0 mb-4 w-full" v-loading="isLoading">
      <EntitySummary :entity="entity" />
    </div>
  </SearchLayout>
</template>
