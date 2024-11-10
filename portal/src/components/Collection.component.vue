<template>
  <div class="px-10 pt-10 pb-7 bg-white z-10">
    <el-row :align="'middle'" class="mb-2 text-3xl font-medium dark:text-white">
      <h5>
        <member-of-link :memberOf="metadata.memberOf" />
        {{ name }}
      </h5>
    </el-row>
    <hr class="divider divider-gray pt-2"/>
  </div>
  <el-row :justify="'center'" v-if="metadata" class="m-5 pt2 px-10 pb-7">
    <el-col :xs="24" :sm="24" :md="14" :lg="16" :xl="16">
      <MetaTopCard :tops="this.tops" :className="'px-5 py-2'"/>
      <el-row class="px-5">
        <el-col v-for="meta of this.meta">
          <meta-field :meta="meta" />
        </el-col>
      </el-row>
      <el-row>
        <el-col>
          <collection-members title="Sub Collections" :id="id" :conformsTo="conformsToCollection"
            :routePath="'collection'" />
        </el-col>
      </el-row>
      <el-row>
        <el-col>
          <collection-members title="Objects in Collection" :id="id" :conformsTo="conformsToObject"
            :routePath="'object'" />
        </el-col>
      </el-row>
    </el-col>
    <el-col :xs="24" :sm="24" :md="10" :lg="8" :xl="8">
      <el-row v-if="metadata.license" :gutter="20" :align="'middle'" class="justify-center content-center pb-5">
        <el-col>
          <el-card :body-style="{ padding: '0px' }" class="mx-10 p-5">
            <h5 class="text-2xl font-medium">Access</h5>
            <hr class="divider divider-gray pt-2"/>
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
          <MemberOfCard :routePath="'collection'" :memberOf="metadata.memberOf" />
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
                <el-link underline="underline" :underline="true" type="primary" :href="metadata.metadataLicense.id"
                  target="_blank" class="mx-1">
                  {{ metadata.metadataLicense.name || metadata.metadataLicense.id }}
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
          <TakedownCard/>
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
<script>
import { putLocalStorage } from '@/storage';
import { first, isEmpty, isUndefined, reject, sortBy } from 'lodash';
import { defineAsyncComponent } from 'vue';
import MetaField from './MetaField.component.vue';
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
import MemberOfLink from './widgets/MemberOfLink.component.vue';

export default {
  components: {
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
                content: name.trim() || name,
              };
              metaArr.push(obj);
            }
          } else {
            const obj = {
              name: meta.name,
              content: item || item,
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
      errorDialogVisible: false,
      errorDialogText: '',

      id: this.$route.query.id,
      config: this.$store.state.configuration.ui.collection,
      fields: this.$store.state.configuration.ui.main.fields,
      helpers: this.$store.state.configuration.ui.helpers || [],
      configTag: this.$store.state.configuration.ui.head || {},
      metadata: {},
      name: '',
      license: undefined,
      tops: [],
      meta: [],
      metaTags: [],
      takedownForm: this.$store.state.configuration.ui.googleForm?.takedown,
      conformsToCollection: this.$store.state.configuration.api.conformsTo.collection,
      conformsToObject: this.$store.state.configuration.api.conformsTo.object,
      // findObjectByRelationship: this.$store.state.configuration.ui.collection.relationships,
      collectionSubCollections: [],
      collectionMembers: [],
      limitMembers: 10,
      aggregations: [],
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

      // const summaries = await this.filter({ '_collectionStack.@id': [this.$route.query.id] });
      // this.aggregations = summaries.aggregations;
      putLocalStorage({ key: 'lastRoute', data: this.$route.fullPath });
    } catch (e) {
      console.error(e);
    }
  },
  updated() {
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
      this.populateMetaTags(this.configTag?.meta);
    },
    populateMetaTags(config = []) {
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
        switch (field.content) {
          case 'license':
            value = this.license?.name;
            break;
          case 'publisher':
            value = this.metadata.publisher?.['@id'];
            break;
          default:
            value = this.metadata[field.content];
        }

        this.metaTags.push({
          name: field.name,
          value: value,
          help: helper,
        });
      }
    },
    populateName(config) {
      this.name = this.metadata[config.name];
      this.nameDisplay = this.metadata[config.display];
    },
    // TODO: Remove the duplication in the populate functions
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

        const value = this.metadata[field.name] || 'Not Defined';
        this.tops.push({
          name: field.display,
          value: value,
          help: helper,
        });
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
    takedownLink() {
      const currentUrl = encodeURIComponent(window.location.href);
      const form = this.takedownForm;
      return `${form}${currentUrl}`;
    },
  },
};
</script>
