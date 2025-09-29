<script setup lang="ts">
import { computed, inject, ref } from 'vue';
import ZipLink from '@/components/ZipLink.vue';
import type { ApiService, EntityType } from '@/services/api';

const { id, idFieldName, modelValue, simpleView } = defineProps<{
  id: string;
  idFieldName: string;
  modelValue: boolean;
  simpleView?: boolean;
  access?: string;
}>();

const api = inject<ApiService>('api');
if (!api) {
  throw new Error('API instance not provided');
}

const emit = defineEmits(['update:modelValue']);

type ObjectType = {
  id: string;
  name: string;
  access: EntityType['access'];
};

const loading = ref(false);
const objects = ref<ObjectType[]>([]);
const objectTotals = ref(0);
const pageSize = ref(10);
const currentPage = ref(1);

const getObjects = async () => {
  loading.value = true;

  const filters = {
    [idFieldName]: [id],
    // TODO: Remove this after we roll out the API??
    isOCFL: ['true'],
  };
  const entities = await api.search({
    query: '',
    filters,
    sort: 'relevance',
    order: 'desc',
    limit: pageSize.value,
    offset: (currentPage.value - 1) * pageSize.value,
  });

  if ('error' in entities) {
    console.error('Error fetching objects:', entities.error);
    loading.value = false;
    return;
  }

  objectTotals.value = entities.total;

  objects.value = [];
  for (const entity of entities.entities) {
    objects.value.push({
      id: entity.id,
      name: entity.name,
      access: entity.access,
    });
  }

  loading.value = false;
};

const visible = computed({
  get() {
    return modelValue;
  },
  set(value) {
    emit('update:modelValue', value);
  },
});

const closeModal = () => {
  visible.value = false;
};

const updatePages = async (page: number) => {
  currentPage.value = page;
  await getObjects();
};

getObjects();
console.log('🪚 🔲');
</script>

<template>
  <el-dialog v-model="visible" title="Downloads for this Collection" width="50%">
    <el-pagination class="items-center w-full" background layout="prev, pager, next" :total="objectTotals || 0"
      v-model:page-size="pageSize" v-model:currentPage="currentPage" @current-change="updatePages($event)" />

    <div v-if="objectTotals > 0" v-loading="loading">
      <el-row class="hidden-sm-and-down py-2">
        <el-col :xs="24" :sm="10" :md="10" :lg="10" :xl="10">
          <h3 class="font-bold">Name</h3>
        </el-col>
        <el-col :xs="24" :sm="4" :md="4" :lg="4" :xl="4">
          <h3 class="font-bold">Access</h3>
        </el-col>
      </el-row>

      <template v-for="(obj, index) of objects" :key="index">
        <ZipLink :access="obj.access" :id="obj.id" :name="obj.name" :asTableRow="true" v-if="obj.name" />
      </template>
    </div>
    <template v-else>
      <p><br>No direct downloads associated with this item.</p>
    </template>

    <template #footer>
      <div class="dialog-footer">
        <el-button @click="closeModal">Close</el-button>
      </div>
    </template>
  </el-dialog>

  <div v-if="simpleView">
    <template v-if="objectTotals > 0">
      <template v-for="(obj, index) in objects" :key="index">
        <ZipLink :access="obj.access" :id="obj.id" :name="obj.name" :asTableRow="false" v-if="obj.name" />
      </template>
    </template>
    <template v-else>
      <p>This item does not have a direct download link.</p>
    </template>
  </div>
</template>
