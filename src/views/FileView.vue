<script setup lang="ts">
import { inject, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import FileResolve from '@/components/FileResolve.vue';
import type { ApiService } from '@/services/api';

const api = inject<ApiService>('api');
if (!api) {
  throw new Error('API instance not provided');
}

const route = useRoute();
const router = useRouter();

const id = route.query.id?.toString() as string;

const title = ref('');
const parentId = ref('');
const parentTitle = ref('');
const filename = ref('');
const encodingFormat = ref<string[]>([]);
const access = { hasAccess: true };
const license: { '@id': string; description: string } = { '@id': 'FIXME', description: 'FIXME' };

// biome-ignore lint/suspicious/noExplicitAny: FIXME: later
const populateData = (md: any) => {
  title.value = md.name || md['@id'];

  parentId.value = md.parentId;
  parentTitle.value = md.parentTitle || md.parentId;

  filename.value = md.filename;
  encodingFormat.value = [md.encodingFormat];
};

const getFileMetadata = async () => {
  if (!id) {
    router.push({
      name: 'NotFound',
      params: { pathMatch: route.path.substring(1).split('/') },
      query: route.query,
      hash: route.hash,
    });

    return;
  }

  const { metadata: md } = await api.getRoCrate(id);
  if (!md) {
    router.push({
      name: 'NotFound',
      params: { pathMatch: route.path.substring(1).split('/') },
      query: route.query,
      hash: route.hash,
    });

    return;
  }

  populateData(md);
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
            <FileResolve :id="id" :parentId="parentId" :filename="filename" :resolve="true"
              :encodingFormat="encodingFormat" :name="title" :parentName="parentTitle" :hideOpenLink="true"
              :isPreview="false" :access="access" :license="license" />
          </el-col>
        </el-row>
      </div>
    </el-col>
  </el-row>
</template>
