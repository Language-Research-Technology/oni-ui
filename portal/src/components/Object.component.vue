<template>
  <div class="px-10 pt-10 pb-7 z-10 bg-white">
    <el-row :align="'middle'" class="mb-2 text-3xl font-medium dark:text-white">
      <h5>
        <member-of-link :memberOf="metadata.memberOf"/>
        {{ name }}
      </h5>
    </el-row>
    <hr class="divider divider-gray pt-2"/>
  </div>
  <el-row :justify="'center'" v-if="metadata" class="m-5 px-10" v-loading="loading">
    <el-col :xs="24" :sm="24" :md="24" :lg="16" :xl="16">
      <AccessHelper v-if="access" :access="access" :license="license"/>
      <div class="px-5 pb-5">
        <MetaTopCard :tops="tops" :className="'py-5'"/>
        <el-row class="">
          <el-col v-for="meta of this.meta">
            <meta-field :meta="meta" />
          </el-col>
        </el-row>
      </div>
    </el-col>
    <el-col :xs="24" :sm="24" :md="24" :lg="8" :xl="8">
      <el-row :gutter="20" :align="'middle'" class="justify-center content-center pb-5">
        <el-col v-if="this.license?.['@id']">
          <el-card :body-style="{ padding: '0px' }" class="mx-10 p-5">
            <h5 class="text-2xl font-medium">Access</h5>
            <hr class="divider divider-gray pt-2"/>
            <license-card v-if="this.license?.['@id']" :license="license"/>
          </el-card>
        </el-col>
      </el-row>
      <el-row :gutter="20" class="pb-5">
        <el-col v-if="metadata.memberOf">
          <MemberOfCard :routePath="'collection'" :memberOf="metadata.memberOf"/>
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
          <TakedownCard/>
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
            <!-- <AggregationAsIcon v-for="part of uniqueParts" :item="part" :field="{ 'name': 'File', 'display': 'File' }" -->
                               <!-- :id="id"/> -->
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
            <object-part :part="part" :title="part.name || part['@id']"
                         :active="isPartActive(part['@id'], index)" :id="part['@id']"
                         :rootId="rootId" :parentName="name"
                         :parentId="id"
                         :license="license" :access="access"/>
          </li>
        </ul>
      </el-col>
    </el-row>
  </template>
</template>
<script>
import { reject, sortBy, isArray } from 'lodash';
import { putLocalStorage } from '@/storage';
import { defineAsyncComponent } from 'vue';
import CollectionItem from './CollectionItem.component.vue';
import AccessHelper from './AccessHelper.component.vue';
import MetaField from './MetaField.component.vue';
import BinderHubCard from './cards/BinderHubCard.component.vue';
import LicenseCard from './cards/LicenseCard.component.vue';
import MemberOfCard from './cards/MemberOfCard.component.vue';
import MemberOfLink from './widgets/MemberOfLink.component.vue';
import MetaTopCard from './cards/MetaTopCard.component.vue';
import TakedownCard from './cards/TakedownCard.component.vue';
import AggregationAsIcon from './widgets/AggregationAsIcon.component.vue';
import { initSnip, toggleSnip } from '../tools';

export default {
  components: {
    MetaTopCard,
    LicenseCard,
    MemberOfCard,
    MemberOfLink,
    MetaField,
    AccessHelper,
    ObjectPart: defineAsyncComponent(() => import('./ObjectPart.component.vue')),
    CollectionItem,
    AggregationAsIcon,
    TakedownCard,
    BinderHubCard,
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
      license: null,
      licenseText: '',
      licenseSnipped: false,
      buckets: [],
      parts: [],
      uniqueParts: [],
      rootId: null,
      access: null,
      activePart: null,
      loading: false,
      membersFiltered: {},
      conformsToObject: this.$store.state.configuration.ui.conformsTo?.object,
      fullPath: window.location.href,
    };
  },
  async mounted() {
    try {
      this.id = this.$route.query.id;
      if (!this.id) {
        await this.$router.push({ path: '/404' });

        return;
      }

      this.loading = true;

      const { error, metadata } = await this.$api.getRoCrate(this.id);
      if (error) {
        this.errorDialogText = error;
        this.errorDialogVisible = true;

        return;
      }

      if (!metadata) {
        await this.$router.push({ path: '/404' });
        return;
      }

      this.metadata = metadata;
      await this.populate();

      this.loading = false;

      initSnip({ selector: '#license', button: '#readMoreLicense' });
    } catch (e) {
      console.error(e);
    }
  },
  async updated() {
    // const fileId = this.$route.query.fileId;
    // if (fileId) {
    //   setTimeout(function () {
    //     const fileElement = document.getElementById('part-' + encodeURIComponent(fileId));
    //     fileElement.scrollIntoView({behavior: 'smooth', block: 'start', inline: 'start'});
    //   }, 200);
    // }
    // if (this.id) {
    //   this.membersFiltered = await this.filter(
    //     {
    //       '_memberOf.@id': [this.id],
    //       'conformsTo.@id': [this.conformsToObject],
    //     },
    //     false,
    //   );
    // }
  },
  methods: {
    async populate() {
      try {
        this.rootId = this.metadata.root;
        this.populateAccess();
        this.populateLicense();
        this.populateName(this.config.name);
        this.populateTop(this.config.top);
        this.populateMeta(this.config.meta);
        this.populateParts();
      } catch (e) {
        console.error(e);
      }
    },
    populateName(config) {
      this.name = this.metadata[config.name];
      this.nameDisplay = this.metadata[config.display];
    },
    populateTop(config) {
      for (const field of config) {
        const value = this.metadata[field.name] || { '@value': 'Not Defined' };
        this.tops.push({ name: field.display, value: value });
      }
    },
    populateMeta(config) {
      const keys = Object.keys(this.metadata);
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
      this.license = this.metadata.license;
      if (!this.license?.['@id']) {
        console.log('show alert! no license no!no!');

        return;
      }

      this.licenseText = this.license.description;
    },
    populateParts() {
      // TODO: Fix ro-crate-js so it returns arrays for things that are arrays even with array: false
      this.parts = this.metadata.hasPart;
      if (this.parts && !isArray(this.parts)) {
        this.parts = [this.parts];
      }
      if (this.parts?.length) {
        const uniqueParts = this.parts.map((p) => p.encodingFormat);
        this.uniqueParts = [...new Set(uniqueParts)];
      }
    },
    populateAccess() {
      // FIXME: Use real data
      // this.access = this.metadata._access;
      this.access = { hasAccess: true };
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
        '_memberOf.@id': [encodeURIComponent(this.id)],
      };
      return encodeURIComponent(JSON.stringify(filter));
    },
  },
};
</script>
