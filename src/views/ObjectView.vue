<script setup lang="ts">
import { inject, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';

import AccessHelper from '@/components/AccessHelper.vue';
import CollectionItem from '@/components/CollectionItem.vue';
import LicenseCard from '@/components/cards/LicenseCard.vue';
import MemberOfCard from '@/components/cards/MemberOfCard.vue';
import MetaTopCard from '@/components/cards/MetaTopCard.vue';
import TakedownCard from '@/components/cards/TakedownCard.vue';
import MetaField from '@/components/MetaField.vue';
// import BinderHubCard from '@/components/cards/BinderHubCard.vue';
import ObjectPart from '@/components/ObjectPart.vue';
import MediaTypeIcon from '@/components/widgets/MediaTypeIcon.vue';
import MemberOfLink from '@/components/widgets/MemberOfLink.vue';
import { configuration } from '@/configuration';
import type { ApiService, EntityType, RoCrate } from '@/services/api';
import { initSnip } from '../tools';

const { object: config, conformsTo } = configuration.ui;

const api = inject<ApiService>('api');
if (!api) {
  throw new Error('API instance not provided');
}

const route = useRoute();
const router = useRouter();

const name = ref('');
const nameDisplay = ref('');
const tops = ref<{ name: string; value: string }[]>([]);
const meta = ref<{ name: string; data: string }[]>([]);
const license = ref<{ '@id': string; description: string }>({
  '@id': 'unknown',
  description: 'No license was provided',
});
const licenseText = ref('No license was provided');
const parts = ref<({ '@id': string; name: string; encodingFormat: string[] } & Record<string, string>)[]>([]);
const mediaTypes = ref<string[]>([]);
const access = ref<{ hasAccess: boolean; group?: string }>({ hasAccess: false });
const isLoading = ref(false);
const metadata = ref<RoCrate | undefined>();
// const id = ref<string>(route.query.id?.toString() || '');

const activePart = ref(false);
const membersFiltered = ref<EntityType[]>([]);

const populateName = (md: Record<string, string>) => {
  name.value = md[config.name.name];
  nameDisplay.value = md[config.name.display];
};

const populateTop = (md: Record<string, string>) => {
  tops.value = [];
  for (const field of config.top) {
    const value = md[field.name] || 'Not Defined';
    tops.value.push({ name: field.display, value: value });
  }
};

const populateMeta = (md: Record<string, string>) => {
  meta.value = [];
  const keys = Object.keys(md);
  const filtered = keys.filter((key) => !config.meta.hide.includes(key));
  for (const filter of filtered) {
    meta.value.push({ name: filter, data: md[filter] });
  }
  meta.value.sort((a, b) => a.name.localeCompare(b.name));
};

const populateLicense = (md: { license?: { '@id': string; description: string } }) => {
  license.value = md.license || license.value;
  if (!md.license?.['@id']) {
    console.log('show alert! no license no!no!');

    return;
  }

  licenseText.value = md.license.description;
};

const populateParts = (md: {
  hasPart:
    | { '@id': string; name: string; encodingFormat: string | string[] }[]
    | { '@id': string; name: string; encodingFormat: string | string[] };
}) => {
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

const populateAccess = () => {
  // FIXME: TODO where is this going to come from
  // access.value = md._access;
  access.value = { hasAccess: true };
};

const populate = (md: RoCrate) => {
  populateAccess();
  // @ts-expect-error FIX types later
  populateLicense(md);
  // @ts-expect-error FIX types later
  populateName(md);
  // @ts-expect-error FIX types later
  populateTop(md);
  // @ts-expect-error FIX types later
  populateMeta(md);
  // @ts-expect-error FIX types later
  populateParts(md);
};

const fetchdata = async () => {
  const id = route.query.id?.toString() as string;

  if (!id) {
    router.push({
      name: 'NotFound',
      params: { pathMatch: route.path.substring(1).split('/') },
      query: route.query,
      hash: route.hash,
    });

    return;
  }

  isLoading.value = true;

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

  metadata.value = md;
  populate(md);

  isLoading.value = false;

  if (md['pcdm:memberOf']) {
    membersFiltered.value = (
      await api.getEntities({
        memberOf: md['pcdm:memberOf']['@id'],
        conformsTo: conformsTo.object,
      })
    )?.entities;
  }

  initSnip({ selector: '#license', button: '#readMoreLicense' });
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
      <AccessHelper v-if="access && license" :access="access" :license="license" />

      <div class="px-5 pb-5">
        <MetaTopCard :tops="tops" :className="'py-5'" />
        <el-row class="">
          <el-col v-for="m of meta">
            <MetaField :meta="m" />
          </el-col>
        </el-row>
      </div>
    </el-col>

    <el-col :xs="24" :sm="24" :md="24" :lg="8" :xl="8">
      <el-row :gutter="20" :align="'middle'" class="justify-center content-center pb-5">
        <el-col v-if="license?.['@id']">
          <el-card :body-style="{ padding: '0px' }" class="mx-10 p-5">
            <h5 class="text-2xl font-medium">Access</h5>
            <hr class="divider divider-gray pt-2" />
            <LicenseCard v-if="license?.['@id']" :license="license" />
          </el-card>
        </el-col>
      </el-row>

      <el-row :gutter="20" class="pb-5">
        <el-col v-if="metadata['pcdm:memberOf']">
          <MemberOfCard :routePath="'collection'" :memberOf="metadata['pcdm:memberOf']" />
        </el-col>
      </el-row>

      <el-row v-if="membersFiltered?.length">
        <el-col>
          <el-card :body-style="{ padding: '0px' }" class="mx-10 p-5">
            <h5 class="text-2xl font-medium ">Other Objects in this Collection</h5>
            <hr class="divider divider-gray pt-2" />
            <ul>
              <li v-for="d of membersFiltered">
                <CollectionItem :field="d" :routePath="'object'" />
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

    <el-row class="m-5 pl-10 pr-12 pb-7">
      <el-col>
        <ul>
          <li v-for="(part, index) of parts">
            <a :id="'part-' + encodeURIComponent(part['@id'])"></a>
            <ObjectPart :parentId="route.query.id?.toString() || ''" :part="part"
              :active="isPartActive(part['@id'], index)" :license="license" :access="access" />
          </li>
        </ul>
      </el-col>
    </el-row>
  </template>
</template>
