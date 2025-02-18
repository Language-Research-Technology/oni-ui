<script setup lang="ts">
const { memberOf, routePath } = defineProps<{
  memberOf: { name?: string; '@id': string };
  routePath: string;
}>();

const link = `/${routePath}?id=${encodeURIComponent(memberOf['@id'])}`;
</script>

<template>
  <el-card :body-style="{ padding: '0px' }" class="mx-10 p-5">
    <h5 class="text-2xl font-medium ">Member Of</h5>
    <hr class="divider divider-gray pt-2" />
    <ul>
      <li class="font-semibold">
        <el-link :underline="true" type="primary" :href="link">
          {{ memberOf.name || memberOf['@id'] }}
        </el-link>
      </li>
    </ul>
  </el-card>
</template>
