<template>
  <div><!-- Wrapping an empty div because of multiple roots with v-for-->
    <el-row>
      <el-col :xs="24" :sm="15" :md="15" :lg="17" :xl="19" :span="20">
        <el-row :align="'middle'">
          <h5 class="text-2xl font-medium dark:text-white">
            <router-link :to="href" class="text-blue-600 hover:text-blue-800 visited:text-purple-600 break-words">
              {{ this.name || this.id }}
            </router-link>
          </h5>
        </el-row>
        <el-row :align="'middle'">
          <p class="font-normal text-gray-700 dark:text-gray-400 dark:text-white">
            Type:
          </p>
          <div class="flex flex-wrap">
            <span class="m-2" v-for="type of types">{{ type }}</span>
          </div>
        </el-row>
        <template v-for="special of searchDetails">
          <el-row v-if="types && types.includes('FIXMERepositoryCollection')">
            <p class="font-normal text-gray-700 dark:text-gray-400 dark:text-white">
              {{ special.label }}:&nbsp;
            </p>
            <AggregationHelper :asIcons=false
                               :aggregations="aggregations"
                               :field="{ 'name': special.name, 'display': special.label }"
                               :id="id"/>
          </el-row>
          <el-row v-else v-if="details[special.field]">
            <p class="font-normal text-gray-700 dark:text-gray-400 dark:text-white">
              {{ special.label }}:&nbsp;
            </p>
            <p>{{ details[special.field][special.name] }}</p>
          </el-row>
        </template>
        <el-row :align="'middle'" v-if="Array.isArray(memberOf) && memberOf.length > 0" class="">
          <p class="font-normal text-gray-700 dark:text-gray-400 dark:text-white">
            Member of:&nbsp;
          </p>
          <div class="flex flex-wrap">
            <router-link v-for="mO of memberOf"
               class="text-sm m-2 text-gray-700 dark:text-gray-300 underline"
               :to="'/collection?id=' + encodeURIComponent(mO['@id'])">
              {{ mO.name || mO['@id'] }}
            </router-link>
          </div>
        </el-row>
        <el-row :align="'middle'" v-if="Array.isArray(parent) && parent.length > 0" class="pt-2">
          <!--      <p class="font-normal text-gray-700 dark:text-gray-400 dark:text-white">-->
          <!--        From:&nbsp;-->
          <!--      </p>-->
          <!--      <div class="flex flex-wrap">-->
          <!--        <a v-for="p of parent" :href="'/item?id=' + encodeURIComponent(p?.['@id']) + '&_crateId=' + encodeURIComponent(p?.['@id'])">-->
          <!--          <el-button>{{ first(p?.name)?.['@value'] || p?.['@id'] }}</el-button>-->
          <!--        </a>-->
          <!--      </div>-->
          <p class="font-normal text-gray-700 dark:text-gray-400 dark:text-white" v-if="!Array.isArray(memberOf)">
            &nbsp;In:&nbsp;
          </p>
          <div class="flex flex-wrap" v-if="!Array.isArray(memberOf)">
            <router-link
                :to="'/collection?id=' + encodeURIComponent(root['@id'])">
              <el-button>{{ root.name || root['@id'] }}</el-button>
            </router-link>
          </div>
        </el-row>
        <el-row :align="'middle'">
          <p class="font-normal text-gray-700 dark:text-gray-400 dark:text-white">
            {{ conformsTo }}
          </p>
        </el-row>
        <el-row class="py-4 pr-4" v-if="details.description">
          <p :id="'desc_'+_uuid">{{ details.description }}</p>
        </el-row>
        <el-row>
          <span class="after:content-[',']" v-if="!isEmpty(subCollections)">Collections: {{ subCollections?.total }}</span>
          <span class="after:content-[',']" v-if="details.metadata?.objectsCount > 0">Objects: {{ details.metadata.objectsCount }}</span>
          <span class="after:content-[',']" v-if="details.metadata?.filesCount > 0">Files: {{ details.metadata.filesCount }}</span>
        </el-row>
        <el-row :align="'middle'" v-if="highlight">
          <ul>
            <li v-for="hl of highlight" v-html="'...' + first(hl) + '...'" class="p-2"></li>
          </ul>
        </el-row>
        <el-row v-if="score" class="pt-2">
          <div>
            <font-awesome-icon icon="fa-solid fa-5x fa-award"/>
            Relevance Score: {{ score }}
          </div>
        </el-row>
        <el-row class="py-2">
          <el-link type="primary" :underline="false" :href="href">See more</el-link>
        </el-row>
      </el-col>
      <el-col :xs="24" :sm="9" :md="9" :lg="7" :xl="5" :span="4" :offset="0">
        <template v-if="types.includes('RepositoryCollection') || types.includes('RepositoryObject')">
          <el-row :span="24" class="flex justify-center" v-for="agg of aggConfig">
            <template v-if="agg.icons">
              <AggregationHelper :asIcons="true"
                                 :aggregations="aggregations"
                                 :field="{ 'name': agg.name, 'display': agg.display }"
                                 :id="id"/>
            </template>
          </el-row>
        </template>
        <template v-else>
          <el-row :span="24" class="flex justify-center" v-for="agg of aggConfig">
            <template v-if="agg.icons">
              <template v-if="agg.name === 'license.@id'"><!--This is needed because license comes from configuration-->
                <AggregationHelper :asIcons="true"
                                   :item="findLicense(details.license)"
                                   :field="{'display': 'Licence'}"/>
              </template>
              <template v-else>
                <AggregationHelper :asIcons="true"
                                   :item="getValue(agg.name)"
                                   :field="{ 'name': agg.name, 'display': agg.display }"
                                   :id="id"/>
              </template>
            </template>
          </el-row>
        </template>
      </el-col>
    </el-row>
    <hr class="divide-y divide-gray-500"/>
  </div>
</template>
<script>
import { find, first, isEmpty, isUndefined, merge, toArray } from 'lodash';
import { v4 as uuid } from 'uuid';
import { initSnip, toggleSnip } from '../tools';
import SummariesCard from './cards/SummariesCard.component.vue';
import AggregationHelper from './helpers/AggregationHelper.component.vue';
import AggregationAsIcon from './widgets/AggregationAsIcon.component.vue';

export default {
  components: {
    SummariesCard,
    AggregationHelper,
    AggregationAsIcon,
  },
  props: ['id', 'href', 'name', 'conformsTo', 'types', 'memberOf', 'root', 'highlight', 'parent', 'details', 'score'],
  data() {
    return {
      fields: this.$store.state.configuration.ui.main.fields || [],
      conformsToCollection: this.$store.state.configuration.ui.conformsTo?.collection,
      conformsToObject: this.$store.state.configuration.ui.conformsTo?.object,
      parentId: '',
      parentName: '',
      aggregations: this.$store.state.configuration.ui.aggregations,
      total: 0,
      members: [],
      typeFile: null,
      subCollections: [],
      licenses: this.$store.state.configuration.ui?.licenses || [],
      _uuid: uuid(),
      aggConfig: this.$store.state.configuration.ui.aggregations,
      searchDetails: this.$store.state.configuration.ui.search.searchDetails || [],
    };
  },
  // watch: {
  //   'types': {
  //     async handler() {
  //       await this.updateSummaries();
  //     },
  //     flush: 'post',
  //     immediate: true
  //   }
  // },
  // async mounted() {
  //   await this.updateSummaries();
  // },
  // async computed() {
  //   await this.updateSummaries();
  // },
  methods: {
    first,
    toArray,
    isEmpty,
    //   getFilter({field, id}) {
    //     const filter = {};
    //     filter[field] = [id];
    //     let filterEncoded = encodeURIComponent(JSON.stringify(filter));
    //     if (this.$route.query.f) {
    //       filterEncoded = this.mergeQueryFilters({filters: this.$route.query.f, filter})
    //     }
    //     if (this.$route.query.q) {
    //       const searchQuery = `q=${this.$route.query.q}`;
    //       return `/search?${searchQuery}&f=${filterEncoded}`;
    //     } else {
    //       return `/search?f=${filterEncoded}`;
    //     }
    //   },
    //   mergeQueryFilters({filters, filter}) {
    //     let decodedFilters = decodeURIComponent(filters);
    //     decodedFilters = JSON.parse(decodedFilters);
    //     const merged = merge(decodedFilters, filter);
    //     return encodeURIComponent(JSON.stringify(merged));
    //   },
    //   async updateSummaries() {
    //     let summaries;
    //     if (this.types && this.types.includes('RepositoryCollection')) {
    //       this.subCollections = await this.filter({
    //         'memberOf.@id': [this.id],
    //         'conformsTo.@id': [this.conformsToCollection]
    //       });
    //       this.members = await this.filter({
    //         '_collectionStack.@id': [this.id],
    //         'conformsTo.@id': [this.conformsToObject]
    //       });
    //       summaries = await this.filter({
    //         '_collectionStack.@id': [this.id]
    //       });
    //     }
    //     if (this.types && this.types.includes('RepositoryObject')) {
    //       if (this.types.includes('RepositoryObject')) {
    //         summaries = await this.filter({
    //           '_parent.@id': [this.id]
    //         });
    //       }
    //     }
    //     this.aggregations = summaries?.aggregations;
    //     // Get the buckets to extract one value: File counts
    //     const buckets = summaries?.aggregations?.['@type']?.buckets;
    //     if (buckets) {
    //       this.typeFile = find(buckets, (obj) => obj.key === 'File');
    //     }
    //     this.total = this.members?.total;
    //     if (!this.descriptionSnipped) {
    //       initSnip({selector: '#desc_' + this._uuid, lines: 3});
    //     }
    //     this.loading = false;
    //   },
    //   //TODO: refactor this integrate to multi
    //   async filter(filters) {
    //     const items = await this.$elasticService.multi({
    //       filters: filters,
    //       sort: 'relevance',
    //       order: 'desc'
    //     });
    //     if (items?.hits?.hits.length > 0) {
    //       return {
    //         data: items?.hits?.hits,
    //         aggregations: items?.aggregations,
    //         total: items.hits?.total.value,
    //         scrollId: items?._scroll_id,
    //         route: null
    //       }
    //     }
    //   },
    //   findLicense(detail) {
    //     const key = first(detail)?.['@id'];
    //     let license = this.licenses.find(l => l.license === key);
    //     if (license) {
    //       if (isUndefined(license.access)) {
    //         return 'login';
    //       } else {
    //         return license.access;
    //       }
    //     } else {
    //       return 'public';
    //     }
    //   },
    //   getValue(name) {
    //     //this is because this!! value = "first(first(details.modality)?.['name'])?.['@value']"
    //     if (name.includes('name')) {
    //       let det = /[^.]*/.exec(name)?.[0];
    //       return first(first(this.details[det])?.['name'])?.['@value']
    //     } else {
    //       let det = /[^.]*/.exec(name)?.[0];
    //       return first(this.details[det])?.['@value']
    //     }
    //   },
    //   doSnip(selector) {
    //     toggleSnip(selector);
    //     this.descriptionSnipped = true;
    //   }
  },
};
</script>
