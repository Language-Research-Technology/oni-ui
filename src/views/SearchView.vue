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
  enableAdvancedSearch,
  updatedFacet,
  basicSearch,
  resetAdvancedSearch,
  filtersChanged,
  clearFilters,
  clearFilter,
  resetSearch,
  sortResults,
  orderResults,
  updatePages,
  clearError,
} = useSearch('list');
</script>

<template>
  <SearchLayout :searchInput="searchInput.toString()" :filters="filters" :facets="facets" :entities="entities"
    :clearFilter="clearFilter" :onInputChange="onInputChange" :enableAdvancedSearch="enableAdvancedSearch"
    :clearError="clearError" :filtersChanged="filtersChanged" :advancedSearchEnabled="advancedSearchEnabled"
    :updateRoutes="updateRoutes" :resetAdvancedSearch="resetAdvancedSearch" :clearFilters=clearFilters
    :updatedFacet="updatedFacet" :basicSearch="basicSearch" :totals="totals" :resetSearch="resetSearch" :isMap="isMap"
    :isLoading="isLoading" :searchTime="searchTime" :sortResults="sortResults" :selectedOrder="selectedOrder"
    :selectedSorting="selectedSorting" :orderResults="orderResults" :pageSize="pageSize"
    :errorDialogText="errorDialogText" :currentPage="currentPage" :updatePages="updatePages">
    <div v-for="entity of entities" :key="entity.id" class="z-0 mt-0 mb-4 w-full" v-loading="isLoading">
      <EntitySummary :entity="entity" />
    </div>
  </SearchLayout>
</template>
