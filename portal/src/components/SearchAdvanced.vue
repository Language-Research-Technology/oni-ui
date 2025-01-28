<script setup lang="ts">
import { inject, ref, watch } from 'vue';
import { useRoute } from 'vue-router';

import SearchAdvancedHelp from '@/components/SearchAdvancedHelp.vue';
import type { ElasticService } from '@/services/elastic';
import { isArray } from 'element-plus/es/utils/types.mjs';

const route = useRoute();

const emit = defineEmits(['doAdvancedSearch', 'basicSearch']);

const { fields, resetAdvancedSearch } = defineProps<{
  fields: Record<string, { label: string }>;
  resetAdvancedSearch: boolean;
}>();

watch(
  () => resetAdvancedSearch,
  () => {
    if (resetAdvancedSearch) {
      clear();
    }
  },
);

const initialFieldAdvancedSearch = [{ label: 'All Fields', value: 'all_fields' }];
Object.keys(fields).map((f) => {
  initialFieldAdvancedSearch.push({ label: fields[f].label, value: f });
});

export type SearchGroup = {
  field: string;
  operation: string;
  operator: string;
  type: string;
  searchInput: string;
};

const initialSearchGroup = JSON.parse(decodeURIComponent(route.query.a?.toString() || '') || 'null');
const searchGroup = ref<SearchGroup[]>(
  initialSearchGroup || [
    {
      field: 'all_fields',
      operation: 'AND',
      operator: 'AND',
      type: 'phrase',
      searchInput: '',
    },
  ],
);
const fieldAdvancedSearch = ref(initialFieldAdvancedSearch);
const showQueryString = ref(false);
const textQueryString = ref('');
const showHelp = ref(false);

const advancedSearch = () => {
  setQueryString();
  emit('doAdvancedSearch', { searchGroup: searchGroup.value });
};

const addNewLine = () => {
  searchGroup.value.push({
    field: 'all_fields',
    operation: 'AND',
    operator: 'AND',
    type: 'phrase',
    searchInput: '',
  });
};

const clear = () => {
  searchGroup.value = [
    {
      field: 'all_fields',
      operation: 'AND',
      operator: 'AND',
      type: 'phrase',
      searchInput: '',
    },
  ];
};

const removeLine = (index: number) => {
  searchGroup.value.splice(index, 1);
};

const showBasicSearch = () => {
  clear();
  emit('basicSearch');
};

const toggleShowQueryString = () => {
  setQueryString();
  showQueryString.value = !showQueryString.value;
};

const queryString = (searchGroup) => {
  console.log('🪚 searchGroup:', JSON.stringify(searchGroup, null, 2));
  let qS = '';

  console.log('🪚 ⭕', typeof searchGroup, isArray(searchGroup));

  (searchGroup || []).forEach((sg, i) => {
    let lastOneSG = false;
    if (i + 1 === searchGroup.length) {
      lastOneSG = true;
    }
    if (sg.searchInput.length === 0) {
      sg.searchInput = '*';
    }
    if (sg.field === 'all_fields') {
      let qqq = '( ';
      Object.keys(fields).map((f, index, keys) => {
        let lastOne = false;
        if (index + 1 === keys.length) {
          lastOne = true;
        }
        let qq = '';
        qq = String.raw`${f} : ${sg.searchInput} ${!lastOne ? 'OR' : ''} `;
        qqq += qq;
      });
      qS += String.raw`${qqq} ) ${!lastOneSG ? sg.operation : ''} `;
    } else {
      qS += String.raw` ( ${sg.field}: ${sg.searchInput} ) ${!lastOneSG ? sg.operation : ''}`;
    }
  });

  console.log('🪚 qS:', JSON.stringify(qS, null, 2));
  return qS;
};

const setQueryString = () => {
  textQueryString.value = queryString(searchGroup.value || []);
};

if (route.query.a) {
  advancedSearch.value = true;
  searchGroup.value = JSON.parse(decodeURIComponent(route.query.a.toString()));
}
</script>

<template>
  <el-row :offset="1" :gutter="10" :align="'bottom'" class="flex flex-wrap content-around p-3">
    <el-col class="h-auto">
      <el-row class="p-2" :gutter="10" :justify="'space-between'">
        <p>Advanced Search:</p>
        <el-button @click="showHelp = !showHelp" class="cursor-pointer">
          Search Help&nbsp;<font-awesome-icon icon="fa fa-circle-question" />
        </el-button>
      </el-row>
      <el-row class="p-2 px-8" :gutter="10" v-if="showHelp">
        <SearchAdvancedHelp />
      </el-row>
      <el-row class="px-2 pb-2" :gutter="10" v-for="(sg, index) in searchGroup" :key="index">
        <el-col :xs="24" :sm="24" :md="8" :lg="8" :xl="8" class="h-auto">
          <el-select class="w-full m-2" placeholder="Select a Field" :default-first-option="true" v-model="sg.field"
            @change="sg.field === 'all_fields' || sg.field === '@id' ? sg.type = 'phrase' : sg.type">
            <el-option v-for="field in fieldAdvancedSearch" :key="field.value" :label="field.label"
              :value="field.value">
            </el-option>
          </el-select>
        </el-col>
        <el-col :xs="24" :sm="24" :md="14" :lg="14" :xl="14" class="h-auto">
          <el-input class="w-full m-2" v-model="sg.searchInput" />
        </el-col>
        <el-col :xs="24" :sm="24" :md="1" :lg="1" :xl="1" class="h-auto">
          <el-button v-show="searchGroup.length > 1" class="w-full m-2" type="warning" @click="removeLine(index)">
            <font-awesome-icon icon="fa fa-minus" />
          </el-button>
        </el-col>
        <el-col :xs="24" :sm="24" :md="24" :lg="24" :xl="24" class="h-auto">
          <el-select v-if="index < searchGroup.length - 1" class="w-20 m-2 mt-4" v-model="sg.operation"
            :default-first-option="true">
            <el-option label="AND" value="AND" />
            <el-option label="OR" value="OR" />
            <el-option label="NOT" value="NOT" />
          </el-select>
        </el-col>
      </el-row>
      <el-row v-if="showQueryString" class="p-2" :gutter="10" :justify="'start'">
        <el-input v-model="textQueryString" :rows="2" type="textarea" :autosize="true" disabled />
      </el-row>
      <el-row class="p-2" :gutter="10" :justify="'space-between'">
        <el-button-group>
          <el-button @click="addNewLine" class="cursor-pointer">
            <font-awesome-icon icon="fa fa-plus" />&nbsp;Add New Line
          </el-button>
          <el-button @click="clear" class="cursor-pointer">
            <font-awesome-icon icon="fa fa-rotate-left" />&nbsp;Clear
          </el-button>
        </el-button-group>
        <el-tooltip class="box-item" effect="light" trigger="hover"
          content="This query string is what it is actually sent to the search engine, click search to update it"
          placement="bottom-end">
          <el-button @click="toggleShowQueryString()">
            {{ showQueryString ? 'Hide Query' : 'Show Query' }}&nbsp;
            <font-awesome-icon icon="fa-solid fa-circle-info" />
          </el-button>
        </el-tooltip>
      </el-row>
      <el-row class="p-2" :gutter="10" :justify="'center'">
        <el-button @click="advancedSearch" type="primary" size="large" class="cursor-pointer">
          <span class="text-xl">Search &nbsp;<font-awesome-icon icon="fa fa-search" /></span>
        </el-button>
      </el-row>
      <el-row class="p-2" :justify="'start'" :gutter="10" :align="'middle'">
        <el-button @click="showBasicSearch" class="cursor-pointer">Switch to basic search
        </el-button>
      </el-row>
    </el-col>
  </el-row>
</template>
