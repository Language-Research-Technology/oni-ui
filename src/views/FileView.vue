<script setup lang="ts">
import { inject, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import FileResolve from '@/components/FileResolve.vue';
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

const populateData = (md: RoCrate, e: EntityType) => {
  const part = md.hasPart.find((part) => part['@id']);
  console.log('🪚 part:', JSON.stringify(part, null, 2));
  if (!part) {
    router.push({
      name: 'NotFound',
      params: { pathMatch: route.path.substring(1).split('/') },
      query: route.query,
      hash: route.hash,
    });

    return;
  }

  title.value = part.filename || part['@id'];

  parentTitle.value = md.name || md['@id'];

  filename.value = part.filename;
  encodingFormat.value = Array.isArray(part.encodingFormat) ? part.encodingFormat : [part.encodingFormat];
  contentSize.value = part.contentSize;
  metadata.value = md;
  entity.value = e;
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
  <el-row :justify="'center'" class="w-full">
    <el-col :span="24">
      <div class="container mx-auto">
        <el-row>
          <el-col :xs="24" :sm="15" :md="24" :lg="24" :xl="24">
            <h3 class="relative space-x-3 font-bold p-3 text-xl select-none text-left">
              <a class="break-words no-underline text-blue-600 hover:text-blue-800 visited:text-purple-600"
                :href="`/object?id=${encodeURIComponent(parentId)}`">
                <font-awesome-icon icon="fa fa-arrow-left" />
                {{ parentTitle }}</a>>&nbsp;<span>{{ title || id }}</span>
            </h3>
          </el-col>
        </el-row>
        <el-row>
          <el-col v-if="parentId" :xs="24" :sm="24" :md="24" :lg="24" :xl="24"
            class="flex justify-center h-screen overflow-auto">
            <FileResolve v-if="entity" :id="id" :parentId="parentId" :filename="filename" :resolve="true"
              :encodingFormat="encodingFormat" :name="title" :parentName="parentTitle" :hideOpenLink="true"
              :isPreview="false" :access="entity.access" :license="metadata?.license" :contetnSize="contentSize" />
          </el-col>
        </el-row>
      </div>
    </el-col>
  </el-row>
</template>
