<script setup lang="ts">
import MetaField from '@/components/MetaField.vue';
import LeafletMap from '@/components/widgets/LeafletMap.vue';

const { field, title } = defineProps<{
  // biome-ignore lint/suspicious/noExplicitAny: FIXME
  field: any;
  title: string;
}>();

import { configuration } from '@/configuration';

const { ui } = configuration;

const expand = ui.main.expand || [];

let id: string;
let url: string | undefined;
let name: string;
let description: string;
// biome-ignore lint/suspicious/noExplicitAny: FIXME
let geometry: any;
// biome-ignore lint/suspicious/noExplicitAny: FIXME
let expandField: any;

const testURL = (url: string) => {
  if (url?.startsWith?.('http')) {
    //TODO: make this a real url test
    return url;
  }
};

const formatFileSize = (bytes: number, locales = 'en') => {
  const units = ['B', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
  const threshold = 1024;

  if (bytes < threshold) return `${bytes} B`;

  const i = Math.floor(Math.log(bytes) / Math.log(threshold));
  const value = bytes / threshold ** i;

  const formatter = new Intl.NumberFormat(locales, { maximumFractionDigits: 2 });

  return `${formatter.format(value)} ${units[i]}`;
};

const extractData = () => {
  if (title === 'size') {
    name = formatFileSize(field);

    return;
  }

  if (['string', 'number'].includes(typeof field)) {
    name = String(field);

    return;
  }

  id = field['@id'];
  url = testURL(id);
  name = field.name;
  description = field.description;

  if (title === 'contentLocation') {
    geometry = field.geo;

    return;
  }

  if (expand.includes(title)) {
    expandField = { name: title, data: field };

    return;
  }
};

extractData();
</script>

<template>
  <template v-if="expandField">
    <el-collapse>
      <el-collapse-item :title="name" :name="name">
        <MetaField :meta="expandField" :isExpand="true" />
      </el-collapse-item>
    </el-collapse>
  </template>

  <template v-else-if="geometry">
    {{ geometry.asWKT }}
    <LeafletMap class="h-72 flex grow min-w-[200px] mr-4" :modelValue="geometry" :enableDrawing="false" />
    <p class="text-sm">This map is not designed or suitable for Native Title research.</p>
  </template>

  <template v-else-if="url">
    <a class="break-words underline text-blue-600 hover:text-blue-800 visited:text-purple-600 absolute" :href="id"
      target="_blank" rel="nofollow noreferrer">
      <manku-icon :name="title" height="30">
        <template #notFound>
          <span class="break-all">
            {{ name || id }}
          </span>
        </template>
      </manku-icon>
    </a><br />
  </template>

  <template v-else>
    <p>
      {{ name || id }}
      <el-tooltip v-if="description" class="box-item" effect="light" trigger="click" :content="description"
        placement="top">
        <el-button size="small" link>
          <font-awesome-icon icon="fa-solid fa-circle-info" />
        </el-button>
      </el-tooltip>
    </p>
  </template>
</template>
