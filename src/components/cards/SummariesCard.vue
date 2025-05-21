<script setup lang="ts">
import { ref, watch } from 'vue';

const { aggregations, fields, id, root } = defineProps<{
  aggregations: Record<string, { buckets: { key: string; doc_count: number }[] }>;
  fields: Array<{ name: string; display: string }>;
  name: string;
  id: string;
  root: Array<{ name: { '@value': string } }>;
  link: string;
}>();
const buckets = ref<Array<{ name: string; field: string; buckets: { key: string; doc_count: number }[] }>>([]);
const isLoading = ref(false);

watch(
  () => aggregations,
  () => {
    if (aggregations) {
      populateBuckets();
      isLoading.value = false;
    }
  },
);

const populateBuckets = () => {
  buckets.value = [];
  for (const field of fields) {
    if (aggregations?.[field?.name]) {
      buckets.value.push({
        name: field.name,
        field: field.display,
        buckets: aggregations[field.name]?.buckets,
      });
    }
  }
};

const getSearchUrl = (name: string, bucket: string) => {
  const part: Record<string, string[]> = {};
  part[name] = [bucket];
  const rootName = root[0]?.name?.['@value'];
  if (rootName) {
    part['_root.name.@value'] = [rootName];
  } else {
    part['_collectionStack.@id'] = [id];
  }
  const stringify = JSON.stringify(part);

  return `/search?f=${encodeURIComponent(stringify)}`;
};

populateBuckets();
</script>

<template>
  <template v-for="(f, index) of buckets" :key="f.field + '_' + index" v-loading="isLoading">
    <ul>
      <li v-if="f?.buckets.length > 1">
        <ul>
          <li><span class="font-semibold">{{ f.field }}</span></li>
          <template v-for="bucket of f?.buckets" :key="bucket.key">
            <li v-if="bucket.doc_count > 0" class="ml-4 pl-2">
              <el-link underline="always" type="primary">
                <router-link :to="getSearchUrl(f.name, bucket.key)">
                  {{ bucket.key }}
                  <!--: {{ bucket.doc_count }}-->
                </router-link>
              </el-link>
            </li>
          </template>
        </ul>
      </li>
      <li v-else-if="f?.buckets.length === 1">
        <ul>
          <li><span class="font-semibold">{{ f.field }}</span></li>
          <template v-for="bucket of f?.buckets" :key="bucket.key">
            <li class="ml-4 pl-2">{{ bucket.key }}</li>
          </template>
        </ul>
      </li>
    </ul>
  </template>
</template>
