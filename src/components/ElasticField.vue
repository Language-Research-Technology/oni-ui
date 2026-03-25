<script setup lang="ts">
import { computed } from 'vue';

import MetaField from '@/components/MetaField.vue';
import LeafletMap from '@/components/widgets/LeafletMap.vue';

import { ui } from '@/configuration';
import { first, formatDuration, formatFileSize, joinAll, shortenText } from '@/tools';

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

const hasType = (item: object, typeName: string) =>
  '@type' in item && Array.isArray(item['@type']) && item['@type'].includes(typeName);

const isIdentifier = (item: object) => hasType(item, 'PropertyValue') && 'name' in item && 'value' in item;

const isLanguage = (item: object) => hasType(item, 'Language') && 'name' in item;

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
    identifier = first(field.name);
    name = first(field.value);
  } else if (isLanguage(field)) {
    name = joinAll(field.name);
    if ('code' in field) {
      name += ` (${joinAll(field.code, ', ')})`;
    }
    url = testURL(field['@id']);
  } else if (Array.isArray(field) && typeof field[0] === 'string') {
    name = field.join(' | ');
  } else {
    url = testURL(field['@id']);
    name = joinAll(field.name) || field['@id'];
    description = joinAll(field.description, '\n\n');

    if (title === 'contentLocation') {
      geometry = first(field.geo);
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
