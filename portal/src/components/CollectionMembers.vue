<script setup lang="ts">
import { onMounted, ref, inject } from 'vue';

import type { ObjectType, ApiService, GetObjectsParams } from '@/api.service';

import CollectionItem from '@/components/CollectionItem.vue';

const api = inject<ApiService>('api');
if (!api) {
  throw new Error('API instance not provided');
}

const { title, id, conformsTo, routePath } = defineProps<{
  title: string;
  id: string;
  conformsTo: string;
  routePath: string;
}>();

const pageSize = 10;

const items = ref<ObjectType[]>([]);
const total = ref(0);
const currentPage = ref(1);
const isLoading = ref(false);

const setMembers = async () => {
  const params: GetObjectsParams = {
    memberOf: id,
    conformsTo,
    limit: pageSize,
    sort: 'title',
    order: 'asc',
  };

  if (currentPage.value !== 1) {
    params.offset = (currentPage.value - 1) * pageSize;
  }

  isLoading.value = true;

  const response = await api.getObjects(params);
  items.value = response.objects;
  total.value = response.total;

  isLoading.value = false;
};

const updatePages = (page: number) => {
  currentPage.value = page;
  setMembers();
};

onMounted(setMembers);
</script>

<template>
        <template v-if="total">
                <el-row>
                        <el-col :span="24" class="divide-solid divide-y-2 divide-red-700">
                                <div class="grid-content p-6">
                                        <h5 class="mb-2 text-2xl tracking-tight dark:text-white">
                                                {{ title }}: {{ total }}
                                        </h5>
                                </div>
                                <div></div>
                        </el-col>
                </el-row>
                <el-row class="p-10">
                        <el-col :xs="24" :sm="24" :md="24" :lg="24" :xl="24">
                                <div class="py-2 w-full">
                                        <el-pagination class="items-center w-full" background layout="prev, pager, next"
                                                :total="total" v-model:page-size="pageSize"
                                                v-model:currentPage="currentPage" @current-change="updatePages($event)"
                                                @update:page-size="pageSize" />
                                </div>
                                <div v-loading="isLoading">
                                        <ul v-for="item of items" :key="item.id">
                                                <li>
                                                        <CollectionItem :field="item" :routePath="routePath" />
                                                </li>
                                        </ul>
                                </div>
                        </el-col>
                </el-row>
        </template>
</template>
