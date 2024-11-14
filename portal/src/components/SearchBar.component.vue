<template>
  <el-row :offset="1" :gutter="0" :align="'bottom'" class="flex flex-wrap content-around">
    <el-col :xs="24" class="h-auto">
      <el-row :justify="'center'" :gutter="10" :align="'middle'">
        <label for="searchInput" class="h-14 mx-2 w-full">
          <el-input @keyup.enter="searchInputField" type="text" class="px-2 w-64 h-full w-full"
                    placeholder="Search..."
                    v-model="searchQuery"
                    @input="updateSearchInput"
                    name="searchInput" id="searchInput" ref="searchInput">
            <template #append>
              <button v-if="searchInput || $route.query.q" @click="resetBar()"
                      class="flex items-center justify-center pr-3 hover:text-red-600 mr-3 border-0 border-r-[1px] border-solid border-gray-300">
                <svg class="svg-icon"
                     style="width: 1em; height: 1em;vertical-align: middle;fill: currentColor;overflow: hidden;"
                     viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg">
                  <path
                      d="M810.65984 170.65984q18.3296 0 30.49472 12.16512t12.16512 30.49472q0 18.00192-12.32896 30.33088l-268.67712 268.32896 268.67712 268.32896q12.32896 12.32896 12.32896 30.33088 0 18.3296-12.16512 30.49472t-30.49472 12.16512q-18.00192 0-30.33088-12.32896l-268.32896-268.67712-268.32896 268.67712q-12.32896 12.32896-30.33088 12.32896-18.3296 0-30.49472-12.16512t-12.16512-30.49472q0-18.00192 12.32896-30.33088l268.67712-268.32896-268.67712-268.32896q-12.32896-12.32896-12.32896-30.33088 0-18.3296 12.16512-30.49472t30.49472-12.16512q18.00192 0 30.33088 12.32896l268.32896 268.67712 268.32896-268.67712q12.32896-12.32896 30.33088-12.32896z"/>
                </svg>
              </button>
              <button @click="doSearch()" class="flex items-center justify-center rounded hover:text-red-600">
                <!--          text-gray-600"-->
                <svg class="svg-icon"
                     style="width: 2em; height: 2em;vertical-align: middle;fill: currentColor;overflow: hidden;"
                     fill="currentColor" xmlns="http://www.w3.org/2000/svg"
                     viewBox="0 0 24 24">
                  <path
                      d="M16.32 14.9l5.39 5.4a1 1 0 0 1-1.42 1.4l-5.38-5.38a8 8 0 1 1 1.41-1.41zM10 16a6 6 0 1 0 0-12 6 6 0 0 0 0 12z"/>
                </svg>
              </button>
            </template>
          </el-input>
        </label>
      </el-row>
      <el-row :justify="'center'" :gutter="20" :align="'middle'" class="pt-2">
        <el-button @click="showAdvancedSearch"
                   class="cursor-pointer">Advanced Search&nbsp;<span
            class="text-xs text-gray-400 bg-slate-200 shadow rounded-2xl px-2">beta</span>
        </el-button>
      </el-row>
    </el-col>
  </el-row>
</template>

<script>
import { Close } from '@element-plus/icons-vue';
import { isEmpty } from 'lodash';
import { defineAsyncComponent } from 'vue';

export default {
  props: [
    'searchInput',
    'clearSearch',
    'filters',
    'search',
    'fields',
    'showFields',
    'enableAdvancedSearch',
    'searchPath',
  ],
  components: {},
  created() {
    this.searchQuery = this.searchInput;
  },
  updated() {},
  async mounted() {
    this.searchQuery = this.searchInput;
  },
  watch: {
    '$route.query.q'() {
      this.searchQuery = this.$route.query.q;
    },
    clearSearch() {
      this.resetBar();
    },
  },
  methods: {
    isEmpty,
    async resetBar() {
      this.searchQuery = '';
      let query = {};
      if (this.$route.query.f) {
        console.log(this.$route.query.f);
        query = { ...query, f: this.$route.query.f };
      }
      //Why did we have this if?
      //if (!isEmpty(query)) {
      await this.$router.push({ path: this.searchPath, query });
      //}
    },
    async searchInputField(e) {
      if (typeof e === 'string') {
        this.searchQuery = e;
      } else {
        this.searchQuery = e.target?.value;
      }
      await this.doSearch();
    },
    updateSearchInput(e) {
      if (typeof e === 'string') {
        this.searchQuery = e;
      }
      this.$emit('updateSearchInput', this.searchQuery);
    },
    async doSearch() {
      let query = {
        q: this.searchQuery,
      };
      if (this.$route.query.f) {
        query = { ...query, f: this.$route.query.f };
      }
      this.$emit('basicSearch', {});
      // await this.$router.push({path: this.path, query});
    },
    showAdvancedSearch() {
      this.$emit('advanced-search');
    },
  },
  data() {
    return {
      siteName: this.$store.state.configuration.ui.siteName,
      siteNameX: this.$store.state.configuration.ui.siteNameX || '',
      searchQuery: '',
      items: [],
      scrollId: '',
      showFieldSearch: false,
      operator: 'must',
      searchFields: {},
    };
  },
};
</script>
