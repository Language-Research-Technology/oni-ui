<script setup lang="ts">
import { useGtm } from '@gtm-support/vue-gtm';
import { injectHead } from '@unhead/vue';
import { inject, ref, watch } from 'vue';
import { useRoute } from 'vue-router';
import AccessHelper from '@/components/AccessHelper.vue';
import CollectionItem from '@/components/CollectionItem.vue';
import CitationCard from '@/components/cards/CitationCard.vue';
import LicenseCard from '@/components/cards/LicenseCard.vue';
import MemberOfCard from '@/components/cards/MemberOfCard.vue';
import RetrieveDataMetadata from '@/components/cards/RetrieveDataMetadata.vue';
import TakedownCard from '@/components/cards/TakedownCard.vue';
import MetaField from '@/components/MetaField.vue';
import ObjectPart from '@/components/ObjectPart.vue';
import MediaTypeIcon from '@/components/widgets/MediaTypeIcon.vue';
import MemberOfLink from '@/components/widgets/MemberOfLink.vue';
import { useHead } from '@/composables/head';
import { useEntityView } from '@/composables/useEntityView';
import { ui } from '@/configuration';
import type { ApiService, EntityType, RoCrate } from '@/services/api';

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

const activePart = ref(false);
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

const isPartActive = (id: string, index: number) => {
  if (route.query.fileId === id) {
    activePart.value = true;
    return true;
  }

  if (index === 0 && !activePart.value) {
    return true;
  }

  return false;
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
            <h5 class="text-2xl font-medium">Access
              <el-tooltip class="box-item" effect="light" trigger="hover"
                content="License and access conditions for the current object." placement="top">
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
            <h5 class="text-2xl font-medium">Retrieve Metadata</h5>
            <hr class="divider divider-gray pt-2" />
            <RetrieveDataMetadata :id="route.query.id?.toString() || 'FIXME'" />
            <template v-if="metadata.metadataLicense">
              <hr class="divider divider-gray mt-4 pb-2" />
              <h4 class="text-1xl font-medium">
                Metadata licensed as:
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
            <h5 class="text-2xl font-medium ">Other Objects in this Collection</h5>
            <hr class="divider divider-gray pt-2" />
            <ul>
              <li v-for="d of membersFiltered">
                <CollectionItem :field="d" routePath="object" />
              </li>

              <li v-if="membersFiltered">
                <el-link type="primary" :href="`/search?f=${moreObjects()}`">more...</el-link>
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
            Files: {{ parts.length }}
            <MediaTypeIcon v-for="mediaType of mediaTypes" :mediaType="mediaType" />
          </h2>
        </div>
        <div></div>
      </el-col>
    </el-row>

    <el-row v-if="entity && metadata" class="m-5 pl-10 pr-12 pb-7">
      <el-col>
        <ul>
          <li v-for="(part, index) of parts">
            <a :id="'part-' + encodeURIComponent(part['@id'])"></a>
            <ObjectPart :parentId="route.query.id?.toString() || ''" :part="part"
              :active="isPartActive(part['@id'], index)" :license="metadata.license" :access="entity.access" />
          </li>
        </ul>
      </el-col>
    </el-row>
  </template>
</template>
