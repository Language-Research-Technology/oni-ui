<template>
  <el-row :offset="1" :gutter="10" :align="'bottom'" class="flex flex-wrap content-around p-3">
    <el-col class="h-auto">
      <el-row class="p-2" :gutter="10" :justify="'space-between'">
        <p>Advanced Search:</p>
        <el-button @click="showHelp = !showHelp"
                   class="cursor-pointer">
          Search Help&nbsp;<font-awesome-icon icon="fa fa-circle-question"/>
        </el-button>
      </el-row>
      <el-row class="p-2 px-8" :gutter="10" v-if="showHelp">
        <SearchAdvancedHelp/>
      </el-row>
      <el-row class="px-2 pb-2" :gutter="10" v-for="(sg, index) in searchGroup" :key="index">
        <el-col :xs="24" :sm="24" :md="8" :lg="8" :xl="8" class="h-auto">
          <el-select class="w-full m-2"
                     placeholder="Select a Field"
                     :default-first-option="true"
                     v-model="sg.field"
                     @change="sg.field === 'all_fields' || sg.field === '@id' ? sg.type= 'phrase' : sg.type">
            <el-option v-for="field in fieldAdvancedSearch"
                       :key="field.value"
                       :label="field.label"
                       :value="field.value">
            </el-option>
          </el-select>
        </el-col>
        <!--        <el-col :xs="24" :sm="24" :md="5" :lg="5" :xl="5" class="h-auto">-->
        <!--          <el-select class="w-full m-2"-->
        <!--                     v-model="sg.type"-->
        <!--                     :default-first-option="true">-->
        <!--            <el-option label="match" value="phrase"/>-->
        <!--            <el-option label="prefix" value="phrase_prefix"-->
        <!--                       :disabled="sg.field === 'all_fields' || sg.field === '@id' "/>-->
        <!--            <el-option label="wildcard" value="wildcard"-->
        <!--                       :disabled="sg.field === 'all_fields' || sg.field === '@id' "/>-->
        <!--            <el-option label="regex" value="regex"-->
        <!--                       :disabled="sg.field === 'all_fields' || sg.field === '@id' "/>-->
        <!--          </el-select>-->
        <!--        </el-col>-->
        <el-col :xs="24" :sm="24" :md="14" :lg="14" :xl="14" class="h-auto">
          <el-input class="w-full m-2" v-model="sg.searchInput"/>
        </el-col>
        <el-col :xs="24" :sm="24" :md="1" :lg="1" :xl="1" class="h-auto">
          <el-button v-show="searchGroup.length > 1" class="w-full m-2" type="warning" @click="removeLine(index)">
            <font-awesome-icon icon="fa fa-minus"/>
          </el-button>
        </el-col>
        <el-col :xs="24" :sm="24" :md="24" :lg="24" :xl="24" class="h-auto">
          <el-select v-if="index < searchGroup.length - 1" class="w-20 m-2 mt-4"
                     v-model="sg.operation"
                     :default-first-option="true">
            <el-option label="AND" value="AND"/>
            <el-option label="OR" value="OR"/>
            <el-option label="NOT" value="NOT"/>
          </el-select>
        </el-col>
      </el-row>
      <el-row v-if="useQueryString" class="p-2" :gutter="10" :justify="'start'">
        <el-input
            v-model="textQueryString"
            :rows="2"
            type="textarea"
            :autosize="true"
            disabled
        />
      </el-row>
      <el-row class="p-2" :gutter="10" :justify="'space-between'">
        <el-button-group>
          <el-button @click="addNewLine"
                     class="cursor-pointer">
            <font-awesome-icon icon="fa fa-plus"/>&nbsp;Add New Line
          </el-button>
          <el-button @click="clear"
                     class="cursor-pointer">
            <font-awesome-icon icon="fa fa-rotate-left"/>&nbsp;Clear
          </el-button>
        </el-button-group>
        <el-tooltip class="box-item" effect="light" trigger="hover" content="This query string is what it is actually sent to the search engine, click search to update it"
                    placement="bottom-end">
          <el-button @click="doUseQueryString()">
            {{ useQueryString ? 'Hide Query' : 'Show Query' }}&nbsp;
            <font-awesome-icon icon="fa-solid fa-circle-info"/>
          </el-button>
        </el-tooltip>
      </el-row>
      <el-row class="p-2" :gutter="10" :justify="'center'">
        <el-button @click="advancedSearch"
                   type="primary"
                   size="large"
                   class="cursor-pointer">
          <span class="text-xl">Search &nbsp;<font-awesome-icon icon="fa fa-search"/></span>
        </el-button>
      </el-row>
      <el-row class="p-2" :justify="'start'" :gutter="10" :align="'middle'">
        <el-button @click="showBasicSearch"
                   class="cursor-pointer">Switch to basic search
        </el-button>
      </el-row>
    </el-col>
  </el-row>
</template>

<script>
import { getLocalStorage, removeLocalStorage } from '@/storage';
import { Close } from '@element-plus/icons-vue';
import { isEmpty } from 'lodash';
import { defineAsyncComponent } from 'vue';
import SearchAdvancedHelp from './SearchAdvancedHelp.component.vue';

export default {
  props: ['searchInput', 'fields', 'resetAdvancedSearch'],
  components: { SearchAdvancedHelp },
  created() {},
  updated() {
    if (this.resetAdvancedSearch) {
      this.searchGroup = [
        {
          field: 'all_fields',
          operation: 'AND',
          operator: 'AND',
          type: 'phrase',
          searchInput: '',
        },
      ];
    }
  },
  computed: {},
  async mounted() {
    if (this.$route.query.a) {
      this.advancedSearch = true;
      const searchGroup = JSON.parse(decodeURIComponent(this.$route.query.a));
      this.searchGroup = searchGroup;
    }
  },
  watch: {},
  methods: {
    isEmpty,
    advancedSearch() {
      this.setQueryString();
      this.$emit('doAdvancedSearch', { queries: this.queries });
    },
    addNewLine() {
      this.searchGroup.push({
        field: 'all_fields',
        operation: 'AND',
        operator: 'AND',
        type: 'phrase',
        searchInput: '',
      });
    },
    clear() {
      this.searchGroup = [
        {
          field: 'all_fields',
          operation: 'AND',
          operator: 'AND',
          type: 'phrase',
          searchInput: '',
        },
      ];
    },
    removeLine(index) {
      this.searchGroup.splice(index, 1);
    },
    showBasicSearch() {
      removeLocalStorage({ key: 'advancedQueries' });
      this.searchGroup = [
        {
          field: 'all_fields',
          operation: 'AND',
          operator: 'AND',
          type: 'phrase',
          searchInput: '',
        },
      ];
      this.$emit('basic-search');
    },
    doUseQueryString() {
      this.useQueryString = !this.useQueryString;
      this.setQueryString();
    },
    setQueryString() {
      this.textQueryString = this.$elasticService.queryString(this.searchGroup);
      this.queries = {
        queryString: this.textQueryString,
        searchGroup: encodeURIComponent(JSON.stringify(this.searchGroup)),
      };
    },
  },
  data() {
    const fieldAdvancedSearch = [{ label: 'All Fields', value: 'all_fields' }];
    Object.keys(this.fields).map((f) => {
      fieldAdvancedSearch.push({ label: this.fields[f].label, value: f });
    });
    const searchGroup = [
      {
        field: 'all_fields',
        operation: 'AND',
        operator: 'AND',
        type: 'phrase',
        searchInput: '',
      },
    ];
    // searchGroup.push();
    return {
      searchGroup: searchGroup,
      selectedField: {},
      selectedOperation: 'AND',
      fieldAdvancedSearch: fieldAdvancedSearch,
      useQueryString: false,
      queries: '',
      textQueryString: '',
      showHelp: false,
    };
  },
};
</script>
