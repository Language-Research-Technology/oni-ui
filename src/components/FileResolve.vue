<script setup lang="ts">
import { inject, ref, watch } from 'vue';
import AccessHelper from '@/components/AccessHelper.vue';
import CSVWidget from '@/components/widgets/CSVWidget.vue';
import PDFWidget from '@/components/widgets/PDFWidget.vue';
import PlainTextWidget from '@/components/widgets/PlainTextWidget.vue';
import type { ApiService, EntityType, RoCrate } from '@/services/api';

const api = inject<ApiService>('api');
if (!api) {
  throw new Error('API instance not provided');
}

const {
  id,
  parentId,
  filename,
  resolve,
  encodingFormat,
  hideOpenLink = false,
  isPreview,
  access,
  license,
} = defineProps<{
  id: string;
  parentId: string;
  filename: string;
  resolve: boolean;
  encodingFormat: string[];
  hideOpenLink?: boolean;
  isPreview: boolean;
  access: EntityType['access'];
  license: RoCrate['license'];
}>();

const data = ref();
const downloadUrl = ref('');
const streamUrl = ref('');
const togglePreview = ref(false);

const fileUrl = `/file?id=${encodeURIComponent(id)}&parentId=${encodeURIComponent(parentId)}`;

const resolveFile = async () => {
  downloadUrl.value = (await api.getFileUrl(parentId, filename, true)) || '';
  streamUrl.value = (await api.getFileUrl(parentId, filename, false)) || '';

  // Try to display only text and pdfs by default if there is an encodingFormat
  if (encodingFormat.some((format) => String(format).match(/text\/|pdf/))) {
    togglePreview.value = true;
  }

  if (!isPreview) {
    togglePreview.value = true;
  }
};

const extension = filename.split('.').pop() || '';
console.log('🪚 encodingFormat.filter:', JSON.stringify(encodingFormat, null, 2));
const plainEncodingFormats = encodingFormat.filter((ef) => typeof ef === 'string');
const isCsv = plainEncodingFormats.some((ef) => ef.endsWith('csv')) || extension === 'csv';
const isTxt =
  plainEncodingFormats.some((ef) => ef.startsWith('text')) || ['txt', 'eaf', 'html', 'xml', 'flab'].includes(extension);
const isPdf = plainEncodingFormats.some((ef) => ef.endsWith('pdf')) || extension === 'pdf';

watch(
  () => resolve,
  async () => {
    if (resolve) {
      resolveFile();
    }
  },
);

if (resolve) {
  resolveFile();
}
</script>

<template>
  <el-col>
    <el-row justify="center">
      <el-col>
        <div class="container max-screen-lg mx-auto">
          <div v-if="!togglePreview" class="flex justify-center w-full">
            <el-button size="large" round @click="togglePreview = true">Preview File
            </el-button>
          </div>

          <div v-if="togglePreview">
            <div>
              <div v-if="isPdf" class="flex justify-center w-full">
                <el-row :span="24">
                  <PDFWidget :src="streamUrl" :numPages="isPreview ? 1 : undefined" />
                </el-row>
              </div>

              <div v-else-if="isCsv" class="p-4 break-words">
                <CSVWidget :src="streamUrl" :limitRows="isPreview ? 5 : undefined" />
              </div>

              <div v-else-if="isTxt" class="p-4 break-words">
                <PlainTextWidget :src="streamUrl" :limitText="isPreview ? 700 : undefined" />
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
              <div class="flex justify-center" v-if="access && license">
                <AccessHelper :access="access" :license="license" />
              </div>
            </div>
          </div>
        </div>
      </el-col>
    </el-row>

    <el-row class="flex justify-center" v-if="access.content">
      <el-button-group class="m-2">
        <router-link v-if="!hideOpenLink" class="mr-2" :to="fileUrl" underline="never">
          <el-button type="default" class="px-2">View File</el-button>
        </router-link>

        <el-link class="mr-2" :underline="false" :href="downloadUrl">
          <el-button type="default">Download File&nbsp;<font-awesome-icon icon="fa fa-download" />
          </el-button>
        </el-link>
      </el-button-group>
    </el-row>
  </el-col>
</template>
