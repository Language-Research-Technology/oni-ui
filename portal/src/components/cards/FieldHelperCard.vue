<script setup lang="ts">
import { ref } from 'vue';

import { useConfigurationStore } from '@/stores/configuration';

const { meta } = defineProps<{
  meta: { id: string; display?: string };
}>();

const {
  ui: { baseVocab },
} = useConfigurationStore();

const loading = ref(false);

const id = ref('');
const url = ref('');
const definition = ref('');

const searchMetaField = async () => {
  loading.value = true;

  if (meta.id) {
    id.value = `${baseVocab}${meta.id}`;
    // FIXME
    // FIXME
    // FIXME
    // FIXME
    // const content = await this.$elasticService.single({ index: 'vocabs', _id: id });
    // if (content?._source) {
    //   const source = content._source;
    //   definition = source?.['rdfs:comment'];
    //   url = id;
  } else {
    id.value = `schema:${meta.id}`;
    //   const content = await this.$elasticService.single({ index: 'vocabs', _id: id });
    //   if (content?._source) {
    //     const source = content._source;
    //     definition = source?.['rdfs:comment'];
    //     url = `http://schema.org/${meta.id}`;
    //   }
  }
  loading.value = false;
};
</script>

<template>
  <el-popover placement="right" trigger="click" :width="400"
    popper-style="box-shadow: rgb(14 18 22 / 35%) 0px 10px 38px -10px, rgb(14 18 22 / 20%) 0px 10px 20px -15px; padding: 20px;"
    @show="searchMetaField" :persistent="false">
    <template #reference>
      <el-button size="small" link type="" class="text-xs">
        <font-awesome-icon icon="fa-solid fa-circle-question" />
      </el-button>
    </template>

    <template #default>
      <div :body-style="{ padding: '0px' }" class="grid">
        <h4 class="text-3xl font-normal leading-normal mt-0">{{ meta?.display || meta?.id }}</h4>
        <el-divider />
        <div v-loading="loading">
          <p>{{ definition }}</p>
          <p>
            <el-link type="primary" :href="url" target="_blank" rel="nofollow noreferrer">
              {{ url }}
            </el-link>
          </p>
        </div>

      </div>
    </template>
  </el-popover>
</template>
