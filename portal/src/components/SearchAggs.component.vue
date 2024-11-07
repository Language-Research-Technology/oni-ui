<template>
  <div class="border-t-2">
    <el-pagination class="items-center"
                   v-model:currentPage="currentPage"
                   v-model:page-size="pageSize"
                   layout="prev, pager, next"
                   :total="filteredValues.length || 0"
                   @current-change="updatePages"
                   :hide-on-single-page="true"/>
    <el-input class="pt-1"
              v-model="filter"
              :placeholder="'Filter'"
              clearable
              @input="updatePages(1)"
    />
    <li class="m-2 mt-4 cursor-pointer"
        v-for="ag in filteredValues?.slice(this.pageStartIndex, this.pageStartIndex + this.pageSize)"
    >
      <div class="form-check form-check-inline cursor-pointer">
        <input :id="aggsName + '_' + ag.key" :name="aggsName + '_' + ag.key" v-model="checkedBuckets"
               v-on:change="onChange"
               class="cursor-pointer form-check-input h-4 w-4 border border-gray-300 rounded-sm bg-white checked:bg-blue-600 checked:border-blue-600 focus:outline-none transition duration-200 mt-1 align-top bg-no-repeat bg-center bg-contain float-left mr-2 cursor-pointer"
               type="checkbox" :value="ag.key">
        <label class="cursor-pointer form-check-label text-gray-800" :for="aggsName + '_' + ag.key">
          {{ ag.key }} <span
            class="text-xs rounded-full w-32 h-32 text-white bg-purple-500 p-1">{{ ag['doc_count'] }}</span>
        </label>
      </div>
    </li>
  </div>
</template>
<script>
export default {
  props: ['aggsName', 'buckets'],
  watch: {
    '$route.query.f'() {
      this.updateFilters();
    },
  },
  async mounted() {
    await this.updateFilters();
  },
  updated() {
    if (this.checkedBuckets.length > 0) {
      this.$emit('is-active');
    }
  },
  methods: {
    clear() {
      this.checkedBuckets = [];
    },
    updateFilters() {
      let queryFilters = {};
      if (this.$route.query.f) {
        const filters = this.$route.query.f;
        const decodedFilters = decodeURIComponent(filters);
        try {
          queryFilters = JSON.parse(decodedFilters);
        } catch (e) {
          console.error('updatedFilters error:');
          console.error(e);
        }
      }
      const qfFound = Object.keys(queryFilters).find((qF) => qF === this.aggsName);
      if (!qfFound) {
        this.checkedBuckets = [];
      } else {
        for (const [key, val] of Object.entries(queryFilters)) {
          if (key === this.aggsName) {
            this.checkedBuckets = val;
          }
        }
        if (this.checkedBuckets.length > 0) {
          this.$emit('is-active');
        }
      }
    },
    async onChange() {
      const query = {};
      if (this.$route.query.q) {
        query.q = this.$route.query.q;
      }
      if (this.$route.query.f) {
        const filters = this.$route.query.f;
        const decodedFilters = decodeURIComponent(filters);
        const queryFilters = JSON.parse(decodedFilters);
        const checkedBuckets = [];
        if (this.checkedBuckets.length > 0) {
          for (const cB of this.checkedBuckets) {
            checkedBuckets.push(cB);
          }
        }
        queryFilters[this.aggsName] = checkedBuckets;
        const encodedFilters = encodeURIComponent(JSON.stringify(queryFilters));
        query.f = encodedFilters;
      } else {
        const queryFilters = {};
        for (const checkedBucket of this.checkedBuckets) {
          if (!queryFilters[this.aggsName]) {
            queryFilters[this.aggsName] = [];
          }
          queryFilters[this.aggsName].push(checkedBucket);
        }
        const encodedFilters = encodeURIComponent(JSON.stringify(queryFilters));
        query.f = encodedFilters;
      }
      if (this.checkedBuckets.length > 0) {
        this.$emit('is-active');
      }
      this.$emit('changed-aggs', { query, aggsName: this.aggsName });
      // await this.$router.push({path: 'search', query});
    },
    updatePages(page) {
      this.pageStartIndex = (page - 1) * this.pageSize;
    },
  },
  computed: {
    filteredValues() {
      return this.buckets.filter((v) => {
        return v.key.match(new RegExp(this.filter, 'i'));
      });
    },
  },
  data() {
    return {
      checkedBuckets: [],
      pageStartIndex: 0,
      filter: undefined,
      currentPage: 1,
      pageSize: 5,
    };
  },
};
</script>
