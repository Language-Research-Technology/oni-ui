<script setup lang="ts">
import { ref } from 'vue';

import { configuration } from '@/configuration';

import FileResolve from '@/components/FileResolve.vue';
import MetaField from '@/components/MetaField.vue';

const { part, active, access, license, parentId } = defineProps<{
  part: { '@id': string; name: string; encodingFormat: string[] } & Record<string, string>;
  active: boolean;
  access: { hasAccess: boolean };
  license: { '@id': string; description: string };
  parentId: string;
}>();

const { ui } = configuration;

const id = part['@id'];
const resolve = ref(active);

const meta: { name: string; data: string }[] = [];

const keys = Object.keys(part);
const filtered = keys.filter((key) => !ui.file.meta.hide.includes(key));
for (const filter of filtered) {
  meta.push({ name: filter, data: part[filter] });
}
meta.sort((a, b) => a.name.localeCompare(b.name));
</script>

<template>
  <div>
    <el-row class="grid-content p-6">
      <el-col :xs="22" :sm="22" :md="22" :lg="22" :xl="22">
        <h5 class="text-2xl font-normal leading-normal mt-0 mb-2">{{ part.name }}</h5>
      </el-col>
      <el-col :xs="2" :sm="2" :md="2" :lg="2" :xl="2">
        <template v-if="resolve">
          <el-button @click="resolve = false">
            <font-awesome-icon icon="fa fa-chevron-down" />
          </el-button>
        </template>
        <template v-else>
          <el-button @click="resolve = true">
            <font-awesome-icon icon="fa fa-chevron-right" />
          </el-button>
        </template>
      </el-col>
    </el-row>

    <el-row class="p-7" v-show="resolve">
      <el-col :xs="24" :sm="24" :md="24" :lg="10" :xl="10">
        <ul>
          <li v-for="m of meta">
            <MetaField :meta="m" />
          </li>
        </ul>
      </el-col>

      <el-col :xs="24" :sm="24" :md="24" :lg="14" :xl="14">
        <FileResolve class="flex justify-center" :id="id" :parentId="parentId" :filename="part.filename"
          :resolve="resolve" :encodingFormat="part.encodingFormat" :isPreview="true" :access="access"
          :license="license" />
      </el-col>
    </el-row>

    <el-row>
      <el-col class="divide-solid divide-y-2 divide-red-700">
        <div></div>
        <div></div>
      </el-col>
    </el-row>
  </div>
</template>
