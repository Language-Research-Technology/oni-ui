<script setup lang="ts">
import { computed, ref } from 'vue';

const pageStartIndex = ref(0);
const filter = ref<string | undefined>(undefined);
const currentPage = ref(1);

const pageSize = 5;

const { facetName, buckets, initialSelectedFacetValues } = defineProps<{
  facetName: string;
  buckets: Array<{ name: string; count: number }>;
  initialSelectedFacetValues: string[] | undefined;
}>();

const selectedFacetValues = ref<string[]>(initialSelectedFacetValues || []);

const emit = defineEmits(['isActive', 'updated']);

const updatePages = (page: number) => {
  pageStartIndex.value = (page - 1) * pageSize;
};

const filteredValues = computed(() => buckets.filter((v) => v.name.match(new RegExp(filter.value as string, 'i'))));

const updateFacet = () => {
  emit('updated', facetName, selectedFacetValues);

  if (selectedFacetValues.value.length > 0) {
    emit('isActive');
  }
};
</script>

<template>
  <div class="border-t-2">
    <el-pagination class="items-center" v-model:currentPage="currentPage" v-model:page-size="pageSize"
      layout="prev, pager, next" :total="filteredValues.length || 0" @current-change="updatePages"
      :hide-on-single-page="true" />

    <el-input class="pt-1" v-model="filter" placeholder="Filter" clearable @input="updatePages(1)" />

    <li class="m-2 mt-4 cursor-pointer"
      v-for="facetValue in filteredValues?.slice(pageStartIndex, pageStartIndex + pageSize)">
      <div class="form-check form-check-inline cursor-pointer">
        <input
          class="cursor-pointer form-check-input h-4 w-4 border border-gray-300 rounded-xs bg-white checked:bg-blue-600 checked:border-blue-600 focus:outline-hidden transition duration-200 mt-1 align-top bg-no-repeat bg-center bg-contain float-left mr-2"
          :id="facetName + '_' + facetValue.name" :name="facetName + '_' + facetValue.name" type="checkbox"
          :value="facetValue.name" v-model="selectedFacetValues" v-on:change="updateFacet">
        <label class="cursor-pointer form-check-label text-gray-800" :for="facetName + '_' + facetValue.name">
          {{ facetValue.name }}
          <span class="text-xs rounded-full w-32 h-32 text-white bg-purple-500 p-1">{{ facetValue.count }}</span>
        </label>
      </div>
    </li>
  </div>
</template>
