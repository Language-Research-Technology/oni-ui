<script setup lang="ts">
import FieldHelperCard from '@/components/cards/FieldHelperCard.vue';
import ElasticField from '@/components/ElasticField.vue';

import { ui } from '@/configuration';
import type { RoCrate } from '@/services/api';

const { textReplacements } = ui;

const startCase = (str: string) => {
  if (typeof str !== 'string' || !str) {
    return '';
  }

  let words = str;

  for (const [pattern, replacement] of Object.entries(textReplacements)) {
    const regex = new RegExp(pattern, 'g');
    words = words.replace(regex, replacement);
  }

  words = words
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .split(/[^a-zA-Z0-9]+/)
    .filter((word) => word.length > 0)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');

  return words;
};

const { meta, isExpand } = defineProps<{
  meta: { name: string; data: RoCrate[keyof RoCrate] };
  isExpand?: boolean;
}>();
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
          <ElasticField :field="d" :title="meta.name" v-for="d of meta.data" />
        </template>
        <template v-else>
          <ElasticField :field="meta.data" :title="meta.name" />
        </template>
      </el-col>
    </template>
  </el-row>
</template>
