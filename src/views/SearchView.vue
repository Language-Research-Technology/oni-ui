<script setup lang="ts">
import EntitySummary from '@/components/EntitySummary.vue';
import SearchLayout from '@/components/SearchLayout.vue';
import { useSearch } from '@/composables/search';

const {
  advancedSearchEnabled,
  searchInput,
  advancedSearchLines,
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
  setSearchParams,
} = useSearch('list');
</script>

<template>
  <SearchLayout :searchInput="searchInput" :filters="filters" :facets="facets" :entities="entities"
    :clearFilter="clearFilter" :onInputChange="onInputChange" :filtersChanged="filtersChanged"
    :updateRoutes="updateRoutes" :clearFilters=clearFilters :updateFilter="updateFilter" :totals="totals"
    :resetSearch="resetSearch" :isMap="isMap" :isLoading="isLoading" :searchTime="searchTime" :sortResults="sortResults"
    :selectedOrder="selectedOrder" :selectedSorting="selectedSorting" :orderResults="orderResults" :pageSize="pageSize"
    :errorDialogText="errorDialogText" :currentPage="currentPage" :updatePages="updatePages"
    :setSearchParams="setSearchParams" :advancedSearchEnabled="advancedSearchEnabled"
    :advancedSearchLines="advancedSearchLines">
    <div v-for="entity of entities" :key="entity.id" class="z-0 mt-0 mb-4 w-full" v-loading="isLoading">
      <EntitySummary :entity="entity" />
    </div>
  </SearchLayout>
</template>
