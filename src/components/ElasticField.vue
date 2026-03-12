<script setup lang="ts">
import { computed } from 'vue';

import MetaField from '@/components/MetaField.vue';
import LeafletMap from '@/components/widgets/LeafletMap.vue';

import { ui } from '@/configuration';
import { formatDuration, formatFileSize, shortenText } from '@/tools';

const props = defineProps<{
  // biome-ignore lint/suspicious/noExplicitAny: FIXME
  field: any;
  title: string;
}>();

const { expand = [], byteFields = [], durationFields = [] } = ui.main;

const testURL = (url: string) => {
  if (url?.startsWith?.('http')) {
    //TODO: make this a real url test
    return url;
  }
};

const isIdentifier = (item: object) =>
  '@type' in item && item['@type'] === 'PropertyValue' && 'name' in item && 'value' in item;

const isLanguage = (item: object) => '@type' in item && item['@type'] === 'Language' && 'name' in item;

const derived = computed(() => {
  const field = props.field;
  const title = props.title;

  let name = '';
  let url: string | undefined;
  let id: string | undefined;
  let description: string | undefined;
  // biome-ignore lint/suspicious/noExplicitAny: FIXME
  let geometry: any;
  // biome-ignore lint/suspicious/noExplicitAny: FIXME
  let expandField: any;
  let identifier: string | undefined;

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
  } else if (isLanguage(field)) {
    name = field.name;
    if ('code' in field) {
      name += ` (${field.code})`;
    }
    url = testURL(field['@id']);
  } else if (Array.isArray(field) && typeof field[0] === 'string') {
    name = String(field[0]);
  } else {
    url = testURL(field['@id']);
    name = Array.isArray(field.name) ? field.name[0] : field.name || field['@id'];
    description = Array.isArray(field.description) ? field.description[0] : field.description;

    if (title === 'contentLocation') {
      geometry = field.geo;
    } else if (expand.includes(title)) {
      expandField = { name: title, data: field };
    }
  }

  const collapseName = shortenText(name);

  return { name, url, id, description, geometry, expandField, identifier, collapseName };
});
</script>

<template>
  <template v-if="derived.identifier">
    <div class="space-y-2">
      <span class="font-medium">{{ derived.identifier }}:</span>
      <span class="ml-2">{{ derived.name }}</span>
    </div>
  </template>

  <template v-else-if="derived.expandField">
    <el-collapse>
      <el-collapse-item :title="derived.collapseName" :name="derived.collapseName">
        <MetaField :meta="derived.expandField" :isExpand="true" />
      </el-collapse-item>
    </el-collapse>
  </template>

  <template v-else-if="derived.geometry">
    <LeafletMap class="h-72 flex grow min-w-50 mr-4" :modelValue="derived.geometry" :enableDrawing="false" />
    <p class="text-sm">This map is not designed or suitable for Native Title research.</p>
  </template>

  <template v-else-if="derived.url">
    <a class="wrap-break-word underline text-blue-600 hover:text-blue-800 visited:text-purple-600" :href="derived.url"
      target="_blank" rel="nofollow noreferrer">
      <span class="break-all">
        {{ derived.name || derived.id }}
      </span>
    </a><br />
  </template>

  <template v-else>
    <p class="whitespace-pre-wrap">
      {{ derived.name || derived.id }}
      <el-tooltip v-if="derived.description" class="box-item" effect="light" trigger="click"
        :content="derived.description" placement="top">
        <el-button size="small" link>
          <font-awesome-icon icon="fa-solid fa-circle-info" />
        </el-button>
      </el-tooltip>
    </p>
  </template>
</template>

<style>
.el-collapse-item__title {
  font-weight: normal;
  font-size: var(--el-font-size-medium);
}
</style>
