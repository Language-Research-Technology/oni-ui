<script setup lang="ts">
import { useGtm } from '@gtm-support/vue-gtm';
import { injectHead } from '@unhead/vue';
import { inject, ref, watch } from 'vue';
import { useRoute } from 'vue-router';
import { useI18n } from 'vue-i18n';
import AccessHelper from '@/components/AccessHelper.vue';
import CollectionItem from '@/components/CollectionItem.vue';
import CitationCard from '@/components/cards/CitationCard.vue';
import LicenseCard from '@/components/cards/LicenseCard.vue';
import MemberOfCard from '@/components/cards/MemberOfCard.vue';
import RetrieveDataMetadata from '@/components/cards/RetrieveDataMetadata.vue';
import TakedownCard from '@/components/cards/TakedownCard.vue';
import MetaField from '@/components/MetaField.vue';
import MediaTypeIcon from '@/components/widgets/MediaTypeIcon.vue';
import MemberOfLink from '@/components/widgets/MemberOfLink.vue';
import { useHead } from '@/composables/head';
import { useEntityView } from '@/composables/useEntityView';
import { ui } from '@/configuration';
import type { ApiService, EntityType, RoCrate } from '@/services/api';
import { formatEncodingFormat, formatFileSize } from '@/tools';

const { t } = useI18n();
const { object: config } = ui;

const api = inject<ApiService>('api');
if (!api) {
  throw new Error('API instance not provided');
}

const route = useRoute();
const head = injectHead();
const gtm = useGtm();

const { name, meta, populateName, populateMeta, handleMissingEntity } = useEntityView(config);

const parts = ref<({ '@id': string; name: string; encodingFormat: string[] } & Record<string, string>)[]>([]);
const mediaTypes = ref<string[]>([]);
const isLoading = ref(false);
const metadata = ref<RoCrate | undefined>();
const entity = ref<EntityType | undefined>();
const membersFiltered = ref<EntityType[]>([]);

const populateParts = (md: RoCrate) => {
  if (!md.hasPart) {
    parts.value = [];
    mediaTypes.value = [];

    return;
  }

  // TODO: Fix ro-crate-js so it returns arrays for things that are arrays even with array: false
  const newParts = md.hasPart && Array.isArray(md.hasPart) ? md.hasPart : [md.hasPart];

  const newParts2 = newParts.map((part) => ({
    ...part,
    encodingFormat: Array.isArray(part.encodingFormat) ? part.encodingFormat : [part.encodingFormat],
  }));

  // @ts-expect-error FIX types later
  parts.value = newParts2;

  if (parts.value.length) {
    const up = parts.value.flatMap((p) => p.encodingFormat).filter((p) => typeof p === 'string');
    mediaTypes.value = [...new Set(up)];
  }
};

const populate = (md: RoCrate) => {
  populateName(md);
  populateMeta(md);
  populateParts(md);
  useHead(head, md);
};

const fetchdata = async () => {
  const id = route.query.id?.toString() as string;

  if (!id) {
    handleMissingEntity();

    return;
  }

  isLoading.value = true;

  const { entity: e, metadata: md } = await api.getEntity(id);
  if (!md) {
    handleMissingEntity();

    return;
  }

  gtm?.trackEvent({
    event: '/object',
    category: 'object',
    label: 'loaded-object',
    value: id,
  });

  metadata.value = md;
  entity.value = e;
  populate(md);

  isLoading.value = false;

  if (md['pcdm:memberOf']) {
    const children = await api.getEntities({
      memberOf: md['pcdm:memberOf']['@id'],
      entityType: 'http://pcdm.org/models#Object',
    });

    if ('entities' in children) {
      membersFiltered.value = children.entities;
    }
  }
};

const moreObjects = () => {
  const filter = {
    memberOf: [encodeURIComponent(metadata?.value?.['pcdm:memberOf']?.['@id'] || '')],
  };

  return encodeURIComponent(JSON.stringify(filter));
};

watch(
  () => route.params,
  () => fetchdata(),
);

fetchdata();
</script>

<template>
  <div class="px-10 pt-10 pb-7 bg-white">
    <el-row :align="'middle'" class="mb-2 text-3xl font-medium">
      <h5>
        <MemberOfLink v-if="metadata?.['pcdm:memberOf']" :memberOf="metadata['pcdm:memberOf']" />
        {{ name }}
      </h5>
    </el-row>
    <hr class="divider divider-gray pt-2" />
  </div>

  <el-row :justify="'center'" v-if="metadata" class="m-5 px-10" v-loading="isLoading">
    <el-col :xs="24" :sm="24" :md="24" :lg="16" :xl="16">
      <AccessHelper v-if="entity?.access && metadata.license" :access="entity.access" :license="metadata.license" />

      <div class="px-5 pb-5">
        <el-row class="">
          <el-col v-for="m of meta">
            <MetaField :meta="m" />
          </el-col>
        </el-row>
      </div>
    </el-col>

    <el-col :xs="24" :sm="24" :md="24" :lg="8" :xl="8">
      <el-row :gutter="20" :align="'middle'" class="justify-center content-center pb-5">
        <el-col v-if="metadata.license">
          <el-card :body-style="{ padding: '0px' }" class="mx-10 p-5">
            <h5 class="text-2xl font-medium">{{ t('object.access') }}
              <el-tooltip class="box-item" effect="light" trigger="hover"
                :content="t('object.accessTooltip')" placement="top">
                <font-awesome-icon icon="fa-solid fa-circle-info" class="ml-2 cursor-pointer" size="xs" color="gray" />
              </el-tooltip>
            </h5>
            <hr class="divider divider-gray pt-2" />
            <LicenseCard :license="metadata.license" />
          </el-card>
        </el-col>
      </el-row>

      <el-row :gutter="20" class="pb-5">
        <el-col>
          <el-card :body-style="{ padding: '0px' }" class="mx-10 p-5">
            <h5 class="text-2xl font-medium">{{ t('object.retrieveMetadata') }}</h5>
            <hr class="divider divider-gray pt-2" />
            <RetrieveDataMetadata :id="route.query.id?.toString() || 'FIXME'" />
            <template v-if="metadata.metadataLicense">
              <hr class="divider divider-gray mt-4 pb-2" />
              <h4 class="text-1xl font-medium">
                {{ t('object.metadataLicensedAs') }}
                <el-link underline="always" type="primary" :href="metadata.metadataLicense.id" target="_blank"
                  class="mx-1">
                  {{ metadata.metadataLicense.name || metadata.metadataLicense.id }}
                </el-link>
              </h4>
            </template>
          </el-card>
        </el-col>
      </el-row>

      <el-row :gutter="20" class="pb-5" v-if="metadata">
        <el-col>
          <CitationCard :metadata="metadata" />
        </el-col>
      </el-row>

      <el-row :gutter="20" class="pb-5">
        <el-col v-if="metadata['pcdm:memberOf']">
          <MemberOfCard routePath="collection" :memberOf="metadata['pcdm:memberOf']" />
        </el-col>
      </el-row>

      <el-row v-if="membersFiltered?.length">
        <el-col>
          <el-card :body-style="{ padding: '0px' }" class="mx-10 p-5">
            <h5 class="text-2xl font-medium ">{{ t('object.otherObjectsInCollection') }}</h5>
            <hr class="divider divider-gray pt-2" />
            <ul>
              <li v-for="d of membersFiltered">
                <CollectionItem :field="d" routePath="object" />
              </li>

              <li v-if="membersFiltered">
                <el-link type="primary" :href="`/search?f=${moreObjects()}`">{{ t('common.more') }}</el-link>
              </li>
            </ul>
          </el-card>
        </el-col>
      </el-row>

      <el-row :gutter="20" class="pb-5">
        <el-col>
          <TakedownCard />
        </el-col>
      </el-row>
    </el-col>
  </el-row>

  <template v-if="parts.length">
    <el-row class="m-5 pl-10 pr-12">
      <el-col :span="24" class="divide-solid divide-y-2 divide-red-700">
        <div class="grid-content p-2 m-2">
          <h2 class="text-2xl tracking-tight">
            {{ t('object.files') }} {{ parts.length }}
            <MediaTypeIcon v-for="mediaType of mediaTypes" :mediaType="mediaType" />
          </h2>
        </div>
        <div></div>
      </el-col>
    </el-row>

    <el-row class="m-5 pl-10 pr-12 pb-7">
      <el-col :span="24">
        <el-table :data="parts" stripe style="width: 100%">
          <el-table-column prop="name" :label="t('object.filename')" min-width="200">
            <template #default="scope">
              {{ scope.row.name || scope.row['@id'] }}
            </template>
          </el-table-column>

          <el-table-column prop="contentSize" :label="t('common.size')" width="120">
            <template #default="scope">
              {{ formatFileSize(scope.row.contentSize) }}
            </template>
          </el-table-column>

          <el-table-column prop="encodingFormat" :label="t('object.encodingFormat')" min-width="180">
            <template #default="scope">
              {{ formatEncodingFormat(scope.row.encodingFormat) }}
            </template>
          </el-table-column>

          <el-table-column :label="t('common.actions')" width="120">
            <template #default="scope">
              <router-link :to="`/file?id=${encodeURIComponent(scope.row['@id'])}`">
                <el-button type="primary" size="small">{{ t('common.view') }}</el-button>
              </router-link>
            </template>
          </el-table-column>
        </el-table>
      </el-col>
    </el-row>
  </template>
</template>
