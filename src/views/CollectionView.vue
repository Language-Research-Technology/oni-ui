<script setup lang="ts">
import { useGtm } from '@gtm-support/vue-gtm';
import { injectHead } from '@unhead/vue';
import { inject, onMounted, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';

import AccessHelper from '@/components/AccessHelper.vue';
import CollectionMembers from '@/components/CollectionMembers.vue';
import CitationCard from '@/components/cards/CitationCard.vue';
import LicenseCard from '@/components/cards/LicenseCard.vue';
import MemberOfCard from '@/components/cards/MemberOfCard.vue';
import MetaTopCard from '@/components/cards/MetaTopCard.vue';
import RetrieveDataMetadata from '@/components/cards/RetrieveDataMetadata.vue';
import SimpleRelationshipCard from '@/components/cards/SimpleRelationshipCard.vue';
import SummariesCard from '@/components/cards/SummariesCard.vue';
import TakedownCard from '@/components/cards/TakedownCard.vue';
import DownloadsModal from '@/components/DownloadsModal.vue';
import MetaField from '@/components/MetaField.vue';
import MemberOfLink from '@/components/widgets/MemberOfLink.vue';
import { useHead } from '@/composables/head';
import { ui } from '@/configuration';
import type { ApiService, EntityType, RoCrate } from '@/services/api';

const router = useRouter();
const route = useRoute();
const head = injectHead();
const gtm = useGtm();

const api = inject<ApiService>('api');
if (!api) {
  throw new Error('API instance not provided');
}

const { collection: config, conformsTo } = ui;

const id = route.query.id as string;

const errorDialogText = ref('');
const errorDialogVisible = ref(false);
const openDownloads = ref(false);
const metadata = ref<RoCrate | undefined>();
const entity = ref<EntityType | undefined>();

const conformsToCollection = conformsTo.collection;
const conformsToObject = conformsTo.object;
const findObjectByRelationship = config.relationships;

let name: string;
let nameDisplay: string;
const tops: { name: string; value: string; display?: string }[] = [];
const meta: { name: string; data: RoCrate[keyof RoCrate] }[] = [];

const populateName = (md: RoCrate) => {
  name = md[config.name.name as keyof RoCrate] as string;
  nameDisplay = md[config.name.display as keyof RoCrate] as string;
};

// TODO: Remove the duplication in the populate functions
const populateTop = (md: RoCrate) => {
  const { top } = config;
  for (const field of top) {
    const value = (md[field.name as keyof RoCrate] as string) || 'Not Defined';
    tops.push({
      name: field.name,
      display: field.display,
      value: value,
    });
  }
};

const populateMeta = (md: RoCrate) => {
  const keys = Object.keys(md) as (keyof RoCrate)[];
  const filtered = keys.filter((key) => !config.meta.hide.includes(key));
  for (const filter of filtered) {
    meta.push({ name: filter, data: md[filter] });
  }
  meta.sort((a, b) => a.name.localeCompare(b.name));
};

const populate = (md: RoCrate) => {
  populateName(md);
  populateTop(md);
  populateMeta(md);
  useHead(head, md);
};

const fetchData = async () => {
  if (!id) {
    router.push({
      name: 'NotFound',
      params: { pathMatch: route.path.substring(1).split('/') },
      query: route.query,
      hash: route.hash,
    });

    return;
  }

  try {
    const { error, entity: rawEntity, metadata: rawMeatadata } = await api.getEntity(id);
    if (error) {
      errorDialogText.value = error;
      errorDialogVisible.value = true;

      return;
    }

    if (!rawMeatadata) {
      router.push({
        name: 'NotFound',
        params: { pathMatch: route.path.substring(1).split('/') },
        query: route.query,
        hash: route.hash,
      });

      return;
    }

    gtm?.trackEvent({
      event: '/collection',
      category: 'collection',
      label: 'loaded-collection',
      value: id,
    });

    metadata.value = rawMeatadata;
    entity.value = rawEntity;

    populate(rawMeatadata);
  } catch (e) {
    console.error(e);
  }

  document.dispatchEvent(
    new Event('ZoteroItemUpdated', {
      bubbles: true,
      cancelable: true,
    }),
  );
};

watch(
  () => route.params,
  () => fetchData(),
);

onMounted(fetchData);
</script>

<template>
  <div v-if="metadata && entity" class="px-10 pt-10 pb-7 bg-white z-10">
    <el-row :align="'middle'" class="mb-2 text-3xl font-medium">
      <h5>
        <MemberOfLink v-if="metadata['pcdm:memberOf']" :memberOf="metadata['pcdm:memberOf']" />
        {{ Array.isArray(name) ? name[0] : name }}
      </h5>
    </el-row>
    <hr class="divider divider-gray pt-2" />
  </div>

  <el-row :justify="'center'" v-if="metadata && entity" class="m-5 pt2 px-10 pb-7">
    <el-col :xs="24" :sm="24" :md="14" :lg="16" :xl="16">
      <!-- @ts-expect-error Need types on config -->
      <MetaTopCard :tops="tops" :className="'px-5 py-2'" />
      <el-row class="px-5">
        <el-col v-for="m of meta">
          <MetaField :meta="m" />
        </el-col>
      </el-row>

      <el-row>
        <el-col>
          <CollectionMembers title="Sub Collections" :id="id" :conformsTo="conformsToCollection"
            :routePath="'collection'" />
        </el-col>
      </el-row>

      <el-row>
        <el-col>
          <CollectionMembers title="Objects in Collection" :id="id" :conformsTo="conformsToObject"
            :routePath="'object'" />
        </el-col>
      </el-row>
    </el-col>

    <el-col :xs="24" :sm="24" :md="10" :lg="8" :xl="8">
      <el-row v-if="metadata.license" :gutter="20" class="pb-5">
        <el-col class="overflow-visible!">
          <el-card class="mx-10 !overflow-visible">
            <h5 class="text-2xl font-medium">Access</h5>
            <hr class="divider divider-gray pt-2" />
            <AccessHelper v-if="entity.extra.access" :access="entity.extra.access" :license="metadata.license" />
            <LicenseCard v-if="metadata.license" :license="metadata.license" />
          </el-card>
        </el-col>
      </el-row>

      <el-row :gutter="20" class="pb-5" v-if="metadata['pcdm:memberOf']">
        <el-col>
          <MemberOfCard v-if="metadata['pcdm:memberOf']" :routePath="'collection'"
            :memberOf="metadata['pcdm:memberOf']" />
        </el-col>
      </el-row>

      <el-row :gutter="20" class="pb-5">
        <el-col>
          <el-card class="mx-10">
            <h5 class="text-2xl font-medium">Content</h5>
            <hr class="divider divider-gray pt-2" />
            <SummariesCard :entity="entity" />
          </el-card>
        </el-col>
      </el-row>

      <el-row :gutter="20" class="pb-5" v-if="name != undefined">
        <el-col>
          <el-card class="mx-10">
            <h5 class="text-2xl font-medium">Downloads</h5>
            <hr class="divider divider-gray pt-2" />

            <DownloadsModal :simpleView="true" :id="id" idFieldName="@id" v-model="openDownloads" />

            <el-link @click="openDownloads = !openDownloads" type="primary">Show All Related Downloads</el-link>

            <DownloadsModal v-if="entity.extra.access" :id="id" :idFieldName="'root'" v-model="openDownloads"
              :title="name" />
          </el-card>
        </el-col>
      </el-row>

      <el-row :gutter="20" class="pb-5">
        <el-col>
          <el-card class="mx-10">
            <h5 class="text-2xl font-medium">Retrieve Metadata</h5>
            <hr class="divider divider-gray pt-2" />
            <RetrieveDataMetadata :id="id" />
            <template v-if="metadata.metadataLicense?.id">
              <hr class="divider divider-gray mt-4 pb-2" />
              <h4 class="text-1xl font-medium">
                Metadata licensed as:
                <el-link underline="always" type="primary" :href="metadata.metadataLicense.id" target="_blank"
                  class="mx-1">
                  {{ metadata.metadataLicense.name ||
                    metadata.metadataLicense.id }}
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

      <el-row :gutter="20" class="pb-5" v-for="relationship of findObjectByRelationship">

        <el-col>
          <el-card class="mx-10">
            <h5 class="text-2xl font-medium ">{{ relationship.display }}</h5>
            <hr class="divider divider-gray pt-2" />
            <SimpleRelationshipCard :id="id" :objectType="relationship.type" :objectName="relationship.name" />
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

  <el-dialog v-model="errorDialogVisible" width="40%" center>
    <el-alert title="Error" type="warning" :closable="false">
      <p class="break-normal">{{ errorDialogText }}</p>
    </el-alert>
    <template #footer>
      <span class="dialog-footer">
        <el-button type="primary" @click="errorDialogVisible = false">Close</el-button>
      </span>
    </template>
  </el-dialog>
</template>
