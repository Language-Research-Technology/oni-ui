<script setup lang="ts">
import Fuse from 'fuse.js';
import { computed, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';

const { t } = useI18n();
const filter = ref<string | undefined>(undefined);

const { facetName, buckets, initialSelectedFacetValues } = defineProps<{
  facetName: string;
  buckets: Array<{ name: string; count: number }>;
  initialSelectedFacetValues: string[] | undefined;
}>();

const selectedFacetValues = ref<string[]>(initialSelectedFacetValues || []);

const emit = defineEmits(['isActive', 'updated']);

watch(
  () => initialSelectedFacetValues,
  (newValue) => {
    selectedFacetValues.value = newValue || [];
  },
);

const fuse = computed(
  () =>
    new Fuse(buckets, {
      keys: ['name'],
      threshold: 0.4,
      includeScore: true,
    }),
);

const filteredValues = computed(() => {
  let results = buckets;

  // Apply fuzzy search if filter is provided
  if (filter.value && filter.value.trim() !== '') {
    results = fuse.value.search(filter.value).map((result) => result.item);
  }

  // Sort: selected items first, then unselected
  const selected = results.filter((v) => selectedFacetValues.value.includes(v.name));
  const unselected = results.filter((v) => !selectedFacetValues.value.includes(v.name));

  return [...selected, ...unselected];
});

const updateFacet = () => {
  emit('updated', facetName, selectedFacetValues);

  if (selectedFacetValues.value.length > 0) {
    emit('isActive');
  }
};
</script>

<template>
  <div class="border-t-2">
    <el-input class="pt-1" v-model="filter" :placeholder="t('facets.filterPlaceholder')" clearable />

    <div class="overflow-y-auto" style="max-height: 200px;">
      <li class="m-2 mt-4 cursor-pointer" v-for="facetValue in filteredValues">
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
  </div>
</template>
