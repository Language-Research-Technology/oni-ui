<script setup lang="ts">
import { inject, onMounted, ref } from 'vue';
import AccessHelper from '@/components/AccessHelper.vue';
import CSVWidget from '@/components/widgets/CSVWidget.vue';
import EafTranscriptionWidget from '@/components/widgets/EafTranscriptionWidget.vue';
import PDFWidget from '@/components/widgets/PDFWidget.vue';
import PlainTextWidget from '@/components/widgets/PlainTextWidget.vue';
import type { AnnotationRef, ApiService, EntityType, RoCrate } from '@/services/api';
import { first } from '@/tools';

const api = inject<ApiService>('api');
if (!api) {
  throw new Error('API instance not provided');
}

const {
  entity,
  metadata,
  annotations = [],
} = defineProps<{
  entity: EntityType;
  metadata: RoCrate['hasPart'][number] & { license?: RoCrate['license'] };
  annotations?: AnnotationRef[];
}>();

const data = ref();
const streamUrl = ref('');
const annotationUrls = ref<string[]>([]);
const currentTime = ref<number>(0);
const mediaDuration = ref<number>(0);
const mediaRef = ref<HTMLAudioElement | HTMLVideoElement | null>(null);

const resolveFile = async () => {
  if (entity.entityType !== 'http://schema.org/MediaObject') {
    return;
  }

  streamUrl.value = (await api.getFileUrl(entity.id, first(metadata.filename), false)) || '';
};

const resolveAnnotations = async () => {
  if (annotations.length === 0) {
    return;
  }

  const results = await Promise.all(
    annotations.map(async (ann) => {
      const result = await api.getEntity(ann['@id']);
      if ('error' in result) {
        return null;
      }

      const annEntity = result.entity;
      if (annEntity.entityType !== 'http://schema.org/MediaObject') {
        return null;
      }

      const filename = first(ann.filename) || annEntity.name;
      return api.getFileUrl(annEntity.id, filename, false);
    }),
  );
  annotationUrls.value = results.filter((url): url is string => !!url);
};

const handleDownload = async () => {
  if (entity.entityType !== 'http://schema.org/MediaObject') {
    return;
  }

  const url = await api.getFileUrl(entity.id, first(metadata.filename), true);
  if (url) {
    window.location.href = url;
  }
};

const handleTimeUpdate = (event: Event) => {
  const el = event.target as HTMLMediaElement;
  currentTime.value = el.currentTime;
};

const handleLoadedMetadata = (event: Event) => {
  const el = event.target as HTMLMediaElement;
  mediaDuration.value = el.duration;
};

const handleSeek = (seconds: number) => {
  if (mediaRef.value) {
    mediaRef.value.currentTime = seconds;
  }
};

const extension = (first(metadata.filename) || '').split('.').pop() || '';
const encodingFormat = metadata.encodingFormat;
const plainEncodingFormats = encodingFormat.filter((ef) => typeof ef === 'string');
const isCsv = plainEncodingFormats.some((ef) => ef.endsWith('csv')) || extension === 'csv';
const isEaf = extension === 'eaf';
const isTxt =
  !isEaf &&
  (plainEncodingFormats.some((ef) => ef.startsWith('text')) || ['txt', 'html', 'xml', 'flab'].includes(extension));
const isPdf = plainEncodingFormats.some((ef) => ef.endsWith('pdf')) || extension === 'pdf';
const isAudio = encodingFormat.some((f) => f?.startsWith('audio'));
const isVideo = encodingFormat.some((f) => f?.startsWith('video'));
const mediaTag = isVideo ? 'video' : 'audio';
const mediaType = encodingFormat.find((f) => f?.startsWith(isVideo ? 'video' : 'audio'));

resolveFile();

onMounted(() => {
  if ((isAudio || isVideo) && annotations.length > 0) {
    resolveAnnotations();
  }
});
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

            <div v-else-if="isEaf" class="p-4">
              <EafTranscriptionWidget :src="streamUrl" v-if="streamUrl" show-header />
            </div>

            <div v-else-if="isTxt" class="p-4 wrap-break-word">
              <PlainTextWidget :src="streamUrl" v-if="streamUrl" />
            </div>

            <div v-else-if="isAudio || isVideo" class="flex flex-col items-center">
              <component :is="mediaTag" ref="mediaRef" controls v-if="streamUrl" @timeupdate="handleTimeUpdate"
                @loadedmetadata="handleLoadedMetadata">
                <source :src="streamUrl" :type="mediaType">
                Your browser does not support the {{ mediaTag }} element.
              </component>
              <div v-for="(url, index) in annotationUrls" :key="index" class="w-full mt-4">
                <EafTranscriptionWidget :src="url" :current-time="currentTime" :duration="mediaDuration"
                  @seek="handleSeek" />
              </div>
            </div>

            <div v-else-if="encodingFormat?.some((f) => f?.startsWith('image'))" class="flex justify-center">
              <img v-if="streamUrl" :src="streamUrl" />
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
        <el-button type="default" @click="handleDownload">Download File&nbsp;<font-awesome-icon icon="fa fa-download" />
        </el-button>
      </el-button-group>
    </el-row>
  </el-col>
</template>
