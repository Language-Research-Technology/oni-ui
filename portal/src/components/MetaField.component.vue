<template>
  <el-row :gutter="10" class="py-2">
    <template v-if="isExpand">
      <el-col :xs="24" :sm="24" :md="24" :lg="24" :xl="24">
        <el-row v-for="(value, key) in meta.data">
          <el-col :xs="24" :sm="24" :md="7" :lg="7" :xl="7">{{ clean(key) }}</el-col>
          <el-col :xs="24" :sm="24" :md="17" :lg="17" :xl="17">
            <elastic-field :field="value" :title="key"/>
          </el-col>
        </el-row>
      </el-col>
    </template>
    <template v-else>
    <el-col :xs="24" :sm="24" :md="7" :lg="7" :xl="7" class="mt-1">
      <span class="font-bold break-words">{{ clean(meta?.name) }}</span>
      <span v-if="meta?.help"><FieldHelperCard :meta="meta?.help"/></span>
    </el-col>
    <el-col :xs="24" :sm="24" :md="17" :lg="17" :xl="17">
      <template v-if="Array.isArray(meta?.data)">
        <elastic-field :field="d" :title="meta?.name" v-for="d of meta.data"/>
      </template>
      <template v-else>
        <elastic-resolve-field :name="meta?.name" :field="meta?.data" :routePath="routePath" :filePath="filePath" :parentId="parentId" :crateId="crateId"/>
      </template>
    </el-col>
    </template>
  </el-row>
</template>
<script>
import { first } from 'lodash';
import ElasticField from './ElasticField.component.vue';
import ElasticResolveField from './ElasticResolveField.component.vue';
import FieldHelperCard from './cards/FieldHelperCard.component.vue';

export default {
  components: {
    FieldHelperCard,
    ElasticField,
    ElasticResolveField,
  },
  props: ['meta', 'routePath', 'filePath', 'parentId', 'crateId', 'isExpand'],
  data() {
    return {};
  },
  async mounted() {
    try {
    } catch (e) {
      console.error(e);
    }
  },
  methods: {
    first,
    clean(text) {
      if (text) {
        text = text.replace(/^_/, ''); // If it contains underscore
        text = text.replace(/^ldac:/, ''); // If it contains the ldac prefix
        text = text.replace(/^dct:/, ''); // If it contains dublincore prefix
        return this.capitalizeFirstLetter(text.replace(/([a-z])([A-Z])/g, '$1 $2'));
      }
    },
    capitalizeFirstLetter(string) {
      return string[0].toUpperCase() + string.slice(1);
    },
  },
};
</script>
