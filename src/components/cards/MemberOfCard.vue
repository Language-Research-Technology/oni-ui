<script setup lang="ts">
const { memberOf, routePath } = defineProps<{
  memberOf: { name?: string; '@id': string };
  routePath: string;
}>();

const link = `/${routePath}?id=${encodeURIComponent(memberOf['@id'])}`;
</script>

<template>
  <el-card :body-style="{ padding: '0px' }" class="mx-10 p-5">
    <h5 class="text-2xl font-medium">Member Of
      <el-tooltip class="box-item" effect="light" trigger="hover" content="The collection or sub-collection the current item is a member of." placement="top">
        <font-awesome-icon icon="fa-solid fa-circle-info" class="ml-2 cursor-pointer" size="xs" color="gray"/>
      </el-tooltip>
    </h5>
    <hr class="divider divider-gray pt-2" />
    <ul>
      <li class="font-semibold">
        <el-link underline="always" type="primary" :href="link">
          {{ memberOf.name || memberOf['@id'] }}
        </el-link>
      </li>
    </ul>
  </el-card>
</template>
