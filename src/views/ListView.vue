<script setup lang="ts">
import { inject, ref, watch } from 'vue';
import { useRouter, useRoute } from 'vue-router';

import EntitySummary from '@/components/EntitySummary.vue';

import type { ApiService, GetEntitiesParams, GetEntitiesResponse } from '@/services/api';
import { configuration } from '@/configuration';

const { ui } = configuration;
const router = useRouter();

const route = useRoute();
const api = inject<ApiService>('api');
if (!api) {
  throw new Error('API instance not provided');
}

const sorting = ui.search?.sorting?.filter(({ value }) => value !== 'relevance') || [{ value: 'id', label: 'Id' }];
const ordering = ui.search?.ordering || [
  { value: 'asc', label: 'Ascending' },
  { value: 'desc', label: 'Descending' },
];

const currentPage = ref(1);
const pageSize = ref(10);
const total = ref(0);
const loading = ref(false);
const errorDialogText = ref<string | undefined>(undefined);
const entities = ref<GetEntitiesResponse['entities']>([]);
const selectedSorting = ref(sorting[0]);
const selectedOrder = ref(ordering[0]);

const fetchEntities = async () => {
  loading.value = true;

  const params: GetEntitiesParams = {
    limit: pageSize.value,
    sort: selectedSorting.value.value,
    order: selectedOrder.value.value,
  };

  if (route.query.conformsTo) {
    params.conformsTo = route.query.conformsTo.toString();
  }
  if (currentPage.value !== 1) {
    params.offset = (currentPage.value - 1) * pageSize.value;
  }

  try {
    const response = await api.getEntities(params);

    total.value = response.total;
    entities.value = response.entities;
  } catch (e) {
    const err = e as Error;
    errorDialogText.value = err.message;
  }

  loading.value = false;
};

const sortResults = (sort: string) => {
  currentPage.value = 1;
  selectedSorting.value = sorting.find((s) => s.value === sort) || sorting[0];

  fetchEntities();
};

const orderResults = (order: string) => {
  currentPage.value = 1;
  selectedOrder.value = ordering.find((s) => s.value === order) || ordering[0];

  fetchEntities();
};

const updatePages = async (page: number, scrollTo: string) => {
  currentPage.value = page;
  await fetchEntities();
  document.querySelector(`#${scrollTo}`)?.scrollIntoView();
};

const showMap = () => {
  router.push('/map');
};

watch(
  () => route.params,
  () => fetchEntities(),
);

fetchEntities();
</script>

<template>
  <el-row :gutter="0" :offset="0" style="" class="pb-4 pt-0 p-2 px-3">
    <div class="pr-0">
      <div class="top-20 z-10 bg-white pb-3">
        <el-row :align="'middle'" class="mt-4 pb-2 border-0 border-b-[2px] border-solid border-red-700 text-2xl">
          <el-col>
            <span id="total_results" class="my-1 mr-2" v-show="total">Total:
              <span>{{ total }} entries</span></span>
          </el-col>
          <el-col>
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
        <el-col class="flex space-x-4 pb-2">
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
        <el-pagination class="items-center w-full" background layout="prev, pager, next" :total="total"
          v-model:page-size="pageSize" @update:page-size="pageSize" v-model:currentPage="currentPage"
          @current-change="updatePages($event, 'top_menu')" />
      </div>
      <div v-for="entity of entities" :key="entity.id" class="z-0 mt-0 mb-4 w-full" v-loading="loading">
        <EntitySummary :entity="entity" />
      </div>

      <div v-loading="loading" v-if="!entities.length">
        <el-row class="pb-4 items-center">
          <h5 class="mb-2 text-2xl tracking-tight">
            <span v-if="!loading">No entities found</span>
          </h5>
        </el-row>
      </div>
      <div class="py-2 w-full">
        <el-pagination class="items-center w-full" background layout="prev, pager, next" :total="total"
          v-model:page-size="pageSize" @update:page-size="pageSize" v-model:currentPage="currentPage"
          @current-change="updatePages($event, 'total_results')" />
      </div>
    </div>
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
  <el-row></el-row>
</template>
