<script setup lang="ts">
import type { EntityType } from '@/services/api';

const { entity } = defineProps<{
  entity: EntityType | undefined;
}>();

const getSearchUrl = (filterName: string, filterValue: string) => {
  const f = {
    root: [entity?.name],
    [filterName]: filterValue,
  };
  const stringify = JSON.stringify(f);

  return `/search?f=${encodeURIComponent(encodeURIComponent(stringify))}`;
};
</script>

<template>
  <ul v-if="entity">
    <template v-if="entity.language">
      <li><span class="font-semibold">Language</span></li>
      <li v-for="language in entity.language" class="ml-4 pl-2">{{ language }}</li>
    </template>

    <template v-if="entity.communicationMode && entity.communicationMode.length">
      <li><span class="font-semibold">Comunication Mode</span></li>
      <li v-for="communicationMode in entity.communicationMode" class="ml-4 pl-2">
        <el-link underline="always" type="primary">
          <router-link :to="getSearchUrl('communicationMode', communicationMode)">
            {{ communicationMode }}
          </router-link>
        </el-link>
      </li>
    </template>

    <template v-if="entity.mediaType">
      <li><span class="font-semibold">File Formats</span></li>
      <li v-for="mediaType in entity.mediaType" class="ml-4 pl-2">
        <el-link underline="always" type="primary">
          <router-link :to="getSearchUrl('mediaType', mediaType)">
            {{ mediaType }}
          </router-link>
        </el-link>
      </li>
    </template>
  </ul>
</template>
