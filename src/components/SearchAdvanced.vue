<script setup lang="ts">
import { ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';

import SearchAdvancedHelp from '@/components/SearchAdvancedHelp.vue';
import {
  type AdvancedSearchLine,
  blankAdvancedSearchLine,
  generateQueryString,
  type SetSearchParamsOptions,
} from '@/composables/search';
import { ui } from '@/configuration';

const { t } = useI18n();
const { searchFields } = ui;

const { setSearchParams, advancedSearchLines } = defineProps<{
  advancedSearchLines: AdvancedSearchLine[];
  setSearchParams: (params: SetSearchParamsOptions) => void;
}>();

const advancedSearchFields = [
  { label: t('searchAdvanced.allFields'), value: 'all_fields' },
];
Object.entries(searchFields).forEach(([value, label]) => {
  advancedSearchFields.push({ label, value });
});

const localAdvancedSearchLines = ref<AdvancedSearchLine[]>(advancedSearchLines);
console.log('🪚 localAdvancedSearchLines:', JSON.stringify(localAdvancedSearchLines.value, null, 2));
const advancedSearchQuery = ref('');
const showQueryString = ref(false);
const showHelp = ref(false);

const toggleShowQueryString = () => {
  // generateQueryString();
  showQueryString.value = !showQueryString.value;
};

const addNewLine = () => {
  localAdvancedSearchLines.value.push(blankAdvancedSearchLine);
};

const removeLine = (index: number) => {
  localAdvancedSearchLines.value.splice(index, 1);
};

const doAdvancedSearch = () => {
  // generateQueryString();
  setSearchParams({ advancedSearchLines: localAdvancedSearchLines.value });
};

const clearSearch = () => {
  localAdvancedSearchLines.value = [{ ...blankAdvancedSearchLine }];
  advancedSearchQuery.value = generateQueryString(localAdvancedSearchLines.value);
};

watch(
  localAdvancedSearchLines,
  (newVal) => {
    advancedSearchQuery.value = generateQueryString(newVal);
  },
  { deep: true, immediate: true },
);
</script>

<template>
  <el-row :offset="1" :gutter="10" :align="'bottom'" class="flex flex-wrap content-around p-3">
    <el-col class="h-auto">
      <el-row class="p-2" :gutter="10" :justify="'space-between'">
        <p>{{ t('searchAdvanced.title') }}</p>
        <el-button @click="showHelp = !showHelp" class="cursor-pointer">
          {{ t('searchAdvanced.searchHelp') }}&nbsp;<font-awesome-icon icon="fa fa-circle-question" />
        </el-button>
      </el-row>
      <el-row class="p-2 px-8" :gutter="10" v-if="showHelp">
        <SearchAdvancedHelp />
      </el-row>
      <el-row class="px-2 pb-2" :gutter="10" v-for="(as, index) in localAdvancedSearchLines" :key="index">
        <el-col :xs="24" :sm="24" :md="8" :lg="8" :xl="8" class="h-auto">
          <el-select class="w-full m-2" :placeholder="t('searchAdvanced.selectField')" :default-first-option="true" v-model="as.field"
            @change="as.field === 'all_fields' || as.field === '@id' ? as.type = 'phrase' : as.type">
            <el-option v-for="field in advancedSearchFields" :key="field.value" :label="field.label"
              :value="field.value">
            </el-option>
          </el-select>
        </el-col>
        <el-col :xs="24" :sm="24" :md="14" :lg="14" :xl="14" class="h-auto">
          <el-input class="w-full m-2" v-model="as.searchInput" />
        </el-col>
        <el-col :xs="24" :sm="24" :md="1" :lg="1" :xl="1" class="h-auto">
          <el-button v-show="localAdvancedSearchLines.length > 1" class="w-full m-2" type="warning"
            @click="removeLine(index)">
            <font-awesome-icon icon="fa fa-minus" />
          </el-button>
        </el-col>
        <el-col :xs="24" :sm="24" :md="24" :lg="24" :xl="24" class="h-auto">
          <el-select v-if="index < localAdvancedSearchLines.length - 1" class="w-20 m-2 mt-4" v-model="as.operation"
            :default-first-option="true">
            <el-option :label="t('searchAdvanced.operatorAnd')" value="AND" />
            <el-option :label="t('searchAdvanced.operatorOr')" value="OR" />
            <el-option :label="t('searchAdvanced.operatorNot')" value="NOT" />
          </el-select>
        </el-col>
      </el-row>
      <el-row v-if="showQueryString" class="p-2" :gutter="10" :justify="'start'">
        <el-input v-model="advancedSearchQuery" :rows="2" type="textarea" :autosize="true" disabled />
      </el-row>
      <el-row class="p-2" :gutter="10" :justify="'space-between'">
        <el-button-group>
          <el-button @click="addNewLine" class="cursor-pointer">
            <font-awesome-icon icon="fa fa-plus" />&nbsp;{{ t('searchAdvanced.addNewLine') }}
          </el-button>
          <el-button @click="clearSearch" class="cursor-pointer">
            <font-awesome-icon icon="fa fa-rotate-left" />&nbsp;{{ t('common.clear') }}
          </el-button>
        </el-button-group>
        <el-tooltip class="box-item" effect="light" trigger="hover"
          :content="t('searchAdvanced.queryStringTooltip')"
          placement="bottom-end">
          <el-button @click="toggleShowQueryString()">
            {{ showQueryString ? t('searchAdvanced.hideQuery') : t('searchAdvanced.showQuery') }}&nbsp;
            <font-awesome-icon icon="fa-solid fa-circle-info" />
          </el-button>
        </el-tooltip>
      </el-row>
      <el-row class="p-2" :gutter="10" :justify="'center'">
        <el-button @click="doAdvancedSearch" type="primary" size="large" class="cursor-pointer">
          <span class="text-xl">{{ t('common.search') }} &nbsp;<font-awesome-icon icon="fa fa-search" /></span>
        </el-button>
      </el-row>
      <el-row class="p-2" :justify="'start'" :gutter="10" :align="'middle'">
        <el-button @click="setSearchParams({ advancedSearchEnabled: false })" class="cursor-pointer">
          {{ t('searchAdvanced.switchToBasic') }}
        </el-button>
      </el-row>
    </el-col>
  </el-row>
</template>
