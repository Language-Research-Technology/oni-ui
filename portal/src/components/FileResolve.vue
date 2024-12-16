<script setup lang="ts">
import { onMounted, ref, watch } from 'vue';
import { useRoute } from 'vue-router';

import { useGtm } from '@gtm-support/vue-gtm';

import AccessHelper from '@/components/AccessHelper.vue';
import CSVWidget from '@/components/widgets/CSVWidget.vue';
import PDFWidget from '@/components/widgets/PDFWidget.vue';
import PlainTextWidget from '@/components/widgets/PlainTextWidget.vue';

defineOptions({
  inheritAttrs: false,
});

const {
  id,
  resolve,
  encodingFormat,
  hideOpenLink = false,
  previewText,
  isPreview,
  access,
  license,
} = defineProps<{
  id: string;
  path: string;
  resolve: boolean;
  encodingFormat: string[];
  hideOpenLink?: boolean;
  previewText: string;
  isPreview: boolean;
  access: { hasAccess: boolean };
  license: { '@id': string; description: string };
}>();

const route = useRoute();
const gtm = useGtm();

const title = ref('');
const blobURL = ref('');
const data = ref();
const sourceType = ref('');
const path = ref('');
const parent = ref('');
const parentTitle = ref('');
const tryCSV = ref(false);
const isLoading = ref(true);
const error = ref('');
const type = ref('');
const apiRoute = ref('');
const fileUrl = ref('');
const togglePreview = ref(false);
const hidePreviewText = ref(true);
const forbidden = ref(false);

const resolveFile = async () => {
  path.value = id;
  apiRoute.value = `/object/open?id=${encodeURIComponent(id)}`;
  if (path.value !== '') {
    apiRoute.value += `&path=${encodeURIComponent(path.value)}`;
  }

  // Try to display only text and pdfs by default if there is an encodingFormat
  if (encodingFormat.some((format) => String(format).match(/text\/|pdf/))) {
    togglePreview.value = true;
  }
  if (!isPreview) {
    togglePreview.value = true;
  }

  if (togglePreview) {
    await tryDownloadBlob();
  }
};

const tryDownloadBlob = async () => {
  isLoading.value = true;

  // FIXME: dix type
  let responseBlob: Response;

  try {
    responseBlob = await http.get({ route: apiRoute.value });

    if (responseBlob.status !== 200) {
      if (responseBlob.status === 403) {
        forbidden.value = true;
        error.value = '';
      } else if (responseBlob.status === 404) {
        error.value = 'The file was not found in the path, please contact your Data Provider or Data Steward';
      } else {
        error.value = responseBlob.statusText;
      }

      isLoading.value = false;

      return;
    }
  } catch (e) {
    error.value = 'File Not Found';
    isLoading.value = false;

    return;
  }

  //TODO: get encodingFormat directly from the API and merge these two ifs
  //TODO: issue https://github.com/Language-Research-Technology/oni-ui/issues/46
  if (!encodingFormat) {
    if (
      path?.value.endsWith('.txt') ||
      path?.value.endsWith('.csv') ||
      path?.value.endsWith('.eaf') ||
      path?.value.endsWith('.html') ||
      path?.value.endsWith('.xml') ||
      path?.value.endsWith('.flab')
    ) {
      await loadTxt(responseBlob);
      isLoading.value = false;
    }

    return;
  }

  if (encodingFormat?.some((ef) => ef.startsWith('text/') || ef.endsWith('xml'))) {
    await loadTxt(responseBlob);
    isLoading.value = false;

    return;
  }

  try {
    data.value = await responseBlob.blob();
    blobURL.value = window.URL.createObjectURL(data.value);

    //TODO: https://github.com/Language-Research-Technology/oni-ui/issues/46
    if (path.value.endsWith('.mp3') || path.value.endsWith('.wav')) {
      type.value = 'audio';
      data.value = blobURL.value;
      hidePreviewText.value = true;
    } else if (path.value.endsWith('.mp4')) {
      type.value = 'video';
      sourceType.value = 'video/mp4';
      data.value = blobURL.value;
      hidePreviewText.value = true;
    } else if (path.value?.endsWith('.pdf')) {
      type.value = 'pdf';
      hidePreviewText.value = false;
    } else {
      type.value = 'other';
      data.value = blobURL.value;
      hidePreviewText.value = false;
    }
    isLoading.value = false;
  } catch (e) {
    const err = e as Error;
    error.value = err.message;
    isLoading.value = false;
  }
};

const downloadFileUrl = async () => {
  try {
    isLoading.value = true;

    const link = document.createElement('a');
    link.download = path.value;

    // FIXME Implement http
    const response = await http.get({ route: apiRoute.value });

    if (response.status !== 200) {
      error.value = 'Download Error';
      if (response.status === 403) {
        forbidden.value = true;
      }
      if (response.status === 404) {
        error.value = 'The file was not found in the path, please contact your Data Provider or Data Steward';
      } else {
        error.value = response.statusText;
      }
    } else {
      const data = await response.blob();
      link.href = window.URL.createObjectURL(data);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(link.href);

      gtm?.trackEvent({
        event: '/file-download',
        category: 'file',
        label: 'download-file',
        value: apiRoute.value,
      });
    }

    isLoading.value = false;
  } catch (e) {
    const err = e as Error;
    error.value = err.message;
    isLoading.value = false;
  }
};

const loadTxt = async (responseBlob: Response) => {
  type.value = 'txt';
  data.value = await responseBlob.text(); // { type: 'text/plain', endings: 'native' });
  if (path.value.endsWith('.csv')) {
    tryCSV.value = true;
  }
  hidePreviewText.value = false;
};

watch(
  () => resolve,
  async () => {
    if (resolve) {
      await resolveFile();
    }
  },
);

onMounted(async () => {
  if (resolve) {
    await resolveFile();
  }
});
</script>

<template>
  <el-row justify="center">
    <el-col>
      <div class="container max-screen-lg mx-auto">
        <div v-if="!togglePreview" class="flex justify-center w-full">
          <el-button size="large" round @click="tryDownloadBlob(); togglePreview = true">Preview File
          </el-button>
        </div>

        <div v-loading="isLoading" v-if="togglePreview">
          <div>
            <div v-if="type === 'pdf'" class="flex justify-center w-full">
              <el-row :span="24">
                <PDFWidget :blobURL="blobURL" :numPages="isPreview ? 1 : null" />
              </el-row>
            </div>
            <div class="p-4 break-words" v-else-if="type === 'txt'">
              <CSVWidget v-if="tryCSV" :data="data" :limitText="isPreview ? 500 : undefined" />
              <PlainTextWidget v-else :data="data" :limitText="isPreview ? 700 : undefined" />
            </div>
            <div class="flex justify-center" v-else-if="type === 'audio'">
              <audio controls preload="none">
                <source :src="data" :type="encodingFormat[0]?.['@value'] || ''">
                Your browser does not support the audio element.
              </audio>
            </div>
            <div class="flex justify-center" v-else-if="type === 'video'">
              <video controls>
                <source :src="data" :type="sourceType">
                Your browser does not support the video element.
              </video>
            </div>
            <div class="p-4" v-else>
              <img height="500px" :src="data" />
            </div>
          </div>
          <div>
            <div v-show="!isLoading" class="flex justify-center" v-if="forbidden && !access['hasAccess']">
              <AccessHelper :access="access" :license="license" />
            </div>
            <div v-show="!isLoading" class="flex justify-center" v-if="error">
              <p class="break-normal text-xl">{{ error }}</p>
            </div>
          </div>
          <div class="flex justify-center">
            <el-alert v-if="previewText && !hidePreviewText" :closable="false">{{
              previewText }}</el-alert>
          </div>
        </div>
        <div v-else class="p-2">
          <div v-show="!isLoading" class="flex justify-center" v-if="forbidden && !access['hasAccess']">
            <AccessHelper :access="access" :license="license" />
          </div>
          <div v-show="!isLoading" class="flex justify-center" v-if="error">
            <p class="break-normal text-xl">{{ error }}</p>
          </div>
        </div>
      </div>
    </el-col>
  </el-row>

  <el-row class="flex justify-center" v-show="!isLoading" v-if="access['hasAccess']">
    <el-button-group class="m-2">
      <el-link v-if="!hideOpenLink" class="mr-2" :href="fileUrl" :underline="false">
        <el-button type="default" class="px-2">View File</el-button>
      </el-link>
      <el-link class="mr-2" :underline="false" v-on:click="downloadFileUrl()">
        <el-button type="default">Download&nbsp;File&nbsp;<font-awesome-icon icon="fa fa-download" />
        </el-button>
      </el-link>
    </el-button-group>
  </el-row>
</template>
