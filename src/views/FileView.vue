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

type FileRoCrate = RoCrate['hasPart'][number];

const id = route.query.id?.toString() as string;

const title = ref('');
const parentTitle = ref<string>();
const metadata = ref<FileRoCrate | undefined>();
const entity = ref<EntityType | undefined>();
const meta = ref<{ name: string; data: string }[]>([]);

const populateData = (md: FileRoCrate, e: EntityType) => {
  title.value = md.filename || md['@id'];

  parentTitle.value = e.memberOf?.name || e.memberOf?.id;

  const keys = Object.keys(md);
  const filtered = keys.filter((key) => !ui.file.meta.hide.includes(key));
  for (const filter of filtered) {
    meta.value.push({ name: filter, data: md[filter as keyof typeof md] as string });
  }
  meta.value.sort((a, b) => a.name.localeCompare(b.name));

  metadata.value = md;
  entity.value = e;
};

const getFileMetadata = async () => {
  if (!id) {
    router.replace({
      name: 'NotFound',
      params: { pathMatch: route.path.substring(1).split('/') },
      query: route.query,
      hash: route.hash,
    });

    return;
  }

  const { entity, metadata: md } = await api.getEntity(id);
  if (!md) {
    router.replace({
      name: 'NotFound',
      params: { pathMatch: route.path.substring(1).split('/') },
      query: route.query,
      hash: route.hash,
    });

    return;
  }

  populateData(md as unknown as FileRoCrate, entity);
};

getFileMetadata();
</script>

<template>
  <el-row :justify="'center'" class="w-full" v-if="entity && metadata">
    <el-col :span="24">
      <div class="container mx-auto">
        <el-row>
          <el-col :xs="24" :sm="15" :md="24" :lg="24" :xl="24">
            <h3 class="relative space-x-3 font-bold p-3 text-xl select-none text-left">
              <router-link :to="`/object?id=${encodeURIComponent(entity.memberOf?.id || '')}`"
                class="wrap-break-word no-underline text-blue-600 hover:text-blue-800 visited:text-purple-600">
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
            <FileResolve :entity="entity" :metadata="metadata" />
          </el-col>
        </el-row>
      </div>
    </el-col>
  </el-row>
</template>
