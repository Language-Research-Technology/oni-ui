<template>
  <el-row :gutter="10" class="py-2">
    <template v-if="isExpand">
      isExpand
      <el-col :xs="24" :sm="24" :md="24" :lg="24" :xl="24">
        <el-row v-for="(value, key) in meta.data">
          <el-col :xs="24" :sm="24" :md="7" :lg="7" :xl="7">M{{ startCase(key) }}</el-col>
          <el-col :xs="24" :sm="24" :md="17" :lg="17" :xl="17">
            <elastic-field :field="value" :title="key"/>
          </el-col>
        </el-row>
      </el-col>
    </template>
    <template v-else>
    <el-col :xs="24" :sm="24" :md="7" :lg="7" :xl="7" class="mt-1">
      <span class="font-bold break-words">{{ startCase(meta.name) }}</span>
      <span v-if="meta.help"><FieldHelperCard :meta="meta.help"/></span>
    </el-col>
    <el-col :xs="24" :sm="24" :md="17" :lg="17" :xl="17">
      <template v-if="Array.isArray(meta.data)">
        <elastic-field :field="d" :title="meta.name" v-for="d of meta.data"/>
      </template>
      <template v-else>
        <elastic-field :field="meta.data" :title="meta.name" />
      </template>
    </el-col>
    </template>
  </el-row>
</template>
<script>
import { startCase } from 'lodash';
import ElasticField from './ElasticField.component.vue';
import FieldHelperCard from './cards/FieldHelperCard.component.vue';

export default {
  components: {
    FieldHelperCard,
    ElasticField,
  },
  props: ['meta', 'isExpand'],
  methods: {
    startCase,
  },
};
</script>
