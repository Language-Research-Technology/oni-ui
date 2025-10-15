<script setup lang="ts">
import { computed, ref } from 'vue';
import FieldHelperCard from '@/components/cards/FieldHelperCard.vue';
import ElasticField from '@/components/ElasticField.vue';
import { ui } from '@/configuration';
import type { RoCrate } from '@/services/api';
import { startCase } from '@/tools';

const { paginatedMeta } = ui.main;

const { meta, isExpand } = defineProps<{
  meta: { name: string; data: RoCrate[keyof RoCrate] };
  isExpand?: boolean;
}>();

const currentPage = ref(1);
const pageSize = ref(10);

if (meta.data && Array.isArray(meta.data) && paginatedMeta.includes(meta.name)) {
  (meta.data as { name: string }[]).sort((a, b) => a.name.toLowerCase().localeCompare(b.name.toLowerCase()));
}

const paginatedMetaData = computed(() => {
  if (Array.isArray(meta.data) && meta.data?.length > pageSize.value) {
    const start = (currentPage.value - 1) * pageSize.value;
    return meta.data.slice(start, start + pageSize.value);
  }

  return meta.data;
});
</script>

<template>
  <el-row :gutter="10" class="py-2">
    <template v-if="isExpand">
      <el-col :xs="24" :sm="24" :md="24" :lg="24" :xl="24">
        <el-row v-for="(value, key) in meta.data">
          <el-col :xs="24" :sm="24" :md="7" :lg="7" :xl="7">{{ startCase(key) }}</el-col>
          <el-col :xs="24" :sm="24" :md="17" :lg="17" :xl="17">
            <ElasticField :field="value" :title="key" />
          </el-col>
        </el-row>
      </el-col>
    </template>
    <template v-else>
      <el-col :xs="24" :sm="24" :md="7" :lg="7" :xl="7" class="mt-1">
        <span class="font-bold break-words">{{ startCase(meta.name) }}</span>
        <FieldHelperCard :meta="meta" />
      </el-col>
      <el-col :xs="24" :sm="24" :md="17" :lg="17" :xl="17">
        <template v-if="Array.isArray(meta.data)">
          <ElasticField :field="d" :title="meta.name" :key="d" v-for="d of paginatedMetaData" />
          <el-pagination v-if="meta.data.length > pageSize" class="mt-4" layout="prev, pager, next"
            :total="meta.data.length" :page-size="pageSize" :current-page="currentPage"
            @current-change="currentPage = $event" />
        </template>
        <template v-else>
          <ElasticField :field="meta.data" :title="meta.name" />
        </template>
      </el-col>
    </template>
  </el-row>
</template>
