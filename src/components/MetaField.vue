<script setup lang="ts">
import { computed, ref } from 'vue';
import FieldHelperCard from '@/components/cards/FieldHelperCard.vue';
import ElasticField from '@/components/ElasticField.vue';
import { ui } from '@/configuration';
import type { RoCrate } from '@/services/api';
import { first, startCase } from '@/tools';

const { paginatedMeta } = ui.main;

const { meta, isExpand } = defineProps<{
  meta: { name: string; data: RoCrate[keyof RoCrate] };
  isExpand?: boolean;
}>();

const currentPage = ref(1);
const pageSize = ref(10);

const name = computed(() => meta.name);
const data = computed(() => meta.data);

const sortedData = computed(() => {
  if (Array.isArray(meta.data) && paginatedMeta.includes(meta.name)) {
    return [...(meta.data as { name: string | string[] }[])].sort((a, b) => {
      const aName = String(first(a.name) || '').toLowerCase();
      const bName = String(first(b.name) || '').toLowerCase();
      return aName.localeCompare(bName);
    });
  }

  return meta.data;
});

const paginatedMetaData = computed(() => {
  if (Array.isArray(sortedData.value) && sortedData.value.length > pageSize.value) {
    const start = (currentPage.value - 1) * pageSize.value;
    return sortedData.value.slice(start, start + pageSize.value);
  }

  return sortedData.value;
});
</script>

<template>
  <el-row :gutter="10" class="py-2">
    <template v-if="isExpand">
      <el-col :xs="24" :sm="24" :md="24" :lg="24" :xl="24">
        <el-row v-for="(value, key) in data">
          <el-col :xs="24" :sm="24" :md="7" :lg="7" :xl="7">{{ startCase(String(key)) }}</el-col>
          <el-col :xs="24" :sm="24" :md="17" :lg="17" :xl="17">
            <ElasticField :field="value" :title="String(key)" />
          </el-col>
        </el-row>
      </el-col>
    </template>
    <template v-else>
      <el-col :xs="24" :sm="24" :md="7" :lg="7" :xl="7" class="mt-1">
        <span class="font-bold wrap-break-word">{{ startCase(name) }}</span>
        <FieldHelperCard :meta="meta" />
      </el-col>
      <el-col :xs="24" :sm="24" :md="17" :lg="17" :xl="17">
        <template v-if="Array.isArray(sortedData)">
          <ElasticField :field="d" :title="name" :key="d as string" v-for="d of paginatedMetaData" />
          <el-pagination v-if="(sortedData as unknown[]).length > pageSize" class="mt-4" layout="prev, pager, next"
            :total="(sortedData as unknown[]).length" :page-size="pageSize" :current-page="currentPage"
            @current-change="currentPage = $event" />
        </template>
        <template v-else>
          <ElasticField :field="data" :title="name" />
        </template>
      </el-col>
    </template>
  </el-row>
</template>
