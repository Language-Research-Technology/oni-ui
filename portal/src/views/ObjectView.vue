<script setup lang="ts">
import { ref, onMounted, inject } from 'vue';

// import AggregationAsIcon from '@/components/widgets/AggregationAsIcon.vue';
import AccessHelper from '@/components/AccessHelper.vue';
// import BinderHubCard from '@/components/cards/BinderHubCard.vue';
import ObjectPart from '@/components/ObjectPart.vue';
import MetaField from '@/components/MetaField.vue';
import LicenseCard from '@/components/cards/LicenseCard.vue';
import MemberOfCard from '@/components/cards/MemberOfCard.vue';
import MemberOfLink from '@/components/widgets/MemberOfLink.vue';
import MetaTopCard from '@/components/cards/MetaTopCard.vue';
import TakedownCard from '@/components/cards/TakedownCard.vue';
import { initSnip } from '../tools';
import type { ApiService } from '@/api.service';

import { useConfigurationStore } from '@/stores/configuration';
import { useRoute, useRouter } from 'vue-router';

const { ui /*, api: apiConfig */ } = useConfigurationStore();

const {
  object: config,
  main: { fields },
  helpers,
} = ui;
// const { conformsTo: { object: conformsToObject } } = apiConfig;

const api = inject<ApiService>('api');
if (!api) {
  throw new Error('API instance not provided');
}

const route = useRoute();
const router = useRouter();

const name = ref('');
const nameDisplay = ref('');
const tops = ref<{ name: string; value: string | { '@value': string } }[]>([]);
const meta = ref<{ name: string; data: string | { '@value': string }; help: object }[]>([]);
const license = ref<{ '@id': string; description: string }>();
const licenseText = ref('');
const parts = ref<{ encodingFormat: string }[]>([]);
const uniqueParts = ref<string[]>([]);
const access = ref<{ hasAccess: boolean }>();
const isLoading = ref(false);
const metadata = ref({});

const id = route.query.id?.toString();

const activePart = ref(false);
// const membersFiltered = {};

const populateName = (md: Record<string, string>) => {
  name.value = md[config.name.name];
  nameDisplay.value = md[config.name.display];
};

const populateTop = (md: Record<string, string>) => {
  for (const field of config.top) {
    const value = md[field.name] || { '@value': 'Not Defined' };
    tops.value.push({ name: field.display, value: value });
  }
};

const populateMeta = (md: Record<string, string>) => {
  const keys = Object.keys(md);
  const filtered = keys.filter((key) => !config.meta.hide.includes(key));
  for (const filter of filtered) {
    // @ts-expect-error Need types on config
    const helper = helpers.find((h) => h.id === filter) || {
      id: filter,
      display: filter,
      url: '',
      definition: 'TODO: Add definition',
    };
    meta.value.push({ name: filter, data: md[filter], help: helper });
  }
  meta.value.sort((a, b) => a.name.localeCompare(b.name));
};

const populateLicense = (md: { license?: { '@id': string; description: string } }) => {
  license.value = md.license;
  if (!md.license?.['@id']) {
    console.log('show alert! no license no!no!');

    return;
  }

  licenseText.value = md.license.description;
};

const populateParts = (md: { hasPart: { encodingFormat: string }[] }) => {
  // TODO: Fix ro-crate-js so it returns arrays for things that are arrays even with array: false
  parts.value = md.hasPart && Array.isArray(md.hasPart) ? md.hasPart : [md.hasPart];

  if (parts.value.length) {
    const up = parts.value.map((p) => p.encodingFormat);
    uniqueParts.value = [...new Set(up)];
  }
};

const populateAccess = () => {
  // FIXME: Use real data
  // access.value = md._access;
  access.value = { hasAccess: true };
};

const populate = (md: Record<string, string>) => {
  // @ts-expect-error Need types on config
  populateAccess(md);
  populateLicense(md);
  populateName(md);
  populateTop(md);
  populateMeta(md);
  // @ts-expect-error Need types on config
  populateParts(md);
};

const fetchdata = async () => {
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
  await populate(md);

  isLoading.value = false;

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

//TODO: refactor this integrate to multi
// const filter = async (filters, scroll) => {
//   try {
//     const items = await this.$elasticService.multi({ scroll, filters, sort: 'relevance', order: 'desc' });
//     if (items?.hits?.hits.length > 0) {
//       return {
//         data: items?.hits?.hits,
//         aggregations: items?.aggregations,
//         total: items.hits?.total.value,
//         scrollId: items?._scroll_id,
//         route: null,
//       };
//     }
//   } catch (e) {
//     console.error(e);
//     return {
//       data: [],
//       aggregations: {},
//       total: 0,
//       scrollId: null,
//       route: null,
//     };
//   }
// };

// const moreObjects = () => {
//   const filter = {
//     '_memberOf.@id': [encodeURIComponent(id)],
//   };
//   return encodeURIComponent(JSON.stringify(filter));
// };

onMounted(fetchdata);

// const updated = async () {
// const fileId = route.query.fileId;
// if (fileId) {
//   setTimeout(function () {
//     const fileElement = document.getElementById('part-' + encodeURIComponent(fileId));
//     fileElement.scrollIntoView({behavior: 'smooth', block: 'start', inline: 'start'});
//   }, 200);
// }
// if (id) {
//   membersFiltered.value = await filter(
//     {
//       '_memberOf.@id': [id],
//       'conformsTo.@id': [conformsToObject],
//     },
//     false,
//   );
// }
// },
</script>

<template>
  <div v-if="metadata?.memberOf" class="px-10 pt-10 pb-7 bg-white">
    <el-row :align="'middle'" class="mb-2 text-3xl font-medium dark:text-white">
      <h5>
        <member-of-link :memberOf="metadata.memberOf" />
        {{ name }}
      </h5>
    </el-row>
    <hr class="divider divider-gray pt-2" />
  </div>

  <el-row :justify="'center'" v-if="metadata" class="m-5 px-10" v-loading="isLoading">
    <el-col :xs="24" :sm="24" :md="24" :lg="16" :xl="16">
      <AccessHelper v-if="access" :access="access" :license="license" />

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
            <license-card v-if="license?.['@id']" :license="license" />
          </el-card>
        </el-col>
      </el-row>

      <el-row :gutter="20" class="pb-5">
        <el-col v-if="metadata.memberOf">
          <MemberOfCard :routePath="'collection'" :memberOf="metadata.memberOf" />
        </el-col>
      </el-row>

      <!--     <el-row v-if="membersFiltered?.data && membersFiltered?.data.length"> -->
      <!--       <el-col> -->
      <!--         <el-card :body-style="{ padding: '0px' }" class="mx-10 p-5"> -->
      <!--           <h5 class="text-2xl font-medium ">Other Objects in this Collection</h5> -->
      <!--           <hr class="divider divider-gray pt-2"/> -->
      <!--           <ul> -->
      <!--             <li v-for="d of membersFiltered.data"> -->
      <!--               <collection-item :field="d._source" :routePath="'object'"/> -->
      <!--             </li> -->
      <!--             <li v-if="membersFiltered"> -->
      <!--               <el-link type="primary" :href="`/search?f=${moreObjects()}`">more...</el-link> -->
      <!--             </li> -->
      <!--           </ul> -->
      <!--         </el-card> -->
      <!--       </el-col> -->
      <!--     </el-row> -->
      <!--     <el-row :gutter="20" class="pb-5"> -->
      <!--       <el-col> -->
      <!--         <BinderHubCard v-if="metadata['gitName']" -->
      <!--                        :gitOrg="metadata['gitOrg']" -->
      <!--                        :gitName="metadata['gitName']" -->
      <!--                        :gitBranch="metadata['gitBranch']" -->
      <!--                        :filepath="metadata['filepath']" -->
      <!--         /> -->
      <!--       </el-col> -->
      <!--     </el-row> -->

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
          <h2 class="text-2xl tracking-tight dark:text-white">
            Files: {{ parts.length }}
            <!-- <AggregationAsIcon v-for="part of uniqueParts" :item="part" -->
            <!-- :field="{ 'name': 'File', 'display': 'File' }" :id="id" /> -->
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
            <ObjectPart :part="part" :active="isPartActive(part['@id'], index)" :parentName="name" :parentId="id"
              :license="license" :access="access" />
          </li>
        </ul>
      </el-col>
    </el-row>
  </template>
</template>
