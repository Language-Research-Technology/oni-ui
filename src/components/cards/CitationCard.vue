<script setup lang="ts">
import { ref } from 'vue';

import type { RoCrate } from '@/services/api';

const { metadata } = defineProps<{
  metadata: RoCrate;
}>();

import { configuration } from '@/configuration';

const {
  ui: {
    citeData: {
      help: { text: citeDataText },
    },
  },
} = configuration;

const dialogVisible = ref(false);

const suggestedCitation = () => {
  if (!metadata.creditText) {
    return '';
  }

  const texts = Array.isArray(metadata.creditText) ? metadata.creditText : [metadata.creditText];
  const result = texts.join('<br><br>');

  return result;
};

const bibliography = () => {
  let author = '';

  if (metadata.author) {
    const mdAuthors = Array.isArray(metadata.author) ? metadata.author : [metadata.author];
    author = `<b>Author:</b> ${mdAuthors
      .map((a) => a.name)
      .filter(Boolean)
      .join(', ')}`;
  } else if (metadata.creator) {
    const mdCreators = Array.isArray(metadata.creator) ? metadata.creator : [metadata.creator];
    author = `<b>Creator:</b> ${mdCreators
      .map((a) => a.name)
      .filter(Boolean)
      .join(', ')}`;
  } else {
    author = `<b>Author:</b> undefined`;
  }

  const title = `<b>Title:</b> ${metadata.name}`;
  const publishedDate = `<b>Date:</b> ${metadata.datePublished}`;
  const publisher = `<b>Publisher:</b> ${configuration.ui.title}`;
  const url = `<b>Locator:</b> ${decodeURIComponent(window.location.href)}`;
  const identifier = `<b>Identifier:</b> ${metadata.doi || metadata['@id']}`;
  const accessDate = `<b>Access Date:</b> ${new Date().toISOString().split('T')[0]}`;

  const variables = [author, title, publishedDate, publisher, url, identifier, accessDate];

  const result = variables.filter((value) => !String(value).includes('undefined')).join(', ');

  return result;
};
</script>

<template>
  <el-card class="mx-10">
    <h5 class="text-2xl font-medium">Citation</h5>

    <hr class="divider divider-gray pt-2" />

    <el-link plain @click="dialogVisible = true" type="primary">
      View citation details for this item
    </el-link>

    <el-dialog v-model="dialogVisible" title="Citation" width="40%" body-class="flex flex-col gap-4">
      <div v-if="metadata.creditText" class="flex flex-col gap-4">
        <h4 class="text-1xl font-medium">
          Suggested Citation
        </h4>
        <div v-html="suggestedCitation()" />
        <hr class="divider divider-gray " />
      </div>

      <h4 class="text-1xl font-medium">
        Elements for a Bibliographic Reference
      </h4>

      <div v-html="bibliography()"></div>

      <hr class="divider divider-gray" />

      <h4 class="text-1xl font-medium">
        Further Information
      </h4>

      <p>
        The <i>Elements for a Bibliographic Reference</i> information above is not in any specific format or
        style, but is meant to provide the
        essential citation elements for a minimal bibliographic reference.
      </p>

      <div class="pt-4" v-html="citeDataText" v-if="citeDataText" />
    </el-dialog>
  </el-card>
</template>
