<template>
  <el-table v-if="loadCsv" :data="csv.data" style="width: 100%">
    <el-table-column v-for="guessedColumn of csv.cols"
                     :prop="guessedColumn" :label="guessedColumn"></el-table-column>
  </el-table>
  <div v-else>{{ this.content }}</div>
</template>
<script>
import 'element-plus/theme-chalk/display.css';
import { first, isUndefined } from 'lodash';

export default {
  props: ['data', 'limitText'],
  data() {
    return {
      content: Object,
      csv: Object,
      errorMessage: '',
      loading: false,
      loadCsv: false,
    };
  },
  mounted() {
    try {
      if (this.limitText) {
        this.content = this.data.slice(0, this.limitText);
      } else {
        this.content = this.data;
      }
      const parsedCsv = this.$papa.parse(this.content);
      if (parsedCsv?.data && parsedCsv?.data?.length > 1) {
        //Guess that the first elements are the headers. Then shift the array.
        this.csv.cols = first(parsedCsv.data);
        parsedCsv.data.shift();
        this.csv.data = parsedCsv.data.map((r) => {
          const row = {};
          for (let [index, col] of this.csv.cols.entries()) {
            if (isUndefined(col) || col === '') {
              col = '__nocolumn__';
            }
            row[col] = r[index];
          }
          return row;
        });

        this.loadCsv = true;
      } else {
        this.loadCsv = false;
      }
    } catch (e) {
      this.errorMessage = 'Cannot automatically convert to csv.';
      console.log(e);
      this.loading = false;
    }
  },
};
</script>