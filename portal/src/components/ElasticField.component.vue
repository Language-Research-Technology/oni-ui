<template>
  <template v-if="expandField">
    <el-collapse>
      <el-collapse-item :title="collapseName" :name="collapseName">
        <meta-field :meta="this.expandField" :isExpand="true" :routePath="'item'" :crateId="''" :filePath="''"
                    :parentId="''"/>
      </el-collapse-item>
    </el-collapse>
  </template>
  <template v-else-if="title === 'base64'">
    <NotebookViewerWidget :ipynb="value"/>
  </template>
  <template v-else>
    <template v-if="url">
      <a class="block break-words underline text-blue-600 hover:text-blue-800 visited:text-purple-600" :href="id"
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
    <template v-else-if="value">
      <div class="break-words">{{ value }}</div>
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
import convertSize from 'convert-size';
import {first, isEmpty} from 'lodash';
import {defineAsyncComponent} from 'vue';

export default {
  components: {
    NotebookViewerWidget: defineAsyncComponent(() => import('./widgets/NotebookViewerWidget.component.vue')),
    MetaField: defineAsyncComponent(() => import('@/components/MetaField.component.vue')),
  },
  props: ['field', 'title'],
  data() {
    return {
      id: '',
      name: '',
      collapseName: '',
      description: '',
      url: '',
      value: '',
      byteFields: this.$store.state.configuration.ui?.main?.byteFields || [],
      expand: this.$store.state.configuration.ui?.main?.expand || [],
      expandField: false,
      hide: false,
    };
  },
  mounted() {
    this.id = this.field?.['@id'] || this.field?.['@value'];
    this.url = this.testURL(this.id);
    this.name = first(this.field?.name)?.['@value'] || first(this.field)?.['@value'];
    this.description = first(this.field?.description)?.['@value'];
    // This only if the value is ever empty, AKA not indexed or resolved
    if (isEmpty(this.name)) {
      this.name = this.id;
    }
    if (this.title === 'base64') {
    }
    for (const f of this.expand) {
      if (f === this.title) {
        console.log(f, this.title);
        this.expandField = {name: this.title, data: this.field};
      }
    }
    this.value = this.cleanValue();
    // There is id name there is no @value what to do!
    if (!this.id && !this.name) {
      if (Array.isArray(this.field)) {
        if (this.field?.['@id']) {
          this.name = first(this.field['@id']);
        } else {
          this.name = first(this.field)?.['@id'] || first(this.field);
        }
      } else {
        if (this.field?.['@id']) {
          this.name = this.field['@id'];
        } else {
          this.name = this.field;
        }
      }
    }
  this.collapseName = this.shortenText(this.name);
  },
  methods: {
    first,
    testURL(url) {
      if (typeof url === 'string' && url?.startsWith('http')) {
        //TODO: make this a real url test
        return url;
      }
    },
    cleanValue() {
      if (this.byteFields.find((f) => f.toLowerCase() === this.title?.toLowerCase())) {
        return this.convert(this.field?.['@value']);
      }
      return this.field?.['@value'] || null;
    },
    convert(value) {
      try {
        const contentSizeRegex = /^\d+(\.\d+)?\s*(bytes|kb|mb|gb|tb|b)$/i;
        if (typeof value === 'string' && contentSizeRegex.test(value)) {
          return value;
        }
        return convertSize(Number.parseInt(value), {accuracy: 2});
      } catch (e) {
        return value;
      }
    },
    shortenText(input, { minLength = 0, maxLength = 24 } = {}) {
      if (typeof input === 'string') {
        if (input.length <= minLength) {
          return input; // Don't shorten if it's too short
        }
        return input.length > maxLength ? input.slice(0, maxLength) + '...' : input;
      }
      return '';
    }
  },
};
</script>
