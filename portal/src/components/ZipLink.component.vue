<template>
  <!-- TODO: remove this asTableRow -->
  <el-row class="py-2">
    <el-col :xs="24" :sm="asTableRow ? 8 : 24" :md="asTableRow ? 8 : 24" :lg="asTableRow ? 8 : 24"
            :xl="asTableRow ? 8 : 24" v-if="!zip.notFound">
      <p v-if="zip?.numberOfFiles && zip?.expandedSize">
        Files: {{ zip.numberOfFiles }}, Size: {{ zip.expandedSize }}
      </p>
    </el-col>
    <el-col :xs="24" :sm="asTableRow ? 8 : 24" :md="asTableRow ? 8 : 24" :lg="asTableRow ? 8 : 24"
            :xl="asTableRow ? 8 : 24">
      <p v-if="zip.noAccess">
        You do not have permission to download these files.
        <el-link :underline="false" type="primary">
          <template v-if="!isLoggedIn">
            <router-link class="underline" v-if="isLoginEnabled" to="/login">Sign up or Login</router-link>
          </template>
        </el-link>
      </p>
      <p v-else-if="zip.notFound">
        Zip file {{ zip.name }} not found.
      </p>
      <p v-else>
        <el-link ref="linkElement" :underline="true" type="primary" :href="zip.url" :download="zip.name"
                 :onClick="trackEvent">
          {{ zip.name }}
          <el-tooltip v-if="message" class="box-item" effect="light" trigger="hover" :content="message" placement="top">
            <el-button size="small" link>
              <font-awesome-icon icon="fa-solid fa-circle-info"/>
            </el-button>
          </el-tooltip>
        </el-link>
      </p>
    </el-col>
    <el-col :xs="24" :sm="asTableRow ? 8 : 24" :md="asTableRow ? 8 : 24" :lg="asTableRow ? 8 : 24"
            :xl="asTableRow ? 8 : 24" v-if="!zip.notFound">
      <p v-for="license of licenses">
        <span class="justify-self-center">
          <a class="underline" :href="license['@id']">
            {{ first(license.name)?.['@value'] }}</a>
        </span>
      </p>
    </el-col>
  </el-row>
</template>
<script>
import {getLocalStorage} from '@/storage';
import convertSize from 'convert-size';
import {first} from 'lodash';

export default {
  props: ['id', 'name', 'message', 'licenses', 'asTableRow'],
  data() {
    return {
      isLoggedIn: false,
      isLoginEnabled: this.$store.state.configuration.ui.login?.enabled,
      zip: {
        url: undefined,
        name: undefined,
        expandedSize: '',
        numberOfFiles: 0,
      },
    };
  },
  watch: {
    '$store.state.user': {
      async handler() {
        this.isLoggedIn = getLocalStorage({key: 'isLoggedIn'});
      },
      flush: 'post',
      immediate: true,
    },
  },
  async mounted() {
    await this.processZip();
  },
  async updated() {
    await this.processZip();
  },
  methods: {
    first,
    async processZip() {
      this.isLoggedIn = getLocalStorage({key: 'isLoggedIn'});
      this.zip = await this.$zip.get(this.id, this.name);
      const group = first(this.licenses)?.['@id'];
      const access = {hasAccess: this.zip.hasAccess, group};
      const accessDetails = {access, license: first(this.license)};
      this.$emit('accessDetails', accessDetails);
    },
    trackEvent(e) {
      this.$gtag.event('object-download', {
        event_category: 'object',
        event_label: 'download-zip',
        value: this.zip.url,
      });
    },
  },
};
</script>
