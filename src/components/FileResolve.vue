<script setup lang="ts">
import { inject, ref } from 'vue';
import AccessHelper from '@/components/AccessHelper.vue';
import CSVWidget from '@/components/widgets/CSVWidget.vue';
import PDFWidget from '@/components/widgets/PDFWidget.vue';
import PlainTextWidget from '@/components/widgets/PlainTextWidget.vue';
import type { ApiService, EntityType, RoCrate } from '@/services/api';

const api = inject<ApiService>('api');
if (!api) {
  throw new Error('API instance not provided');
}

const { entity, metadata } = defineProps<{
  entity: EntityType;
  metadata: RoCrate['hasPart'][number] & { license?: RoCrate['license'] };
}>();

const data = ref();
const downloadUrl = ref('');
const streamUrl = ref('');

const resolveFile = async () => {
  if (entity.entityType !== 'http://schema.org/MediaObject') {
    return;
  }

  downloadUrl.value = (await api.getFileUrl(entity.fileId, metadata.filename, true)) || '';
  streamUrl.value = (await api.getFileUrl(entity.fileId, metadata.filename, false)) || '';
};

const extension = metadata.filename.split('.').pop() || '';
const encodingFormat = [metadata.encodingFormat].flat();
const plainEncodingFormats = encodingFormat.filter((ef) => typeof ef === 'string');
const isCsv = plainEncodingFormats.some((ef) => ef.endsWith('csv')) || extension === 'csv';
const isTxt =
  plainEncodingFormats.some((ef) => ef.startsWith('text')) || ['txt', 'eaf', 'html', 'xml', 'flab'].includes(extension);
const isPdf = plainEncodingFormats.some((ef) => ef.endsWith('pdf')) || extension === 'pdf';

resolveFile();
</script>

<template>
  <el-col>
    <el-row justify="center">
      <el-col>
        <div class="container max-screen-lg mx-auto">
          <div v-if="entity.access.content">
            <div v-if="isPdf" class="flex justify-center w-full">
              <el-row :span="24">
                <PDFWidget :src="streamUrl" />
              </el-row>
            </div>

            <div v-else-if="isCsv" class="p-4 wrap-break-word">
              <CSVWidget :src="streamUrl" />
            </div>

            <div v-else-if="isTxt" class="p-4 wrap-break-word">
              <PlainTextWidget :src="streamUrl" />
            </div>

            <div v-else-if="encodingFormat.some((f) => f?.startsWith('audio'))" class="flex justify-center">
              <audio controls preload="none">
                <source :src="streamUrl" :type="encodingFormat.find((f) => f.startsWith('audio'))">
                Your browser does not support the audio element.
              </audio>
            </div>

            <div v-else-if="encodingFormat?.some((f) => f?.startsWith('video'))" class="flex justify-center">
              <video controls>
                <source :src="streamUrl" :type="encodingFormat.find((f) => f.startsWith('video'))">
                Your browser does not support the video element.
              </video>
            </div>

            <div class="p-4" v-else>
              <img height="500px" :src="data" />
            </div>
          </div>

          <div>
            <div class="flex justify-center" v-if="entity.access">
              <AccessHelper :access="entity.access" :license="metadata.license" />
            </div>
          </div>
        </div>
      </el-col>
    </el-row>

    <el-row class="flex justify-center" v-if="entity.access.content">
      <el-button-group class="m-2">
        <el-link class="mr-2" underline="never" :href="downloadUrl">
          <el-button type="default">Download File&nbsp;<font-awesome-icon icon="fa fa-download" />
          </el-button>
        </el-link>
      </el-button-group>
    </el-row>
  </el-col>
</template>
