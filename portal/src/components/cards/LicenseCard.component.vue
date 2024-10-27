<template>
  <p class="whitespace-pre-wrap" id="license" v-if="!hideDescription">{{ this.license.description }}</p>
  <span v-if="!hideDescription" id="readMoreLicense">
    <el-button v-if="!licenseSnipped" class="justify-self-center mt-2" @click="doSnip('#license')">Read more
  </el-button>
    </span>
  <div class="grid p-4">
    <span class="justify-self-center">
      <a class="underline" :href="this.license['@id']">
      {{ this.license.name }}</a>
    </span>
  </div>
  <div class="grid p-4">
    <div class="justify-self-center">
      {{ this.license.metadataIsPublic === false ? 'Private Metadata' : 'Public Metadata' }} and
      {{ this.license.allowTextIndex === false ? 'Cannot Search in Text' :'Text is Searchable' }}
    </div>
  </div>
  <div class="bottom justify-self-center"></div>
</template>
<script>
import { first, isEmpty } from 'lodash';
import { initSnip, toggleSnip } from '../../tools';

export default {
  props: ['license', 'hideDescription'],
  data() {
    return {
      licenseSnipped: false,
      publicMetadataTitle: '',
      publicMetadataTip: '',
      allowTextIndexTitle: '',
      allowTextIndexTip: '',
    };
  },
  methods: {
    first,
    isEmpty,
    doSnip(selector) {
      toggleSnip(selector);
      this.licenseSnipped = true;
    },
  },
  mounted() {},
  updated() {
    if (!this.licenseSnipped) {
      initSnip({ selector: '#license', button: '#readMoreLicense' });
    }
  },
};
</script>
