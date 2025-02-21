<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useRoute } from 'vue-router';

const route = useRoute();

const checkedBuckets = ref<string[]>([]);
const pageStartIndex = ref(0);
const filter = ref<string | undefined>(undefined);
const currentPage = ref(1);
const pageSize = ref(5);

const { aggsName, buckets } = defineProps<{ aggsName: string; buckets: Array<{ name: string; count: number }> }>();

const emit = defineEmits(['isActive', 'changedAggs']);

watch(
  () => route.query.f,
  () => updateFilters(),
);

watch(checkedBuckets, (newValue) => {
  if (newValue.length > 0) {
    emit('isActive');
  }
});

const updateFilters = () => {
  let queryFilters: Record<string, string[]> = {};
  if (route.query.f) {
    const filters = route.query.f;
    const decodedFilters = decodeURIComponent(filters.toString());
    try {
      queryFilters = JSON.parse(decodedFilters);
    } catch (e) {
      console.error('updatedFilters error:');
      console.error(e);
    }
  }

  const qfFound = Object.keys(queryFilters).find((qF) => qF === aggsName);
  if (!qfFound) {
    checkedBuckets.value = [];

    return;
  }

  for (const [key, val] of Object.entries(queryFilters)) {
    if (key === aggsName) {
      checkedBuckets.value = val;
    }
  }

  if (checkedBuckets.value.length > 0) {
    emit('isActive');
  }
};

const onChange = async () => {
  const query: { q?: string; f?: string } = {};
  if (route.query.q) {
    query.q = route.query.q.toString();
  }

  if (route.query.f) {
    const filters = route.query.f.toString();
    const decodedFilters = decodeURIComponent(filters);
    const queryFilters = JSON.parse(decodedFilters);
    const localCheckedBuckets = [];

    if (checkedBuckets.value.length > 0) {
      for (const cB of checkedBuckets.value) {
        localCheckedBuckets.push(cB);
      }
    }
    queryFilters[aggsName] = localCheckedBuckets;
    const encodedFilters = encodeURIComponent(JSON.stringify(queryFilters));
    query.f = encodedFilters;
  } else {
    const queryFilters: Record<string, string[]> = {};
    for (const checkedBucket of checkedBuckets.value) {
      if (!queryFilters[aggsName]) {
        queryFilters[aggsName] = [];
      }
      queryFilters[aggsName].push(checkedBucket);
    }
    const encodedFilters = encodeURIComponent(JSON.stringify(queryFilters));
    query.f = encodedFilters;
  }

  if (checkedBuckets.value.length > 0) {
    emit('isActive');
  }

  emit('changedAggs', { query, aggsName });
};

const updatePages = (page: number) => {
  pageStartIndex.value = (page - 1) * pageSize.value;
};

const filteredValues = computed(() => buckets.filter((v) => v.name.match(new RegExp(filter.value as string, 'i'))));

updateFilters();
</script>

<template>
  <div class="border-t-2">
    <el-pagination class="items-center" v-model:currentPage="currentPage" v-model:page-size="pageSize"
      layout="prev, pager, next" :total="filteredValues.length || 0" @current-change="updatePages"
      :hide-on-single-page="true" />
    <el-input class="pt-1" v-model="filter" placeholder="Filter" clearable @input="updatePages(1)" />
    <li class="m-2 mt-4 cursor-pointer" v-for="ag in filteredValues?.slice(pageStartIndex, pageStartIndex + pageSize)">
      <div class="form-check form-check-inline cursor-pointer">
        <input :id="aggsName + '_' + ag.name" :name="aggsName + '_' + ag.name" v-model="checkedBuckets"
          v-on:change="onChange"
          class="cursor-pointer form-check-input h-4 w-4 border border-gray-300 rounded-xs bg-white checked:bg-blue-600 checked:border-blue-600 focus:outline-hidden transition duration-200 mt-1 align-top bg-no-repeat bg-center bg-contain float-left mr-2"
          type="checkbox" :value="ag.name">
        <label class="cursor-pointer form-check-label text-gray-800" :for="aggsName + '_' + ag.name">
          {{ ag.name }} <span class="text-xs rounded-full w-32 h-32 text-white bg-purple-500 p-1">{{ ag['count']
            }}</span>
        </label>
      </div>
    </li>
  </div>
</template>
