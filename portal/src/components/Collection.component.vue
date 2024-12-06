<template>
  <div class="px-10 pt-10 pb-7 bg-white z-10">
    <el-row :align="'middle'" class="mb-2 text-3xl font-medium dark:text-white">
      <h5>
        <member-of-link :memberOf="metadata?._memberOf" />
        {{ first(this.name)?.['@value'] }}
      </h5>
    </el-row>
    <hr class="divider divider-gray pt-2" />
  </div>
  <el-row :justify="'center'" v-if="this.metadata" class="m-5 pt2 px-10 pb-7">
    <el-col :xs="24" :sm="24" :md="14" :lg="16" :xl="16">
      <MetaTopCard :tops="this.tops" :className="'px-5 py-2'" />
      <el-row class="px-5">
        <el-col v-for="meta of this.meta">
          <meta-field :meta="meta" :routePath="'collection'" :crateId="this.$route.query._crateId" />
        </el-col>
      </el-row>
      <el-row v-if="collectionSubCollections">
        <el-col>
          <collection-members :title="'Sub Collections'" :id="$route.query.id" :conformsTo="conformsToCollection"
            :routePath="'collection'" />
        </el-col>
      </el-row>
      <el-row>
        <el-col v-if="collectionMembers">
          <collection-members :title="'Objects in Collection'" :id="$route.query.id" :conformsTo="conformsToObject"
            :routePath="'object'" />
        </el-col>
      </el-row>
    </el-col>
    <el-col :xs="24" :sm="24" :md="10" :lg="8" :xl="8">
      <el-row :gutter="20" :align="'middle'" class="justify-center content-center pb-5">
        <el-col>
          <el-card :body-style="{ padding: '0px' }" class="mx-10 p-5">
            <h5 class="text-2xl font-medium">Access</h5>
            <hr class="divider divider-gray pt-2" />
            <h4 class="text-1xl font-medium">
              Content in this collection is licensed as:
            </h4>
            <PropertySummaryCard
              :aggregations="{ 'license.name.@value': { 'terms': { 'field': 'license.name.@value.keyword', 'size': '1000' } } }"
              :fields="[{ 'name': 'license.@id', 'display': 'Licenses' }]" :name="'license.@id'" :fieldName="'license'"
              :external="true" :id="this.$route.query.id" :root="this.metadata._root" />
          </el-card>
        </el-col>
      </el-row>
      <el-row :gutter="20" class="pb-5" v-if="metadata?._memberOf && metadata?._memberOf.length > 0">
        <el-col>
          <MemberOfCard :routePath="'collection'" :_memberOf="metadata?._memberOf" />
        </el-col>
      </el-row>
      <el-row :gutter="20" class="pb-5">
        <el-col>
          <el-card :body-style="{ padding: '0px' }" class="grid mx-10 p-5">
            <h5 class="text-2xl font-medium">Content</h5>
            <hr class="divider divider-gray pt-2" />
            <SummariesCard :aggregations="aggregations" :fields="fields || []" :name="'summaries'"
              :id="this.$route.query.id" :root="this.metadata._root" />
            <SummariesCard :aggregations="aggregations"
              :fields="[{ 'name': 'license.name.@value', 'display': 'Data licenses for access' }]" :name="'licenses'"
              :id="this.$route.query.id" :root="this.metadata._root" />
          </el-card>
        </el-col>
      </el-row>
      <el-row :gutter="20" class="pb-5">
        <el-col>
          <el-card :body-style="{ padding: '0px' }" class="mx-10 p-5" v-if="first(name)?.['@value'] != undefined">
            <h5 class="text-2xl font-medium">Downloads</h5>
            <hr class="divider divider-gray pt-2" />
            <template v-if="zipDownload.bundledObject">
              <ZipLink :id="zipDownload.id" :name="zipDownload.name" :message="zipDownload.message" />
            </template>
            <template v-else>
              <p>This collection cannot be downloaded in a single request:</p>
            </template>
            <el-link @click="openDownloads = !openDownloads" type="primary">Show All Downloads</el-link>
            <DownloadsModal :id="rootId" v-model="openDownloads" :title="first(name)?.['@value']" />
          </el-card>
        </el-col>
      </el-row>
      <el-row :gutter="20" class="pb-5">
        <el-col>
          <el-card :body-style="{ padding: '0px' }" class="mx-10 p-5">
            <h5 class="text-2xl font-medium">Retrieve Metadata</h5>
            <hr class="divider divider-gray pt-2" />
            <RetrieveDataMetadata :id="this.$route.query.id" />
            <template v-if="metadata._metadataLicense?.id">
              <hr class="divider divider-gray mt-4 pb-2" />
              <h4 class="text-1xl font-medium">
                Metadata licensed as:
                <el-link underline="underline" :underline="true" type="primary" :href="metadata._metadataLicense?.id"
                  target="_blank" class="mx-1">
                  {{ metadata._metadataLicense?.name || metadata._metadataLicense?.id }}
                </el-link>
              </h4>
            </template>
          </el-card>
        </el-col>
      </el-row>
      <el-row :gutter="20" class="pb-5" v-for="relationship of findObjectByRelationship">
        <el-col>
          <el-card :body-style="{ padding: '0px' }" class="mx-10 p-5">
            <h5 class="text-2xl font-medium ">{{ relationship.display }}</h5>
            <hr class="divider divider-gray pt-2" />
            <SimpleRelationshipCard :id="this.$route.query.id" :objectType="relationship.type"
              :objectName="relationship.name" />
          </el-card>
        </el-col>
      </el-row>
      <el-row :gutter="20" class="pb-5">
        <el-col>
          <CitationCard v-if="metadata['name']" :name="metadata['name']" :author="metadata['author']"
            :citation="metadata['citation']" :datePublished="metadata['datePublished']" :id="metadata['@id']"
            :creator="metadata['creator']" :doi="metadata['doi']" :creditText="metadata['creditText']" />
        </el-col>
      </el-row>
      <el-row :gutter="20" class="pb-5">
        <el-col>
          <TakedownCard />
        </el-col>
      </el-row>
    </el-col>
  </el-row>
</template>
<script>
import { putLocalStorage } from '@/storage';
import { first, isEmpty, isUndefined, reject, sortBy } from 'lodash';
import { defineAsyncComponent } from 'vue';
import MetaField from './MetaField.component.vue';
import ZipLink from './ZipLink.component.vue';
import ContentCard from './cards/ContentCard.component.vue';
import FieldHelperCard from './cards/FieldHelperCard.component.vue';
import LicenseCard from './cards/LicenseCard.component.vue';
import MemberOfCard from './cards/MemberOfCard.component.vue';
import MetaTopCard from './cards/MetaTopCard.component.vue';
import PropertySummaryCard from './cards/PropertySummaryCard.component.vue';
import RetrieveDataMetadata from './cards/RetrieveDataMetadata.component.vue';
import SimpleRelationshipCard from './cards/SimpleRelationshipCard.component.vue';
import SummariesCard from './cards/SummariesCard.component.vue';
import TakedownCard from './cards/TakedownCard.component.vue';
import DownloadsModal from './widgets/DownloadsModal.component.vue';
import MemberOfLink from './widgets/MemberOfLink.component.vue';
import CitationCard from './cards/CitationCard.component.vue';

export default {
  components: {
    DownloadsModal,
    PropertySummaryCard,
    SummariesCard,
    MetaTopCard,
    RetrieveDataMetadata,
    SimpleRelationshipCard,
    MetaField,
    CollectionMembers: defineAsyncComponent(() => import('@/components/CollectionMembers.component.vue')),
    LicenseCard,
    MemberOfCard,
    ContentCard,
    FieldHelperCard,
    MemberOfLink,
    TakedownCard,
    ZipLink,
    CitationCard,
  },
  props: [],
  head() {
    const metaArr = [];
    for (const meta of this.metaTags || []) {
      if (Array.isArray(meta.value)) {
        for (const item of meta.value) {
          if (item.name) {
            for (const name of item.name) {
              const obj = {
                name: meta.name,
                content: name['@value'].trim() || name,
              };
              metaArr.push(obj);
            }
          } else {
            const obj = {
              name: meta.name,
              content: item['@value'] || item,
            };
            metaArr.push(obj);
          }
        }
      } else {
        const obj = {
          name: meta.name,
          content: meta.value,
        };
        metaArr.push(obj);
      }
    }
    return {
      meta: metaArr,
    };
  },

  data() {
    return {
      id: null,
      config: this.$store.state.configuration.ui.collection,
      fields: this.$store.state.configuration.ui.main.fields,
      helpers: this.$store.state.configuration.ui.helpers || [],
      configTag: this.$store.state.configuration.ui.head || {},
      title: this.$store.state.configuration.ui.title || '',
      metadata: {},
      name: '',
      license: [],
      tops: [],
      meta: [],
      metaTags: [],
      buckets: [],
      takedownForm: this.$store.state.configuration.ui.googleForm?.takedown,
      conformsToCollection: this.$store.state.configuration.ui.conformsTo?.collection,
      conformsToObject: this.$store.state.configuration.ui.conformsTo?.object,
      findObjectByRelationship: this.$store.state.configuration.ui.collection.relationships,
      collectionSubCollections: [],
      collectionMembers: [],
      limitMembers: 10,
      aggregations: [],
      zips: [],
      zipDownload: {},
      openDownloads: false,
      rootId: '',
    };
  },
  async mounted() {
    try {
      const id = encodeURIComponent(this.$route.query.id);
      const crateId = encodeURIComponent(this.$route.query._crateId);
      //encodeURIComponent may return "undefined" string
      if (isUndefined(id) || id === 'undefined' || isUndefined(crateId) || crateId === 'undefined') {
        this.$gtag.event('/collection', {
          event_category: 'collection',
          event_label: 'no-id-collection',
          value: id,
        });
        await this.$router.push({ path: '/404' });
      } else {
        const metadata = await this.$elasticService.single({
          id: id,
          _crateId: crateId,
        });
        this.metadata = metadata?._source;
        console.log('DEBUG COLLECTION');
        console.log(this.metadata);
        this.$gtag.event('/collection', {
          event_category: 'collection',
          event_label: 'loaded-collection',
          value: id,
        });
        if (!isEmpty(this.metadata)) {
          await this.populate();
          this.collectionSubCollections = await this.filter(
            {
              '_memberOf.@id': [this.$route.query.id],
              'conformsTo.@id': [this.conformsToCollection],
            },
            true,
          );
          this.collectionMembers = await this.filter(
            {
              '_memberOf.@id': [this.$route.query.id],
              'conformsTo.@id': [this.conformsToObject],
            },
            true,
          );
          const summaries = await this.filter({ '_collectionStack.@id': [this.$route.query.id] });
          this.aggregations = summaries.aggregations;

          putLocalStorage({ key: 'lastRoute', data: this.$route.fullPath });
        } else {
          this.$gtag.event('/collection', {
            event_category: 'collection',
            event_label: 'no-metadata-collection',
            value: id,
          });
          await this.$router.push({ path: '/404' });
        }
      }
    } catch (e) {
      console.error(e);
    }
    document.dispatchEvent(new Event('ZoteroItemUpdated', {
      bubbles: true,
      cancelable: true
    }))
  },
  updated() {
    this.zips = [];
    const isBundled = this.metadata.hasMember && this.metadata.hasMember.length > 0;
    const name = first(this.name)?.['@value'];
    if (name) {
      this.zipDownload = { name: name, id: this.$route.query.id, bundledObject: isBundled };
    }
    const id = encodeURIComponent(this.$route.query.id);
    this.$gtag.event('/collection', {
      event_category: 'collection',
      event_label: 'loaded-collection',
      value: id,
    });
    putLocalStorage({ key: 'lastRoute', data: this.$route.fullPath });
  },
  watch: {},
  methods: {
    first,
    isEmpty,
    async populate() {
      this.rootId = first(this.metadata._root)?.['@id'];
      this.populateName(this.config.name);
      this.populateTop(this.config.top);
      this.populateMeta(this.config.meta);
      this.populateMetaTags(this.configTag?.meta, this.configTag?.title);
      this.populateLicense();
      await this.populateBuckets();
    },
    populateMetaTags(config = [], title) {
      for (const field of config) {
        let helper = this.helpers.find((h) => h.id === field.name);
        if (!helper) {
          helper = {
            id: field.content,
            display: field.name,
            url: '',
            definition: 'TODO: Add definition',
          };
        }

        let value;
        if (this.metadata[field.content]) {
          value = this.metadata[field.content];
        }
        this.metaTags.push({
          name: field.name,
          value: value,
          help: helper,
        });
      }
      this.metaTags.push({
        name: title,
        value: this.title,
        help: {}
      });
      //see populateTop
    },
    populateName(config) {
      this.name = this.metadata[config.name];
      this.nameDisplay = this.metadata[config.display];
    },
    populateTop(config) {
      for (const field of config) {
        let helper = this.helpers.find((h) => h.id === field.name);
        if (!helper) {
          helper = {
            id: field.name,
            display: field.display,
            url: '',
            definition: 'TODO: Add definition',
          };
        }
        let value;
        if (this.metadata[field.name]) {
          value = this.metadata[field.name];
        } else {
          value = [{ '@value': 'Not Defined' }];
        }
        this.tops.push({
          name: field.display,
          value: value,
          help: helper,
        });
      }
    },
    populateMeta(config) {
      const keys = Object.keys(this.metadata); //.map(f => this.config.hide.find(f=> console.log(f)))
      const filtered = reject(keys, (o) => config.hide.find((f) => o === f));
      for (const filter of filtered) {
        let helper = this.helpers.find((h) => h.id === filter);
        if (!helper) {
          helper = {
            id: filter,
            display: filter,
            url: '',
            definition: 'TODO: Add definition',
          };
        }
        this.meta.push({ name: filter, data: this.metadata[filter], help: helper });
      }
      this.meta = sortBy(this.meta, 'name');
    },
    populateLicense() {
      this.license = first(this.metadata?.license);
    },
    async populateBuckets() {
      const items = await this.$elasticService.multi({
        filters: { '_memberOf.@id': [this.$route.query.id] },
        sort: 'relevance',
        order: 'desc',
      });
      const aggregations = items?.aggregations;
      this.buckets = [];
      for (const field of this.fields) {
        if (aggregations[field.name]) {
          this.buckets.push({ field: field.display, buckets: aggregations[field.name]?.buckets });
        }
      }
    },
    takedownLink() {
      const currentUrl = encodeURIComponent(window.location.href);
      const form = this.takedownForm;
      return `${form}${currentUrl}`;
    },

    //TODO: refactor this integrate to multi
    async filter(filters, scroll) {
      const items = await this.$elasticService.multi({ scroll, filters, sort: 'relevance', order: 'desc' });
      if (items?.hits?.hits.length > 0) {
        return {
          data: items?.hits?.hits,
          aggregations: items?.aggregations,
          total: items.hits?.total.value,
          scrollId: items?._scroll_id,
          route: null,
        };
      }
    },
  },
};
</script>
