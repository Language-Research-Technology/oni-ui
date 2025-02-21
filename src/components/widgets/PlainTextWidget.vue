<script setup lang="ts">
const { data, limitText } = defineProps<{
  data: string;
  limitText?: number;
}>();

const content = limitText ? data.slice(0, limitText) : data;
</script>

<template>
  <div class="whitespace-pre-wrap bg-slate-50">{{ content }}</div>
</template>
