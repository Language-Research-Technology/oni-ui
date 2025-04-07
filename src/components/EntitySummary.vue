<script setup lang="ts">
import type { EntityType } from '@/services/api';

import { configuration } from '@/configuration';

import MediaTypeIcon from '@/components//widgets/MediaTypeIcon.vue';
import AccessControlIcon from '@/components/widgets/AccessControlIcon.vue';
import CommunicationModeIcon from '@/components/widgets/CommunicationModeIcon.vue';

const { ui } = configuration;

const { entity } = defineProps<{ entity: EntityType }>();

// TODO: Rename this
const searchDetails = ui.search?.searchDetails || [];

const getSearchDetailUrl = () => {
  // TODO: this is not good, maybe do it with a ConformsTo to specify link.
  // But have to think about it because not all files have conformsTo!
  const { recordType } = entity;
  const repoType = recordType.find((t) => t === 'RepositoryCollection');
  // const fileType = recordType.find((t) => t === 'File');
  const itemType = recordType.find((t) => t === 'RepositoryObject');

  const id = encodeURIComponent(entity.id);

  if (repoType) {
    return `/collection?id=${id}`;
  }

  if (itemType) {
    return `/object?id=${id}`;
  }

  // FIXME: Deal with files
  // if (fileType) {
  //   let isNotebook;
  //   if (item._source?.['conformsTo']) {
  //     isNotebook = item._source['conformsTo'].find(c => c['@id'] === this.conformsToNotebook);
  //   }
  //
  //   if (isNotebook) {
  //     id = encodeURIComponent(item._id);
  //     return `/object?_id=${id}`;
  //   } else {
  //     const fileId = id;
  //     id = encodeURIComponent(first(item._source['_parent'])?.['@id']);
  //     return `/object?id=${id}&_id=${id}&fileId=${fileId}`
  //   }
  // }

  // Defaults to object if it doesnt know what it is
  return `/object?id=${id}`;
};
</script>

<template>
  <div><!-- Wrapping an empty div because of multiple roots with v-for-->
    <el-row>
      <el-col :xs="24" :sm="15" :md="15" :lg="17" :xl="19" :span="20">
        <el-row :align="'middle'">
          <h5 class="text-2xl font-medium">
            <router-link :to="getSearchDetailUrl()"
              class="text-blue-600 hover:text-blue-800 visited:text-purple-600 break-words">
              {{ entity.name || entity.id }}
            </router-link>
          </h5>
        </el-row>

        <el-row :align="'middle'">
          <p class="font-normal text-gray-700">
            Type:
          </p>
          <div class="flex flex-wrap">
            <span class="m-2" v-for="type of entity.recordType">{{ type }}</span>
          </div>
        </el-row>

        <template v-for="special of searchDetails">
          <el-row v-if="entity.extra?.[special.field as keyof EntityType['extra']]">
            <p class="font-normal text-gray-700">
              {{ special.label }}:&nbsp;
            </p>
            <p>{{ (entity.extra[special.field as keyof EntityType['extra']] as
              string[]).join(', ') }}</p>
          </el-row>
        </template>

        <el-row align="middle" v-if="entity.memberOf">
          <p class="font-normal text-gray-700">
            Member of:&nbsp;
          </p>
          <router-link class="text-sm m-2 text-gray-700 underline"
            :to="'/collection?id=' + encodeURIComponent(entity.memberOf)">
            {{ entity.memberOf }}
          </router-link>
        </el-row>

        <el-row align="middle" v-if="entity.root && entity.root !== entity.memberOf" class="pt-2">
          <p class="font-normal text-gray-700">
            &nbsp;In:&nbsp;
          </p>
          <router-link :to="'/collection?id=' + encodeURIComponent(entity.root)">
            <el-button>{{ entity.root }}</el-button>
          </router-link>
        </el-row>

        <el-row align="middle">
          <p class="font-normal text-gray-700">
            {{ entity.conformsTo }}
          </p>
        </el-row>

        <el-row class="py-4 pr-4" v-if="entity.description">
          <p className="line-clamp-3">{{ entity.description }}</p>
        </el-row>

        <el-row class="gap-2 flex">
          <span class="after:content-[','] last:after:content-none" v-if="entity.extra?.collectionCount">Collections: {{
            entity.extra.collectionCount }}</span>
          <span class="after:content-[','] last:after:content-none" v-if="entity.extra?.objectCount">Objects: {{
            entity.extra.objectCount }}</span>
          <span class="after:content-[','] last:after:content-none" v-if="entity.extra?.fileCount">Files: {{
            entity.extra.fileCount }}</span>
        </el-row>

        <el-row align="middle" v-if="entity.searchExtra?.highlight">
          <ul>
            <li v-for="hl of Object.values(entity.searchExtra.highlight || {})" v-html="'...' + hl + '...'" class="p-2">
            </li>
          </ul>
        </el-row>

        <el-row v-if="entity.searchExtra?.score" class="pt-2">
          <div>
            <font-awesome-icon icon="fa-solid fa-5x fa-award" />
            Relevance Score: {{ entity.searchExtra.score }}
          </div>
        </el-row>

      </el-col>

      <el-col :xs="24" :sm="9" :md="9" :lg="7" :xl="5" :span="4" :offset="0">
        <AccessControlIcon :accessControl="entity.extra?.accessControl" />
        <el-row :span="24" class="flex justify-center">
          <template v-for="communicationMode of entity.extra?.communicationMode">
            <CommunicationModeIcon :communication-mode="communicationMode" />
          </template>
        </el-row>
        <el-row :span="24" class="flex justify-center">
          <template v-for="mediaType of entity.extra?.mediaType">
            <MediaTypeIcon :mediaType="mediaType" />
          </template>
        </el-row>
      </el-col>
    </el-row>
    <hr class="divide-y divide-gray-500" />
  </div>
</template>
