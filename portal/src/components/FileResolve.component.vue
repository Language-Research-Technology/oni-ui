<template>
  <el-row :justify="'center'" class="">
    <el-col>
      <div class="container max-screen-lg mx-auto">
        <div v-if="!togglePreview" class="flex justify-center w-full">
          <el-button size="large" round @click="tryDownloadBlob();togglePreview=true">Preview File
          </el-button>
        </div>
        <div v-loading="loading" v-if="togglePreview">
          <div>
            <div v-if="type === 'pdf'" class="flex justify-center w-full">
              <el-row :span="24">
                <PDFWidget :blobURL="this.blobURL" :numPages="isPreview ? 1 : null"/>
              </el-row>
            </div>
            <div class="p-4 break-words" v-else-if="type === 'txt'">
              <CSVWidget v-if="tryCSV" :data="data" :limitText="isPreview ? 500 : null"/>
              <PlainTextWidget v-else :data="data" :limitText="isPreview ? 700 : null"/>
            </div>
            <div class="flex justify-center" v-else-if="type === 'audio'">
              <audio controls preload="none">
                <source :src="data" :type="encodingFormat?.['@value'] || ''">
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
              <img height="500px" :src="data"/>
            </div>
          </div>
          <div>
            <div v-show="!loading" class="flex justify-center" v-if="forbidden && !access['hasAccess']">
              <AccessHelper :access="access" :license="license"/>
            </div>
            <div v-show="!loading" class="flex justify-center" v-if="error">
              <p class="break-normal text-xl">{{ error }}</p>
            </div>
          </div>
          <div class="flex justify-center">
            <el-alert v-if="previewText && !hidePreviewText" :closable="false">{{ previewText }}</el-alert>
          </div>
        </div>
        <div v-else class="p-2">
          <div v-show="!loading" class="flex justify-center" v-if="forbidden && !access['hasAccess']">
            <AccessHelper :access="access" :license="license"/>
          </div>
          <div v-show="!loading" class="flex justify-center" v-if="error">
            <p class="break-normal text-xl">{{ error }}</p>
          </div>
        </div>
      </div>
    </el-col>
  </el-row>
  <el-row class="flex justify-center" v-show="!loading" v-if="access['hasAccess']">
    <el-button-group class="m-2">
      <el-link v-if="!hideOpenLink" class="mr-2" :href="this.fileUrl" :underline="false">
        <el-button type="default" class="px-2">View File</el-button>
      </el-link>
      <el-link class="mr-2" :underline="false"
               v-on:click="this.downloadFileUrl()">
        <el-button type="default">Download&nbsp;File&nbsp;<font-awesome-icon icon="fa fa-download"/>
        </el-button>
      </el-link>
    </el-button-group>
  </el-row>
</template>

<script>
import 'element-plus/theme-chalk/display.css';
import { VideoPlay } from '@element-plus/icons-vue';
import { first, isUndefined } from 'lodash';
import AccessHelper from './AccessHelper.component.vue';
import CSVWidget from './widgets/CSVWidget.component.vue';
import PDFWidget from './widgets/PDFWidget.component.vue';
import PlainTextWidget from './widgets/PlainTextWidget.component.vue';

export default {
  inheritAttrs: false,
  props: ['id', 'resolve', 'encodingFormat', 'hideOpenLink', 'previewText', 'isPreview', 'access', 'license'],
  components: {
    PlainTextWidget,
    CSVWidget,
    VideoPlay,
    PDFWidget,
    AccessHelper,
  },
  data() {
    return {
      title: '',
      blobURL: '',
      data: null,
      sourceType: '',
      parentId: '',
      path: '',
      parent: '',
      parentTitle: '',
      tryCSV: false,
      csv: {},
      loading: true,
      errorMessage: '',
      error: '',
      type: '',
      notAuthorized: false,
      route: '',
      fileUrl: '',
      responseBlob: null,
      togglePreview: false,
      hidePreviewText: true,
      forbidden: false,
    };
  },
  watch: {
    resolve: {
      async handler() {
        if (this.resolve) {
          await this.resolveFile();
        }
      },
      flush: 'post',
      immediate: true,
    },
  },
  async mounted() {
    this.setFileUrl();
    if (this.resolve) {
      await this.resolveFile();
    }
  },
  methods: {
    async resolveFile() {
      this.parentId = this.id;
      this.path = this.id;
      this.route = `/object/open?id=${encodeURIComponent(this.id)}`;
      if (this.path !== '') {
        this.route += `&path=${encodeURIComponent(this.path)}`;
      }
      // Try to display only text and pdfs by default if there is an encodingFormat
      const formats = this.encodingFormat;
      if (this.encodingFormat.some((format) => String(format).match(/text\/|pdf/))) {
        this.togglePreview = true;
      }
      if (!this.isPreview) {
        this.togglePreview = true;
      }
      if (this.togglePreview) {
        console.log('this.togglePreview');
        console.log(this.togglePreview);
        await this.tryDownloadBlob();
      }
    },
    async tryDownloadBlob() {
      this.loading = true;
      try {
        this.responseBlob = await this.$http.get({ route: this.route });
        console.log(`this.responseBlob.status: ${this.responseBlob.status}`);
        if (this.responseBlob.status !== 200) {
          this.errorMessage = 'We could not load the file';
          if (this.responseBlob.status === 403) {
            this.forbidden = true;
            this.error = false;
            //this.error = this.responseBlob.statusText; //This message is not used as it is overridden by the AccessHelper
          } else if (this.responseBlob.status === 404) {
            this.error = 'The file was not found in the path, please contact your Data Provider or Data Steward';
          } else {
            this.error = this.responseBlob.statusText;
          }
          this.loading = false;
          return;
        }
      } catch (e) {
        this.errorMessage = 'File Not Found';
        //this.error = e.message;
        this.loading = false;
        return;
      }
      const title = decodeURIComponent(this.$route.query.title);
      if (title) {
        this.title = title;
      }
      const parent = decodeURIComponent(this.$route.query.parent);
      if (parent) {
        this.parent = parent;
      }
      const parentTitle = decodeURIComponent(this.$route.query.parentTitle);
      if (parentTitle) {
        this.parentTitle = parentTitle;
      }
      //TODO: get encodingFormat directly from the API and merge these two ifs
      //TODO: issue https://github.com/Language-Research-Technology/oni-ui/issues/46
      if (!this.encodingFormat) {
        if (
          this.path &&
          (this.path.endsWith('.txt') ||
            this.path.endsWith('.csv') ||
            this.path.endsWith('.eaf') ||
            this.path.endsWith('.html') ||
            this.path.endsWith('.xml') ||
            this.path.endsWith('.flab'))
        ) {
          await this.loadTxt();
          this.loading = false;
        }
      } else if (
        this.encodingFormat &&
        (this.encodingFormat?.startsWith('text/') || this.encodingFormat.endsWith('xml'))
      ) {
        await this.loadTxt();
        this.loading = false;
      } else {
        try {
          this.data = await this.responseBlob.blob();
          this.blobURL = window.URL.createObjectURL(this.data);
          //TODO: https://github.com/Language-Research-Technology/oni-ui/issues/46
          if (this.path && (this.path.endsWith('.mp3') || this.path.endsWith('.wav'))) {
            this.type = 'audio';
            this.data = this.blobURL;
            this.hidePreviewText = true;
          } else if (this.path?.endsWith('.mp4')) {
            this.type = 'video';
            this.sourceType = 'video/mp4';
            this.data = this.blobURL;
            this.hidePreviewText = true;
          } else if (this.path?.endsWith('.pdf')) {
            this.type = 'pdf';
            this.hidePreviewText = false;
          } else {
            this.type = 'other';
            this.data = this.blobURL;
            this.hidePreviewText = false;
          }
          this.loading = false;
        } catch (e) {
          this.errorMessage = 'File cannot be loaded';
          this.error = e.message;
          this.loading = false;
        }
      }
    },
    async downloadFileUrl() {
      try {
        this.loading = true;
        const link = document.createElement('a');
        link.download = this.path;
        const response = await this.$http.get({ route: this.route });
        if (response.status !== 200) {
          this.errorDialogVisible = true;
          this.errorDialogTitle = 'Download Error';
          if (response.status === 403) {
            this.forbidden = true;
          }
          if (response.status === 404) {
            this.errorDialogText =
              'The file was not found in the path, please contact your Data Provider or Data Steward';
          } else {
            this.errorDialogText = response.statusText;
          }
        } else {
          const data = await response.blob();
          link.href = window.URL.createObjectURL(data);
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          window.URL.revokeObjectURL(link.href);
          this.$gtag.event('/file-download', {
            event_category: 'file',
            event_label: 'download-file',
            value: this.zip.url,
          });
        }

        this.loading = false;
      } catch (e) {
        this.errorDialogVisible = true;
        this.errorDialogTitle = 'Download Error';
        this.errorDialogText = e.message;
        this.loading = false;
      }
    },
    setFileUrl() {
      this.parentId = this.id;
      this.path = this.id;
      const url = `/object/open?id=${encodeURIComponent(this.path)}`;
      this.fileUrl = url;
    },
    getTitle() {
      const title = first(this.meta.name);
      return title?.['@value'] || this.meta['@id'];
    },
    setError() {
      switch (this.error) {
        case 'not_authorized':
          this.notAuthorized = true;
      }
    },
    async loadTxt() {
      this.type = 'txt';
      console.log('load txt');
      this.data = await this.responseBlob.text({ type: 'text/plain', endings: 'native' });
      if (this.path.endsWith('.csv')) {
        this.tryCSV = true;
      }
      this.hidePreviewText = false;
    },
  },
};
</script>
