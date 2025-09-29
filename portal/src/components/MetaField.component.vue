<template>
  <el-row :gutter="10" class="py-2">
    <template v-if="isExpand">
      <el-col :xs="24" :sm="24" :md="24" :lg="24" :xl="24">
        <el-row v-for="(value, key) in meta.data">
          <el-col :xs="24" :sm="24" :md="7" :lg="7" :xl="7">{{ clean(key) }}</el-col>
          <el-col :xs="24" :sm="24" :md="17" :lg="17" :xl="17">
            <elastic-field :field="value" :title="key" />
          </el-col>
        </el-row>
      </el-col>
    </template>
    <template v-else>
      <el-col :xs="24" :sm="24" :md="7" :lg="7" :xl="7" class="mt-1">
        <span class="font-bold break-words">{{ clean(meta?.name) }}</span>
        <span v-if="meta?.help">
          <FieldHelperCard :meta="meta?.help" />
        </span>
      </el-col>
      <el-col :xs="24" :sm="24" :md="17" :lg="17" :xl="17">
        <template v-if="Array.isArray(meta?.data)">
          <elastic-field v-for="d in paginatedMetaData" :key="d['@id'] || d.name || d.id" :field="d" :title="meta?.name" />
          <el-pagination v-if="sortedMetaData.length > pageSize" class="mt-4" layout="prev, pager, next" :total="sortedMetaData.length" :page-size="pageSize" :current-page="currentPage" @current-change="currentPage = $event" />
        </template>
        <template v-else>
          <elastic-resolve-field :name="meta?.name" :field="meta?.data" :routePath="routePath" :filePath="filePath" :parentId="parentId" :crateId="crateId" />
        </template>
      </el-col>
    </template>
  </el-row>
</template>
<script>
import { first, sortBy } from 'lodash';
import ElasticField from './ElasticField.component.vue';
import ElasticResolveField from './ElasticResolveField.component.vue';
import FieldHelperCard from './cards/FieldHelperCard.component.vue';
import prefixesJson from '../../../prefixes.json';

export default {
  components: {
    FieldHelperCard,
    ElasticField,
    ElasticResolveField,
  },
  props: ['meta', 'routePath', 'filePath', 'parentId', 'crateId', 'isExpand'],
  data() {
    return {
      textReplacements: this.$store.state.configuration.ui.textReplacements || {},
      currentPage: 1,
      pageSize: 10,
    };
  },
  async mounted() {
    try {
    } catch (e) {
      console.error(e);
    }
  },
  computed: {
    sortedMetaData() {
      if (Array.isArray(this.meta?.data)) {
        return sortBy(this.meta.data, d =>
          (first(d?.name)?.['@value'] || d.name || d['@id'] || '').toLowerCase()
        );
      }
      return [];
    },
    paginatedMetaData() {
      if (this.sortedMetaData.length > this.pageSize) {
        const start = (this.currentPage - 1) * this.pageSize;
        return this.sortedMetaData.slice(start, start + this.pageSize);
      }
      return this.sortedMetaData;
    }
  },
  methods: {
    first,
    clean(text) {
      if (text) {
        // Prefix replacements
        const prefixes = prefixesJson.prefixes;
        for (const [prefix, replacement] of Object.entries(prefixes)) {
          if (text.startsWith(prefix)) {
            text = replacement + text.slice(prefix.length);
          }
        }
        // Regex text replacements
        for (const [pattern, replacement] of Object.entries(this.textReplacements)) {
          const regex = new RegExp(pattern, 'g');
          text = text.replace(regex, replacement)
        }
        // Capitalisation and camel case handling
        return this.capitalizeFirstLetter(text.replace(/([a-z])([A-Z])/g, '$1 $2'));
      }
    },
    capitalizeFirstLetter(string) {
      return string[0].toUpperCase() + string.slice(1);
    },
  },
};
</script>
