<template>
  <div class="px-10 pt-10 pb-7 z-10 bg-white">
    <el-row :align="'middle'" class="mb-2 text-3xl font-medium dark:text-white">
      <h5>
        <member-of-link :memberOf="metadata?._memberOf" />
        {{ first(this.name)?.['@value'] }}
      </h5>
    </el-row>
    <hr class="divider divider-gray pt-2" />
  </div>
  <el-row :justify="'center'" v-if="this.metadata" class="m-5 px-10" v-loading="loading">
    <el-col :xs="24" :sm="24" :md="24" :lg="16" :xl="16">
      <AccessHelper v-if="access" :access="access" :license="license" />
      <div class="px-5 pb-5">
        <MetaTopCard :tops="this.tops" :className="'py-5'" />
        <el-row class="">
          <el-col v-for="meta of this.meta">
            <meta-field :meta="meta" :routePath="'object'" :crateId="this.crateId" />
          </el-col>
        </el-row>
      </div>
    </el-col>
    <el-col :xs="24" :sm="24" :md="24" :lg="8" :xl="8">
      <el-row :gutter="20" :align="'middle'" class="justify-center content-center pb-5">
        <el-col v-if="this.license?.['@id']">
          <el-card :body-style="{ padding: '0px' }" class="mx-10 p-5">
            <h5 class="text-2xl font-medium">Access
            <el-tooltip class="box-item" effect="light" trigger="hover" content="License and access conditions for the current object." placement="top">
              <font-awesome-icon icon="fa-solid fa-circle-info" class="ml-2 cursor-pointer" size="xs" color="gray"/>
            </el-tooltip>
            </h5>
            <hr class="divider divider-gray pt-2" />
            <license-card v-if="this.license?.['@id']" :license="license" />
          </el-card>
        </el-col>
      </el-row>
      <el-row :gutter="20" class="pb-5" v-if="$route.query.id">
        <el-col>
          <el-card :body-style="{ padding: '0px' }" class="mx-10 p-5" v-if="first(name)?.['@value']">
            <h5 class="text-2xl font-medium">Downloads
            <el-tooltip class="box-item" effect="light" trigger="hover" content="Downloads associated with the current object. Select Show All Related Downloads to view the complete list of downloads available for the given collection." placement="top">
              <font-awesome-icon icon="fa-solid fa-circle-info" class="ml-2 cursor-pointer" size="xs" color="gray"/>
            </el-tooltip>
            </h5>
            <hr class="divider divider-gray pt-2" />
            <DownloadsModal :access="access" :simpleView="true" :id="$route.query.id" :idFieldName="'_crateId.@value'"
              v-model="openCrateDownloads" :title="first(name)?.['@value']" />
            <el-link @click="openRoot" type="primary">Show All Related Downloads</el-link>
            <DownloadsModal v-if="access" :access="access" :id="this.rootId" :idFieldName="'_root.@id'"
              v-model="openRootDownloads" :title="first(name)?.['@value']" />
          </el-card>
        </el-col>
      </el-row>
      <el-row :gutter="20" class="pb-5" v-if="isOCFL">
        <el-col>
          <el-card :body-style="{ padding: '0px' }" class="mx-10 p-5">
            <h5 class="text-2xl font-medium">Retrieve Metadata
            <el-tooltip class="box-item" effect="light" trigger="hover" content="View or download the metadata associated with the current object, as well as the license and access conditions for this metadata." placement="top">
              <font-awesome-icon icon="fa-solid fa-circle-info" class="ml-2 cursor-pointer" size="xs" color="gray"/>
            </el-tooltip>
            </h5>
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
      <el-row :gutter="20" class="pb-5">
        <el-col>
          <CitationCard v-if="metadata['name']" :name="metadata['name']" :author="metadata['author']"
            :citation="metadata['citation']" :datePublished="metadata['datePublished']" :id="metadata['@id']"
            :creator="metadata['creator']" :doi="metadata['ldac:doi']" :creditText="metadata['creditText']" />
        </el-col>
      </el-row>
      <el-row :gutter="20" class="pb-5">
        <el-col v-if="metadata?._memberOf">
          <MemberOfCard :routePath="'collection'" :_memberOf="metadata?._memberOf" />
        </el-col>
      </el-row>
      <el-row v-if="membersFiltered?.data && membersFiltered?.data.length">
        <el-col>
          <el-card :body-style="{ padding: '0px' }" class="mx-10 p-5">
            <h5 class="text-2xl font-medium">Other Objects in this Collection
            <el-tooltip class="box-item" effect="light" trigger="hover" content="Complete list of objects within this collection." placement="top">
              <font-awesome-icon icon="fa-solid fa-circle-info" class="ml-2 cursor-pointer" size="xs" color="gray"/>
            </el-tooltip>
            </h5>
            <hr class="divider divider-gray pt-2" />
            <ul>
              <li v-for="d of membersFiltered.data">
                <collection-item :field="d._source" :routePath="'object'" />
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
          <BinderHubCard v-if="metadata['gitName']" :gitOrg="metadata['gitOrg']" :gitName="metadata['gitName']"
            :gitBranch="metadata['gitBranch']" :filepath="metadata['filepath']" />
        </el-col>
      </el-row>
      <el-row :gutter="20" class="pb-5">
        <el-col>
          <TakedownCard />
        </el-col>
      </el-row>
    </el-col>
  </el-row>
  <template v-if="parts && parts.length > 0">
    <el-row class="m-5 pl-10 pr-12">
      <el-col :span="24" class="divide-solid divide-y-2 divide-red-700">
        <div class="grid-content p-2 m-2">
          <h2 class="text-2xl tracking-tight dark:text-white">
            Files: {{ parts.length }}
            <AggregationAsIcon v-for="part of uniqueParts" :item="part" :field="{ 'name': 'File', 'display': 'File' }"
              :id="id" />
          </h2>
        </div>
        <div></div>
      </el-col>
    </el-row>
    <el-row class="m-5 pl-10 pr-12 pb-7">
      <el-col>
        <ul>
          <li v-for="(part, index) of parts">
            <a :id="'part-' + encodeURIComponent(part?.['@id'])"></a>
            <object-part :part="part" :title="first(part?.name)?.['@value'] || part?.['@id']"
              :active="isPartActive(part?.['@id'], index)" :id="encodeURIComponent(part?.['@id'])"
              :encodingFormat="first(part?.['encodingFormat'])?.['@value']"
              :contentSize="first(part?.['contentSize'])?.['@value']" :crateId="this.crateId" :rootId="this.rootId"
              :parentName="first(this.name)?.['@value']" :parentId="this.$route.query.id" :license="license"
              :access="access" />
          </li>
        </ul>
      </el-col>
    </el-row>
  </template>
</template>
<script>
import { putLocalStorage } from '@/storage';
import { first, isEmpty, isEqual, isUndefined, reject, sortBy } from 'lodash';
import { defineAsyncComponent } from 'vue';
import { initSnip, toggleSnip } from '../tools';
import AccessHelper from './AccessHelper.component.vue';
import CollectionItem from './CollectionItem.component.vue';
import MetaField from './MetaField.component.vue';
import ZipLink from './ZipLink.component.vue';
import BinderHubCard from './cards/BinderHubCard.component.vue';
import LicenseCard from './cards/LicenseCard.component.vue';
import MemberOfCard from './cards/MemberOfCard.component.vue';
import MetaTopCard from './cards/MetaTopCard.component.vue';
import TakedownCard from './cards/TakedownCard.component.vue';
import AggregationAsIcon from './widgets/AggregationAsIcon.component.vue';
import DownloadsModal from './widgets/DownloadsModal.component.vue';
import MemberOfLink from './widgets/MemberOfLink.component.vue';
import RetrieveDataMetadata from './cards/RetrieveDataMetadata.component.vue';
import CitationCard from './cards/CitationCard.component.vue';


export default {
  components: {
    MetaTopCard,
    LicenseCard,
    MemberOfCard,
    MetaField,
    AccessHelper,
    MemberOfLink,
    ObjectPart: defineAsyncComponent(() => import('./ObjectPart.component.vue')),
    CollectionItem,
    AggregationAsIcon,
    TakedownCard,
    BinderHubCard,
    ZipLink,
    DownloadsModal,
    RetrieveDataMetadata,
    CitationCard,

  },
  props: [],
  data() {
    return {
      id: null,
      config: this.$store.state.configuration.ui.object,
      fields: this.$store.state.configuration.ui.main.fields,
      helpers: this.$store.state.configuration.ui.helpers || [],
      metadata: {},
      name: '',
      tops: [],
      meta: [],
      license: [],
      licenseText: '',
      licenseSnipped: false,
      buckets: [],
      parts: [],
      uniqueParts: [],
      crateId: '',
      rootId: '',
      access: null,
      activePart: null,
      loading: false,
      membersFiltered: {},
      conformsToObject: this.$store.state.configuration.ui.conformsTo?.object,
      fullPath: window.location.href,
      zips: [],
      openCrateDownloads: false,
      openRootDownloads: false,
      isOCFL: false,
    };
  },
  async updated() {
    const fileId = this.$route.query.fileId;
    if (fileId) {
      setTimeout(() => {
        const fileElement = document.getElementById(`part-${encodeURIComponent(fileId)}`);
        fileElement.scrollIntoView({ behavior: 'smooth', block: 'start', inline: 'start' });
      }, 200);
    }
    if (this.crateId) {
      this.membersFiltered = await this.filter(
        {
          '_memberOf.@id': [this.crateId],
          'conformsTo.@id': [this.conformsToObject],
        },
        false,
      );
      this.isOCFL = this.metadata?._isOCFL === 'false' ? false : !!this.metadata?._isOCFL; // double bang to convert truthy to boolean
      this.$gtag.event('/object', {
        event_category: 'object',
        event_label: 'loaded-object',
        value: this.crateId,
      });
    }
    this.zips = [];
    for (const m of this.metadata?._memberOf || []) {
      const name = first(m.name)?.['@value'];
      this.zips.push({ name: name, id: m['@id'], message: 'Current object included in this download' });
    }
    putLocalStorage({ key: 'lastRoute', data: this.$route.fullPath });
  },
  async mounted() {
    try {
      this.crateId = this.$route.query._crateId;
      this.loading = true;
      let metadata = null;
      const id = encodeURIComponent(this.$route.query.id);
      const _id = encodeURIComponent(this.$route.query._id);
      //encodeURIComponent may return "undefined" string
      if (id && id !== 'undefined') {
        if (isUndefined(this.crateId) || this.crateId === 'undefined') {
          await this.$router.push({ path: '/404' });
          this.loading = false;
        } else {
          metadata = await this.$elasticService.single({
            id,
            crateId: this.crateId,
          });
        }
        this.$gtag.event('/object', {
          event_category: 'object',
          event_label: 'mounted-object',
          value: id,
        });
      } else if (_id && _id !== 'undefined') {
        metadata = await this.$elasticService.single({ _id });
      }
      this.metadata = metadata?._source;
      this.isOCFL = this.metadata?._isOCFL === 'false' ? false : !!this.metadata?._isOCFL; // double bang to convert truthy to boolean
      await this.populate();
      initSnip({ selector: '#license', button: '#readMoreLicense' });

      putLocalStorage({ key: 'lastRoute', data: this.$route.fullPath });
    } catch (e) {
      this.$gtag.event('/object', {
        event_category: 'object',
        event_label: 'error-mounting-object',
        value: 'error',
      });
      console.error(e);
    }
  },
  methods: {
    isEqual,
    first,
    isEmpty,
    toggleSnip,
    async populate() {
      try {
        this.rootId = first(this.metadata._root)?.['@id'];
        this.populateAccess();
        this.populateName(this.config.name);
        this.populateTop(this.config.top);
        this.populateMeta(this.config.meta);
        this.populateLicense();
        this.populateParts();
      } catch (e) {
        console.error(e);
      }
      this.loading = false;
    },
    populateName(config) {
      this.name = this.metadata[config.name];
      this.nameDisplay = this.metadata[config.display];
    },
    populateTop(config) {
      for (const field of config) {
        let value;
        if (this.metadata[field.name]) {
          value = this.metadata[field.name];
        } else {
          value = [{ '@value': 'Not Defined' }];
        }
        this.tops.push({ name: field.display, value: value });
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
      if (!this.license?.['@id']) {
        console.log('show alert! no license no!no!');
      } else {
        this.licenseText = first(this.license?.description)?.['@value'];
      }
    },
    populateParts() {
      this.parts = this.metadata.hasPart;
      if (this.parts?.length) {
        const uniqueParts = this.parts.map((p) => first(p.encodingFormat)?.['@value']);
        this.uniqueParts = [...new Set(uniqueParts)];
      }
    },
    populateAccess() {
      this.access = this.metadata._access;
    },
    isPartActive(id, index) {
      if (this.$route.query.fileId === id) {
        this.activePart = true;
        return true;
      }
      if (index === 0 && !this.activePart) {
        return true;
      }
      return false;
    },
    openRoot() {
      this.openRootDownloads = true;
    },

    //TODO: refactor this integrate to multi
    async filter(filters, scroll) {
      try {
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
      } catch (e) {
        console.error(e);
        return {
          data: [],
          aggregations: {},
          total: 0,
          scrollId: null,
          route: null,
        };
      }
    },
    moreObjects() {
      const filter = {
        '_memberOf.@id': [encodeURIComponent(this.crateId)],
      };
      return encodeURIComponent(JSON.stringify(filter));
    },
  },
};
</script>
