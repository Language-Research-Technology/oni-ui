<script setup lang="ts">
const { field, routePath } = defineProps<{
  field: { id: string; name: string; identifiers?: { shortIdentifier: string } };
  routePath: string;
}>();

const id = field.id;
const link = `/${routePath}?id=${encodeURIComponent(id)}`;
const label = field.identifiers?.shortIdentifier
  ? `${field.identifiers.shortIdentifier} - ${field.name || field.id}`
  : field.name || field.id;
</script>

<template>
  <p>
    <el-link type="primary">
      <router-link :to="link">
        {{ label }}
      </router-link>
    </el-link>
  </p>
</template>
