<template>
  <template v-if="expandField">
    <el-collapse>
      <el-collapse-item :title="name" :name="name">
        <meta-field :meta="this.expandField" :isExpand="true" :routePath="'item'" :id="''" :filePath="''"
                    :parentId="''"/>
      </el-collapse-item>
    </el-collapse>
  </template>
  <template v-if="geometry">
    {{ geometry.asWKT }}
    <LeafletMap class="h-72 flex grow min-w-[200px] mr-4"
                :modelValue="geometry"
                :transformer="transformer"
                :enableDrawing="false"></LeafletMap>
    <p class="text-sm">This map is not designed or suitable for Native Title research.</p>
  </template>
  <template v-else-if="title === 'base64'">
    <NotebookViewerWidget :ipynb="value"/>
  </template>
  <template v-else>
    <template v-if="url">
      <a class="break-words underline text-blue-600 hover:text-blue-800 visited:text-purple-600 absolute"  :href="id"
         target="_blank" rel="nofollow noreferrer">
        <manku-icon :name="title" height="30">
          <template #notFound>
          <span class="break-all">
            {{ name || id }}
          </span>
          </template>
        </manku-icon>
      </a><br/>
    </template>
    <template v-else>
      <p>
        {{ name }}
        <el-tooltip v-if="description" class="box-item" effect="light" trigger="click" :content="description"
                    placement="top">
          <el-button size="small" link>
            <font-awesome-icon icon="fa-solid fa-circle-info"/>
          </el-button>
        </el-tooltip>
      </p>
    </template>
  </template>
</template>
<script>
import { isString, isNumber } from 'lodash';
import convertSize from 'convert-size';
import { defineAsyncComponent } from 'vue';
import transformer from '@/components/widgets/geo';

export default {
  components: {
    NotebookViewerWidget: defineAsyncComponent(() => import('@/components/widgets/NotebookViewerWidget.component.vue')),
    MetaField: defineAsyncComponent(() => import('@/components/MetaField.component.vue')),
    LeafletMap: defineAsyncComponent(() => import('@/components/widgets/LeafletMap.vue')),
  },
  props: ['field', 'title'],
  data() {
    return {
      id: '',
      name: '',
      description: '',
      url: '',
      value: '',
      geometry: '',
      byteFields: this.$store.state.configuration.ui?.main?.byteFields || [],
      expand: this.$store.state.configuration.ui?.main?.expand || [],
      expandField: false,
      hide: false,
    };
  },
  mounted() {
    this.renderField(this.field);
  },
  methods: {
    transformer,
    renderField(field) {
      if (isString(field) || isNumber(field)) {
        this.name = field;
        return;
      }

      this.id = field['@id'];
      this.url = this.testURL(this.id);
      this.name = field.name;
      this.description = field.description;
      if (field.name === 'contentLocation') {
        this.geometry = field.geo;
      }
    },
    testURL(url) {
      if (isString(url) && url.startsWith('http')) {
        //TODO: make this a real url test
        return url;
      }
    },
  },
};
</script>
