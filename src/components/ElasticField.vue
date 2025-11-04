<script setup lang="ts">
import MetaField from '@/components/MetaField.vue';
import LeafletMap from '@/components/widgets/LeafletMap.vue';

const { field, title } = defineProps<{
  // biome-ignore lint/suspicious/noExplicitAny: FIXME
  field: any;
  title: string;
}>();

import { ui } from '@/configuration';
import { formatDuration, formatFileSize, shortenText } from '@/tools';

const { expand = [], byteFields = [], durationFields = [] } = ui.main;

let id: string;
let url: string | undefined;
let name: string;
let description: string;
// biome-ignore lint/suspicious/noExplicitAny: FIXME
let geometry: any;
// biome-ignore lint/suspicious/noExplicitAny: FIXME
let expandField: any;
let identifier: string | undefined;

const testURL = (url: string) => {
  if (url?.startsWith?.('http')) {
    //TODO: make this a real url test
    return url;
  }
};

const isIdentifier = (item: object) =>
  '@type' in item && item['@type'] === 'PropertyValue' && 'name' in item && 'value' in item;

if (typeof field === 'undefined') {
  name = '';
} else if (byteFields.includes(title)) {
  name = formatFileSize(field);
} else if (durationFields.includes(title) && typeof field === 'number') {
  name = formatDuration(field);
} else if (['string', 'number'].includes(typeof field)) {
  name = String(field);
} else if (isIdentifier(field)) {
  identifier = field.name;
  name = field.value;
} else if (Array.isArray(field) && typeof field[0] === 'string') {
  name = String(field[0]);
} else {
  id = field['@id'];
  url = testURL(id);
  name = Array.isArray(field.name) ? field.name[0] : field.name;
  description = Array.isArray(field.description) ? field.description[0] : field.description;

  if (title === 'contentLocation') {
    geometry = field.geo;
  } else if (expand.includes(title)) {
    expandField = { name: title, data: field };
  }
}

const collapseName = shortenText(name);
</script>

<template>
  <template v-if="identifier">
    <div class="space-y-2">
      <span class="font-medium">{{ identifier }}:</span>
      <span class="ml-2">{{ name }}</span>
    </div>
  </template>

  <template v-else-if="expandField">
    <el-collapse>
      <el-collapse-item :title="collapseName" :name="collapseName">
        <MetaField :meta="expandField" :isExpand="true" />
      </el-collapse-item>
    </el-collapse>
  </template>

  <template v-else-if="geometry">
    <LeafletMap class="h-72 flex grow min-w-[200px] mr-4" :modelValue="geometry" :enableDrawing="false" />
    <p class="text-sm">This map is not designed or suitable for Native Title research.</p>
  </template>

  <template v-else-if="url">
    <a class="wrap-break-word underline text-blue-600 hover:text-blue-800 visited:text-purple-600" :href="id"
      target="_blank" rel="nofollow noreferrer">
      <span class="break-all">
        {{ name || id }}
      </span>
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
