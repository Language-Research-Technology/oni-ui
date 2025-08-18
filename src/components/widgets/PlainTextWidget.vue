<script setup lang="ts">
import { ref } from 'vue';

const { src, limitText } = defineProps<{
  src: string;
  limitText?: number;
}>();

const content = ref('');

const download = async () => {
  const response = await fetch(src);
  if (!response.ok) {
    content.value = 'Fetch failed';
  }

  const data = await response.text();

  content.value = limitText ? data.slice(0, limitText) : data;
};

download();
</script>

<template>
  <div class="whitespace-pre-wrap bg-slate-50">{{ content }}</div>
</template>
