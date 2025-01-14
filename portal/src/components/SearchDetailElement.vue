<script setup lang="ts">
import { v4 as uuid } from 'uuid';

import { initSnip, toggleSnip } from '@/tools';

import { useConfigurationStore } from '@/stores/configuration';

import { inject, ref, watch } from 'vue';
import type { ElasticService } from '@/services/elastic';
import AggregationHelper from '@/components/helpers/AggregationHelper.vue';

export type ItemType = {
  _index: 'items';
  _id: string;
  _score: number | null;
  _source: {
    '@id': string;
    identifier: [{ value: [{ '@value': string }] }];
    name: [{ '@value': string }];
    description: [{ '@value': string }];
    _crateId: [{ '@value': string }];
    _parent: [{ '@id': string }];
    _memberOf: [{ '@id': string }];
    _root: [{ '@id': string }];
    '@type': string[];
    conformsTo: [{ '@id': string }];
  };
  highlight: string[];
};

const { item } = defineProps<{
  item: ItemType;
}>();

const id = item._source['@id'];
const name = item._source.name[0]?.['@value'] || item._source.identifier[0]?.value[0]?.['@value'];
// const conformsTo = item._source.conformsTo[0]['@id'];
const types = item._source?.['@type'];
const memberOf = item._source?._memberOf;
const root = item._source?._root;
const highlight = item?.highlight;
const parent = item._source?._parent;
const details = item._source;
const score = item._score;

const es = inject<ElasticService>('es');
if (!es) {
  throw new Error('ES instance not provided');
}

const { ui } = useConfigurationStore();

const conformsToCollection = ui.conformsTo?.collection;
const conformsToObject = ui.conformsTo?.object;
const conformsToNotebook = ui.conformsTo?.notebook;
const aggregations = ref({});
const total = ref(0);
const members = ref([]);
const typeFile = ref(null);
const subCollections = ref([]);
const licenses = ui?.licenses || [];
const _uuid = uuid();
const aggConfig = ui.aggregations;
const searchDetails = ui.search?.searchDetails || [];
const descriptionSnipped = ref(false);

watch(
  () => types,
  async () => {
    await updateSummaries();
  },
);

const updateSummaries = async () => {
  let summaries;
  if (types?.includes('RepositoryCollection')) {
    subCollections.value = await filter({
      'memberOf.@id': [id],
      'conformsTo.@id': [conformsToCollection],
    });
    members.value = await filter({
      '_collectionStack.@id': [id],
      'conformsTo.@id': [conformsToObject],
    });
    summaries = await filter({
      '_collectionStack.@id': [id],
    });
  }

  if (types?.includes('RepositoryObject')) {
    summaries = await filter({
      '_parent.@id': [id],
    });
  }

  aggregations.value = summaries?.aggregations || [];

  // Get the buckets to extract one value: File counts
  const buckets = summaries?.aggregations?.['@type']?.buckets;
  if (buckets) {
    typeFile.value = buckets.find((obj) => obj.key === 'File');
  }

  total.value = members.value?.total;
  if (!descriptionSnipped.value) {
    initSnip({ selector: `#desc_${_uuid}`, lines: 3 });
  }
};

//TODO: refactor this integrate to multi
const filter = async (filters: Record<string, string[]>) => {
  const result = await es.multi({
    filters: filters,
    sort: 'relevance',
    order: 'desc',
  });

  if (result.hits.length > 0) {
    return {
      data: result.hits,
      aggregations: result.aggregations,
      total: result.total,
      // scrollId: result._scroll_id,
      route: null,
    };
  }
};

const findLicense = (detail) => {
  const key = detail[0]?.['@id'];
  const license = licenses.find((l) => l.license === key);

  if (license) {
    if (!license.access) {
      return 'login';
    }

    return license.access;
  }

  return 'public';
};

const getSearchDetailUrl = (item: ItemType) => {
  //console.log(item);
  //TODO: this is not good, maybe do it with a ConformsTo to specify link. But have to think about it because not
  //      all files have conformsTo!
  let url: string;

  const types = item._source['@type'];
  const repoType = types.find((t) => t === 'RepositoryCollection');
  const fileType = types.find((t) => t === 'File');
  const itemType = types.find((t) => t === 'RepositoryObject');

  let id = encodeURIComponent(item._source['@id']);
  const crateId = encodeURIComponent(item._source._crateId?.[0]?.['@value']);
  if (repoType) {
    url = `/collection?id=${id}&_crateId=${crateId}`;
  } else if (itemType) {
    url = `/object?id=${id}&_crateId=${crateId}`;
  } else if (fileType) {
    const isNotebook = !!item._source.conformsTo?.find((c) => c['@id'] === conformsToNotebook);
    console.log('🪚 isNotebook:', isNotebook);

    if (isNotebook) {
      id = encodeURIComponent(item._id);
      url = `/object?id=${id}`;
    } else {
      const fileId = id;
      id = encodeURIComponent(item._source._parent[0]?.['@id']);
      url = `/object?id=${id}&_crateId=${crateId}&fileId=${fileId}`;
    }
  } else {
    //Defaults to object if it doesnt know what it is
    url = `/object?id=${id}&_crateId=${crateId}`;
  }
  return url;
};

const getValue = (name) => {
  //this is because this!! value = "first(first(details.modality)?.['name'])?.['@value']"
  if (name.includes('name')) {
    const det = /[^.]*/.exec(name)?.[0];

    return details[det][0]?.['name'][0]?.['@value'];
  }

  const det = /[^.]*/.exec(name)?.[0];

  return details[det][0]?.['@value'];
};

const href = getSearchDetailUrl(item);

updateSummaries();
</script>

<template>
  <div><!-- Wrapping an empty div because of multiple roots with v-for-->
    <el-row>
      <el-col :xs="24" :sm="15" :md="15" :lg="17" :xl="19" :span="20">
        <el-row :align="'middle'">
          <h5 class="text-2xl font-medium dark:text-white">
            <router-link :to="href" class="text-blue-600 hover:text-blue-800 visited:text-purple-600 break-words">
              {{ name || id }}
            </router-link>
          </h5>
        </el-row>

        <el-row :align="'middle'">
          <p class="font-normal text-gray-700 dark:text-gray-400">
            Type:
          </p>
          <div class="flex flex-wrap">
            <span class="m-2" v-for="type of types">{{ type }}</span>
          </div>
        </el-row>

        <template v-for="special of searchDetails">
          <el-row v-if="types && types.includes('RepositoryCollection')">
            <p class="font-normal text-gray-700 dark:text-gray-400">
              {{ special.label }}:&nbsp;
            </p>
            <AggregationHelper :asIcons=false :aggregations="aggregations"
              :field="{ 'name': special.name, 'display': special.label }" />
          </el-row>

          <el-row v-else v-if="details?.[special.field]">
            <p class="font-normal text-gray-700 dark:text-gray-400">
              {{ special.label }}:&nbsp;
            </p>
            <span v-for="l of details?.[special.field]">{{ l?.name[0]?.['@value'] }}</span>
            <p>{{ details?.[special.field][0]?.['@value'] }}</p>
          </el-row>
        </template>

        <el-row :align="'middle'" v-if="Array.isArray(memberOf) && memberOf.length > 0" class="">
          <p class="font-normal text-gray-700 dark:text-gray-400">
            Member of:&nbsp;
          </p>
          <div class="flex flex-wrap">
            <router-link v-for="mO of memberOf" class="text-sm m-2 text-gray-700 dark:text-gray-300 underline"
              :to="'/collection?id=' + encodeURIComponent(mO?.['@id']) + '&_crateId=' + encodeURIComponent(mO?.['@id'])">
              {{ mO?.name[0]?.['@value'] || mO?.['@id'] }}
            </router-link>
          </div>
        </el-row>

        <el-row :align="'middle'" v-if="Array.isArray(parent) && parent.length > 0" class="pt-2">
          <p class="font-normal text-gray-700 dark:text-gray-400" v-if="!Array.isArray(memberOf)">
            &nbsp;In:&nbsp;
          </p>
          <div class="flex flex-wrap" v-if="!Array.isArray(memberOf)">
            <router-link
              :to="'/collection?id=' + encodeURIComponent(root?.['@id']) + '&_crateId=' + encodeURIComponent(root?.['@id'])">
              <el-button>{{ root[0]?.name[0]?.['@value'] || root[0]?.['@id'] }}</el-button>
            </router-link>
          </div>
        </el-row>


        <!-- NOTE: Temp comment out as old version doesn't have this due to bug -->
        <!-- <el-row align="middle"> -->
        <!--   <p class="font-normal text-gray-700 dark:text-gray-400"> -->
        <!--     {{ conformsTo }} -->
        <!--   </p> -->
        <!-- </el-row> -->

        <el-row class="py-4 pr-4" v-if="details?.description?.[0]">
          <p :id="'desc_' + _uuid">{{ details?.description[0]?.['@value'] }}</p>
        </el-row>

        <el-row v-if="types && types.includes('RepositoryCollection')">
          <span v-if="subCollections">Collections: {{ subCollections?.total }},&nbsp;</span>
          <span v-if="total > 0">Objects: {{ total }}</span>
          <span v-if="typeFile"><span v-if="total > 0">,&nbsp;</span>Files: {{ typeFile?.['doc_count'] }}</span>
        </el-row>

        <el-row :align="'middle'" v-if="highlight">
          <ul>
            <li v-for="hl of highlight" v-html="'...' + hl[0] + '...'" class="p-2"></li>
          </ul>
        </el-row>

        <el-row v-if="score" class="pt-2">
          <div>
            <font-awesome-icon icon="fa-solid fa-5x fa-award" />
            Relevance Score: {{ score }}
          </div>
        </el-row>

        <el-row class="py-2">
          <el-link type="primary" :underline="false" :href="href">See more</el-link>
        </el-row>
      </el-col>

      <el-col :xs="24" :sm="9" :md="9" :lg="7" :xl="5" :span="4" :offset="0">
        <el-row :span="24" class="flex justify-center" v-for="agg of aggConfig">
          <template v-if="agg.icons">
            <AggregationHelper :asIcons="true" :aggregations="aggregations"
              :field="{ 'name': agg.name, 'display': agg.display }" />
          </template>
        </el-row>
      </el-col>
    </el-row>
    <hr class="divide-y divide-gray-500" />
  </div>
</template>
