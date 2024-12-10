<script setup lang="ts">
const { field, routePath } = defineProps<{
  field: { id: string; name: string };
  routePath: string;
}>();

const id = field.id;
const link = `/${routePath}?id=${encodeURIComponent(id)}`;
</script>

<template>
  <p>
    <el-link type="primary" :href="link">
      {{ field.name || field.id }}
    </el-link>
  </p>
</template>
