<script setup lang="ts">
import Papa from 'papaparse';

import { ref } from 'vue';

const isLoading = ref(true);

const { src, limitRows } = defineProps<{ src: string; limitRows?: number }>();

type CsvData = {
  cols: string[];
  data: Record<string, string>[];
};
const csv = ref<CsvData>({ cols: [], data: [] });

const doWork = async () => {
  isLoading.value = true;

  Papa.parse<string[]>(src, {
    download: true,
    complete: (results) => {
      //Guess that the first elements are the headers. Then shift the array.
      csv.value.cols = results.data.shift() || [];

      const data = limitRows ? results.data.slice(0, limitRows) : results.data;

      csv.value.data = data.map((r) => {
        const row: Record<string, string> = {};
        for (let [index, col] of csv.value.cols.entries()) {
          if (typeof col === 'undefined' || col === '') {
            col = '__nocolumn__';
          }
          row[col] = r[index];
        }
        return row;
      });
    },
  });

  isLoading.value = false;
};

doWork();
</script>

<template>
  <el-table v-loading="isLoading" :data="csv.data" style="width: 100%">
    <el-table-column v-for="guessedColumn of csv.cols" :prop="guessedColumn" :label="guessedColumn"></el-table-column>
  </el-table>
</template>
