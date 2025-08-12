<script setup lang="ts">
import type { ApiService, EntityType } from '@/services/api';
import { inject, ref } from 'vue';

const api = inject<ApiService>('api');
if (!api) {
  throw new Error('API instance not provided');
}

const { id, objectType, objectName } = defineProps<{
  id: string;
  objectType: string;
  objectName: string;
}>();

const objectTotals = ref(0);
const objects = ref<EntityType[]>([]);

const getNextobjects = async () => {
  const items = await api.search({
    query: '',
    filters: {
      'input.@id': [id],
      '@type': [objectType],
    },
    sort: 'relevance',
    order: 'desc',
  });

  objectTotals.value = items.total;
  objects.value = items.entities;
};

getNextobjects();
</script>

<template>
  <template v-if="objectTotals > 0">
    <template v-for="object of objects">
      <ul>
        <li class="font-semibold">
          <el-link class="ml-2" underline="always" type="primary">
            <router-link :to="`/object?_id=${object.id}`">
              {{ object.name || object.id }}
            </router-link>"
          </el-link>
        </li>
      </ul>
    </template>
  </template>
  <template v-else>
    <p>No {{ objectName }} associated with this item/collection.</p>
  </template>
</template>
