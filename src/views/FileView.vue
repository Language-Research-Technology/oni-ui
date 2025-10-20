<script setup lang="ts">
import { inject, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import FileResolve from '@/components/FileResolve.vue';
import MetaField from '@/components/MetaField.vue';
import { ui } from '@/configuration';
import type { ApiService, EntityType, RoCrate } from '@/services/api';

const api = inject<ApiService>('api');
if (!api) {
  throw new Error('API instance not provided');
}

const route = useRoute();
const router = useRouter();

const id = route.query.id?.toString() as string;
const parentId = route.query.parentId?.toString() as string;

const title = ref('');
const parentTitle = ref<string>();
const filename = ref('');
const encodingFormat = ref<string[]>([]);
const contentSize = ref<number>();
const metadata = ref<RoCrate | undefined>();
const entity = ref<EntityType | undefined>();
const part = ref<RoCrate['hasPart'][number] | undefined>();
const meta = ref<{ name: string; data: string }[]>([]);

const populateData = (md: RoCrate, e: EntityType) => {
  part.value = md.hasPart.find((part) => part['@id']);
  if (!part.value) {
    router.push({
      name: 'NotFound',
      params: { pathMatch: route.path.substring(1).split('/') },
      query: route.query,
      hash: route.hash,
    });

    return;
  }

  title.value = part.value.filename || part.value['@id'];

  parentTitle.value = md.name || md['@id'];

  filename.value = part.value.filename;
  encodingFormat.value = Array.isArray(part.value.encodingFormat)
    ? part.value.encodingFormat
    : [part.value.encodingFormat];
  contentSize.value = part.value.contentSize;
  metadata.value = md;
  entity.value = e;

  const keys = Object.keys(part.value);
  const filtered = keys.filter((key) => !ui.file.meta.hide.includes(key));
  for (const filter of filtered) {
    meta.value.push({ name: filter, data: part.value[filter as keyof typeof part.value] as string });
  }
  meta.value.sort((a, b) => a.name.localeCompare(b.name));
};

const getFileMetadata = async () => {
  if (!id || !parentId) {
    router.push({
      name: 'NotFound',
      params: { pathMatch: route.path.substring(1).split('/') },
      query: route.query,
      hash: route.hash,
    });

    return;
  }

  const { entity, metadata: md } = await api.getEntity(parentId);
  if (!md) {
    router.push({
      name: 'NotFound',
      params: { pathMatch: route.path.substring(1).split('/') },
      query: route.query,
      hash: route.hash,
    });

    return;
  }

  populateData(md, entity);
};

getFileMetadata();
</script>

<template>
  <el-row :justify="'center'" class="w-full" v-if="entity && metadata && part">
    <el-col :span="24">
      <div class="container mx-auto">
        <el-row>
          <el-col :xs="24" :sm="15" :md="24" :lg="24" :xl="24">
            <h3 class="relative space-x-3 font-bold p-3 text-xl select-none text-left">
              <router-link :to="`/object?id=${encodeURIComponent(parentId)}`"
                class="break-words no-underline text-blue-600 hover:text-blue-800 visited:text-purple-600">
                <font-awesome-icon icon="fa fa-arrow-left" />
                {{ parentTitle }}
              </router-link>
              >&nbsp;<span>{{ title || id }}</span>
            </h3>
          </el-col>
        </el-row>
        <el-row>
          <el-col :xs="24" :sm="15" :md="24" :lg="24" :xl="24">
            <ul>
              <li v-for="m of meta">
                <MetaField :meta="m" />
              </li>
            </ul>
          </el-col>
        </el-row>
        <el-row>
          <el-col :xs="24" :sm="24" :md="24" :lg="24" :xl="24" class="flex justify-center h-screen overflow-auto">
            <FileResolve v-if="entity" :id="id" :parentId="parentId" :filename="filename" :resolve="true"
              :encodingFormat="encodingFormat" :name="title" :parentName="parentTitle" :hideOpenLink="true"
              :isPreview="false" :access="entity.access" :license="metadata?.license" :contetnSize="contentSize" />
          </el-col>
        </el-row>
      </div>
    </el-col>
  </el-row>
</template>
