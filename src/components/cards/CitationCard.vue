<script setup lang="ts">
import { ref } from 'vue';
import { useI18n } from 'vue-i18n';

import type { RoCrate } from '@/services/api';
import { first } from '@/tools';

const { t } = useI18n();

const { metadata } = defineProps<{
  metadata: RoCrate;
}>();

import { ui } from '@/configuration';

const {
  citeData: {
    help: { text: citeDataText },
  },
} = ui;

const dialogVisible = ref(false);

const suggestedCitation = () => {
  if (!metadata.creditText?.length) {
    return '';
  }

  const result = metadata.creditText.join('<br><br>');

  return result;
};

const bibliography = () => {
  let author = '';

  if (metadata.author?.length) {
    author = `<b>${t('citation.author')}</b> ${metadata.author
      .map((a) => first(a.name))
      .filter(Boolean)
      .join(', ')}`;
  } else if (metadata.creator?.length) {
    author = `<b>${t('citation.creator')}</b> ${metadata.creator
      .map((a) => first(a.name))
      .filter(Boolean)
      .join(', ')}`;
  } else {
    author = `<b>${t('citation.author')}</b> undefined`;
  }

  const title = `<b>${t('citation.titleField')}</b> ${first(metadata.name)}`;
  const publishedDate = `<b>${t('citation.date')}</b> ${first(metadata.datePublished)}`;
  const publisher = `<b>${t('citation.publisher')}</b> ${ui.title}`;
  const url = `<b>${t('citation.locator')}</b> ${decodeURIComponent(window.location.href)}`;
  const identifier = `<b>${t('citation.identifier')}</b> ${first(metadata.doi) || metadata['@id']}`;
  const accessDate = `<b>${t('citation.accessDate')}</b> ${new Date().toISOString().split('T')[0]}`;

  const variables = [author, title, publishedDate, publisher, url, identifier, accessDate];

  const result = variables.filter((value) => !String(value).includes('undefined')).join(', ');

  return result;
};
</script>

<template>
  <el-card class="mx-10">
    <h5 class="text-2xl font-medium">{{ t('citation.title') }}
      <el-tooltip class="box-item" effect="light" trigger="hover" :content="t('citation.tooltip')" placement="top">
        <font-awesome-icon icon="fa-solid fa-circle-info" class="ml-2 cursor-pointer" size="xs" color="gray" />
      </el-tooltip>
    </h5>

    <hr class="divider divider-gray pt-2" />

    <div v-if="metadata.creditText?.length">
      <p>{{ suggestedCitation() }}</p>
    </div>

    <el-link plain @click="dialogVisible = true" type="primary">
      {{ t('citation.showAllDetails') }}
    </el-link>

    <el-dialog v-model="dialogVisible" :title="t('citation.title')" width="40%" body-class="flex flex-col gap-4">
      <div v-if="metadata.creditText?.length" class="flex flex-col gap-4">
        <h4 class="text-1xl font-medium">
          {{ t('citation.suggestedCitation') }}
        </h4>
        <div v-html="suggestedCitation()" />
        <hr class="divider divider-gray " />
      </div>

      <h4 class="text-1xl font-medium">
        {{ t('citation.bibliographicElements') }}
      </h4>

      <div v-html="bibliography()"></div>

      <hr class="divider divider-gray" />

      <h4 class="text-1xl font-medium">
        {{ t('citation.furtherInformation') }}
      </h4>

      <p>
        {{ t('citation.formatExplanation') }}
      </p>

      <div class="pt-4" v-html="citeDataText" v-if="citeDataText" />
    </el-dialog>
  </el-card>
</template>
