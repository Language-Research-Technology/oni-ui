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
    <el-link type="primary">
      <router-link :to="link">
        {{ field.name || field.id }}
      </router-link>
    </el-link>
  </p>
</template>
