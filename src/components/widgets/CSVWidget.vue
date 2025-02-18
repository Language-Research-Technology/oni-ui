<script setup lang="ts">
import Papa from 'papaparse';

const { data, limitText } = defineProps<{ data: string; limitText?: number }>();

const csv = {
  cols: [] as string[],
  data: [] as Record<string, string>[],
};
let loadedCsv = false;

const content = limitText ? data.slice(0, limitText) : data;

const parsedCsv = Papa.parse<string[]>(content);
if (parsedCsv?.data?.length > 1) {
  //Guess that the first elements are the headers. Then shift the array.
  csv.cols = parsedCsv.data[0];
  parsedCsv.data.shift();
  csv.data = parsedCsv.data.map((r) => {
    const row: Record<string, string> = {};
    for (let [index, col] of csv.cols.entries()) {
      if (typeof col === 'undefined' || col === '') {
        col = '__nocolumn__';
      }
      row[col] = r[index];
    }
    return row;
  });

  loadedCsv = true;
}
</script>

<template>
  <el-table v-if="loadedCsv" :data="csv.data" style="width: 100%">
    <el-table-column v-for="guessedColumn of csv.cols" :prop="guessedColumn" :label="guessedColumn"></el-table-column>
  </el-table>
  <div v-else>{{ content }}</div>
</template>
