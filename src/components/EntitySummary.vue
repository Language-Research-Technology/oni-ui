<script setup lang="ts">
import { useI18n } from 'vue-i18n';
import MediaTypeIcon from '@/components//widgets/MediaTypeIcon.vue';
import AccessControlIcon from '@/components/widgets/AccessControlIcon.vue';
import CommunicationModeIcon from '@/components/widgets/CommunicationModeIcon.vue';
import { ui } from '@/configuration';
import type { EntityType } from '@/services/api';
import { getEntityUrl } from '@/tools';

const { t } = useI18n();
const { entity } = defineProps<{ entity: EntityType }>();

// TODO: Rename this
const { searchDetails = [] } = ui.search || {};
</script>

<template>
  <div><!-- Wrapping an empty div because of multiple roots with v-for-->
    <el-row>
      <el-col :xs="24" :sm="15" :md="15" :lg="17" :xl="19" :span="20">
        <el-row :align="'middle'">
          <h5 class="text-2xl font-medium">
            <router-link :to="getEntityUrl(entity)"
              class="text-blue-600 hover:text-blue-800 visited:text-purple-600 wrap-break-word">
              {{ entity.name || entity.id }}
            </router-link>
          </h5>
        </el-row>

        <el-row :align="'middle'">
          <p class="font-normal text-gray-700">
            {{ t('entity.type') }}
            <span class="m-2">{{ entity.entityType }}</span>
          </p>
        </el-row>

        <template v-for="special of searchDetails">
          <el-row v-if="entity[special.field as keyof EntityType]">
            <p class="font-normal text-gray-700">
              {{ special.label }}:&nbsp;
            </p>
            <p>{{ (entity[special.field as keyof EntityType] as
              string[]).join(', ') }}</p>
          </el-row>
        </template>

        <el-row align="middle" v-if="entity.memberOf">
          <p class="font-normal text-gray-700">
            {{ t('entity.memberOf') }}&nbsp;
          </p>
          <router-link class="text-sm m-2 text-gray-700 underline"
            :to="'/collection?id=' + encodeURIComponent(entity.memberOf.id)">
            {{ entity.memberOf.name || entity.memberOf.id }}
          </router-link>
        </el-row>

        <el-row align="middle" v-if="entity.rootCollection?.id !== entity.memberOf?.id" class="pt-2">
          <p class="font-normal text-gray-700">
            &nbsp;{{ t('entity.in') }}&nbsp;
          </p>
          <router-link :to="'/collection?id=' + encodeURIComponent(entity.rootCollection.id)">
            <el-button>{{ entity.rootCollection.name || entity.rootCollection.id }}</el-button>
          </router-link>
        </el-row>

        <el-row align="middle">
          <p class="font-normal text-gray-700">
            {{ entity.entityType }}
          </p>
        </el-row>

        <el-row class="py-4 pr-4" v-if="entity.description">
          <p className="line-clamp-3">{{ entity.description }}</p>
        </el-row>

        <el-row class="gap-2 flex">
          <span class="after:content-[','] last:after:content-none" v-if="entity.counts.collections">
            {{ t('entity.collections') }} {{ entity.counts.collections }}
          </span>
          <span class="after:content-[','] last:after:content-none" v-if="entity.counts.objects">
            {{ t('entity.objects') }} {{ entity.counts.objects }}
          </span>
          <span class="after:content-[','] last:after:content-none" v-if="entity.counts.files">
            {{ t('entity.files') }} {{ entity.counts.files }}
          </span>
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
            {{ t('entity.relevanceScore') }} {{ entity.searchExtra.score }}
          </div>
        </el-row>

      </el-col>

      <el-col :xs="24" :sm="9" :md="9" :lg="7" :xl="5" :span="4" :offset="0">
        <AccessControlIcon :accessControl="entity.accessControl" />
        <el-row :span="24" class="flex justify-center">
          <template v-for="communicationMode of entity.communicationMode">
            <CommunicationModeIcon :communication-mode="communicationMode" />
          </template>
        </el-row>
        <el-row :span="24" class="flex justify-center">
          <template v-for="mediaType of entity.mediaType">
            <MediaTypeIcon :mediaType="mediaType" />
          </template>
        </el-row>
      </el-col>
    </el-row>
    <hr class="divide-y divide-gray-500" />
  </div>
</template>
