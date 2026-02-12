<script setup lang="ts">
import { inject, onMounted, ref } from 'vue';
import CollectionItem from '@/components/CollectionItem.vue';
import type { ApiService, EntityType, GetEntitiesParams } from '@/services/api';

const api = inject<ApiService>('api');
if (!api) {
  throw new Error('API instance not provided');
}

const { title, id, entityType, routePath, sort } = defineProps<{
  title: string;
  id: string;
  entityType: string;
  routePath: string;
  sort: string;
}>();

const items = ref<EntityType[]>([]);
const total = ref(0);
const currentPage = ref(1);
const isLoading = ref(false);
const pageSize = ref(10);

const setMembers = async () => {
  const params: GetEntitiesParams = {
    memberOf: id,
    entityType,
    limit: pageSize.value,
    sort,
    order: 'asc',
  };

  if (currentPage.value !== 1) {
    params.offset = (currentPage.value - 1) * pageSize.value;
  }

  isLoading.value = true;

  const response = await api.getEntities(params);
  if ('error' in response) {
    // TODO: We should have an error dialog
    console.error('Error fetching entities:', response.error);
    isLoading.value = false;

    return;
  }

  items.value = response.entities;
  total.value = response.total;

  isLoading.value = false;
};

const updatePages = (page: number) => {
  currentPage.value = page;
  setMembers();
};

const handlePageSizeChange = () => {
  currentPage.value = 1;
  setMembers();
};

const PAGE_SIZE_OPTIONS = [10, 20, 50, 100];

onMounted(setMembers);
</script>

<template>
  <template v-if="total">
    <el-row>
      <el-col :span="24" class="divide-solid divide-y-2 divide-red-700">
        <div class="grid-content p-6">
          <h5 class="mb-2 text-2xl tracking-tight">
            {{ title }}: {{ total }}
          </h5>
        </div>
        <div></div>
      </el-col>
    </el-row>
    <el-row class="p-10">
      <el-col :xs="24" :sm="24" :md="24" :lg="24" :xl="24">
        <div class="py-2 w-full">
          <el-pagination class="items-center w-full" background layout="sizes, prev, pager, next" :total="total"
            :page-sizes="PAGE_SIZE_OPTIONS" v-model:page-size="pageSize" v-model:currentPage="currentPage"
            @current-change="updatePages($event)" @size-change="handlePageSizeChange" />
        </div>
        <div v-loading="isLoading">
          <ul v-for="item of items" :key="item.id" class="list-disc">
            <li>
              <CollectionItem :field="item" :routePath="routePath" />
            </li>
          </ul>
        </div>
        <div class="py-2 w-full">
          <el-pagination class="items-center w-full" background layout="sizes, prev, pager, next" :total="total"
            :page-sizes="PAGE_SIZE_OPTIONS" v-model:page-size="pageSize" v-model:currentPage="currentPage"
            @current-change="updatePages($event)" @size-change="handlePageSizeChange" />
        </div>
      </el-col>
    </el-row>
  </template>
</template>
