<template>
  <el-row class="grid-content p-6">
    <el-col :xs="22" :sm="22" :md="22" :lg="22" :xl="22">
      <h5 class="text-2xl font-normal leading-normal mt-0 mb-2">{{ title }}</h5>
    </el-col>
    <el-col :xs="2" :sm="2" :md="2" :lg="2" :xl="2">
      <template v-if="resolve">
        <el-button @click="resolve = false">
          <font-awesome-icon icon="fa fa-chevron-down" />
        </el-button>
      </template>
      <template v-else>
        <el-button @click="resolve = true">
          <font-awesome-icon icon="fa fa-chevron-right" />
        </el-button>
      </template>
    </el-col>
  </el-row>
  <el-row :gutter="20" class="p-7" v-show="resolve">
    <el-col :xs="24" :sm="24" :md="24" :lg="10" :xl="10">
      <ul>
        <li v-for="meta of this.meta">
          <meta-field :meta="meta" :routePath="'object'" :filePath="id" :crateId="crateId" :parentId="parentId" />
        </li>
      </ul>
    </el-col>
    <el-col :xs="24" :sm="24" :md="24" :lg="14" :xl="14">
      <file-resolve class="flex justify-center" :id="id" :resolve="resolve" :encodingFormat="encodingFormat" :crateId="crateId"
        :rootId="rootId" :pdfPages="1" :name="title" :parentName="parentName" previewText="Click 'View File' to see more"
        isPreview="true" :access="access" :license="license" />
    </el-col>
  </el-row>
  <el-row>
    <el-col class="divide-solid divide-y-2 divide-red-700">
      <div></div>
      <div></div>
    </el-col>
  </el-row>
</template>
<script>
import { first, reject, sortBy } from 'lodash';
import FileResolve from './FileResolve.component.vue';
import MetaField from './MetaField.component.vue';

export default {
  inheritAttrs: false,
  components: { MetaField, FileResolve },
  props: [
    'title',
    'part',
    'active',
    'id',
    'encodingFormat',
    'crateId',
    'rootId',
    'parentName',
    'parentId',
    'access',
    'license',
  ],
  data() {
    return {
      more: '',
      meta: [],
      metadata: [],
      resolve: false,
      helpers: this.$store.state.configuration.ui.helpers || [],
      config: this.$store.state.configuration.ui.file,
    };
  },
  async mounted() {
    try {
      this.resolve = this.active;
      await this.getFileMetadata();
    } catch (e) {
      console.error(e);
    }
  },
  async updated() {
    await this.getFileMetadata();
  },
  methods: {
    first,
    async getFileMetadata() {
      if (this.resolve) {
        const metadata = await this.$elasticService.single({
          id: this.id,
          _crateId: this.crateId,
        });
        this.metadata = metadata?._source;
        this.populateMeta(this.config.meta || []);
      }
    },
    populateMeta(config) {
      this.meta = [];
      const keys = Object.keys(this.metadata); //.map(f => config.hide.find(f=> console.log(f)))
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
  },
};
</script>
