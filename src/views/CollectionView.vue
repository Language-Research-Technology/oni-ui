<script setup lang="ts">
import { onMounted, ref, inject } from 'vue';
import { useRoute, useRouter } from 'vue-router';

import MemberOfLink from '@/components/widgets/MemberOfLink.vue';
import MetaTopCard from '@/components/cards/MetaTopCard.vue';
import MetaField from '@/components/MetaField.vue';
import CollectionMembers from '@/components/CollectionMembers.vue';
import MemberOfCard from '@/components/cards/MemberOfCard.vue';
import RetrieveDataMetadata from '@/components/cards/RetrieveDataMetadata.vue';
import TakedownCard from '@/components/cards/TakedownCard.vue';
// import SimpleRelationshipCard from '@/components/cards/SimpleRelationshipCard.vue';
// import SummariesCard from '@/components/cards/SummariesCard.vue';

import type { ApiService, RoCrate } from '@/services/api';

const router = useRouter();
const route = useRoute();

const api = inject<ApiService>('api');
if (!api) {
  throw new Error('API instance not provided');
}

import { useConfigurationStore } from '@/stores/configuration';
const { ui } = useConfigurationStore();

const {
  collection: config,
  // main: { fields },
  conformsTo,
} = ui;

const id = route.query.id as string;

const errorDialogText = ref('');
const errorDialogVisible = ref(false);
const metadata = ref<RoCrate | undefined>();

// license: undefined,
const conformsToCollection = conformsTo.collection;
const conformsToObject = conformsTo.object;
// const findObjectByRelationship = ui.collection.relationships;
// const aggregations = [];

let name: string;
let nameDisplay: string;
const tops: { name: string; value: string; help?: { id: string; display?: string | undefined } }[] = [];
const meta: { name: string; data: Record<string, string>; help: { id: string; display?: string | undefined } }[] = [];

const populateName = (md: Record<string, object>) => {
  name = md[config.name.name] as unknown as string;
  nameDisplay = md[config.name.display] as unknown as string;
};

// TODO: Remove the duplication in the populate functions
const populateTop = (md: Record<string, string>) => {
  const { top } = config;
  for (const field of top) {
    const helper = {
      id: field.name,
      display: field.display,
      url: '',
      definition: 'TODO: Add definition',
    };

    const value = md[field.name] || 'Not Defined';
    tops.push({
      name: field.display,
      value: value,
      help: helper,
    });
  }
};

const populateMeta = (md: Record<string, Record<string, string>>) => {
  const keys = Object.keys(md);
  const filtered = keys.filter((key) => !config.meta.hide.includes(key));
  for (const filter of filtered) {
    const helper = {
      id: filter,
      display: filter,
      url: '',
      definition: 'TODO: Add definition',
    };
    meta.push({ name: filter, data: md[filter], help: helper });
  }
  meta.sort((a, b) => a.name.localeCompare(b.name));
};

const populate = (md: Record<string, object>) => {
  populateName(md);
  // @ts-expect-error This type is complicated ignore for now
  populateTop(md);
  // @ts-expect-error This type is complicated ignore for now
  populateMeta(md);
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
    const { errors, metadata: md } = await api.getRoCrate(id);
    if (errors) {
      errorDialogText.value = errors;
      errorDialogVisible.value = true;

      return;
    }

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

    // const summaries = await this.filter({ '_collectionStack.@id': [this.$route.query.id] });
    // this.aggregations = summaries.aggregations;
  } catch (e) {
    console.error(e);
  }
};

onMounted(fetchData);
</script>

<template>
  <div class="px-10 pt-10 pb-7 bg-white z-10">
    <el-row :align="'middle'" class="mb-2 text-3xl font-medium dark:text-white">
      <h5>
        <MemberOfLink v-if="metadata?.memberOf" :memberOf="metadata.memberOf" />
        {{ name }}
      </h5>
    </el-row>
    <hr class="divider divider-gray pt-2" />
  </div>

  <el-row :justify="'center'" v-if="metadata" class="m-5 pt2 px-10 pb-7">
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
      <el-row v-if="metadata.license" :gutter="20" :align="'middle'" class="justify-center content-center pb-5">
        <el-col>
          <el-card :body-style="{ padding: '0px' }" class="mx-10 p-5">
            <h5 class="text-2xl font-medium">Access</h5>
            <hr class="divider divider-gray pt-2" />
            <h4 class="text-1xl font-medium">
              Content in this collection is licensed as:
            </h4>
            <ul class="list-disc my-2 mx-3 pl-2">
              <li> {{ metadata.license.name }} </li>
            </ul>
          </el-card>
        </el-col>
      </el-row>

      <el-row :gutter="20" class="pb-5" v-if="metadata.memberOf">
        <el-col>
          <MemberOfCard v-if="metadata.memberOf" :routePath="'collection'" :memberOf="metadata.memberOf" />
        </el-col>
      </el-row>

      <!-- <el-row :gutter="20" class="pb-5"> -->
      <!--   <el-col> -->
      <!--     <el-card :body-style="{ padding: '0px' }" class="grid mx-10 p-5"> -->
      <!--       <h5 class="text-2xl font-medium">Content</h5> -->
      <!--       <hr class="divider divider-gray pt-2" /> -->
      <!--       <SummariesCard :aggregations="aggregations" :fields="fields || []" :name="'summaries'" -->

      <!--         :id="this.$route.query.id" :root="this.metadata._root" /> -->
      <!--       <SummariesCard :aggregations="aggregations" -->
      <!--         :fields="[{ 'name': 'license.name.@value', 'display': 'Data licenses for access' }]" :name="'licenses'" -->

      <!--         :id="this.$route.query.id" :root="this.metadata._root" /> -->
      <!--     </el-card> -->
      <!--   </el-col> -->
      <!-- </el-row> -->

      <el-row :gutter="20" class="pb-5">
        <el-col>
          <el-card :body-style="{ padding: '0px' }" class="mx-10 p-5">
            <h5 class="text-2xl font-medium">Retrieve Metadata</h5>
            <hr class="divider divider-gray pt-2" />
            <RetrieveDataMetadata :id="id" />
            <template v-if="metadata.metadataLicense?.id">
              <hr class="divider divider-gray mt-4 pb-2" />
              <h4 class="text-1xl font-medium">
                Metadata licensed as:
                <el-link underline="underline" type="primary" :href="metadata.metadataLicense.id" target="_blank"
                  class="mx-1">
                  {{ metadata.metadataLicense.name ||
                    metadata.metadataLicense.id }}
                </el-link>
              </h4>
            </template>
          </el-card>
        </el-col>
      </el-row>

      <!-- <el-row :gutter="20" class="pb-5" v-for="relationship of findObjectByRelationship"> -->

      <!--   <el-col> -->
      <!--     <el-card :body-style="{ padding: '0px' }" class="mx-10 p-5"> -->
      <!--       <h5 class="text-2xl font-medium ">{{ relationship.display }}</h5> -->
      <!--       <hr class="divider divider-gray pt-2" /> -->
      <!--       <SimpleRelationshipCard :id="id" :objectType="relationship.type" -->
      <!--         :objectName="relationship.name" /> -->
      <!--     </el-card> -->
      <!--   </el-col> -->
      <!-- </el-row> -->

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
