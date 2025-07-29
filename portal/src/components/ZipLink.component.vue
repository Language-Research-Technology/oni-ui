<template>
  <!-- TODO: remove this asTableRow -->
  <el-row class="py-2">
    <el-col :xs="24" :sm="asTableRow ? 10 : 24" :md="asTableRow ? 10 : 24" :lg="asTableRow ? 10 : 24"
      :xl="asTableRow ? 10 : 24">
      <p>
        {{ zip.name }}
      </p>
      <p v-if="zip?.numberOfFiles && zip?.expandedSize">
        Files: {{ zip.numberOfFiles }}, Size: {{ zip.expandedSize }}
      </p>
      <p>
        <el-tooltip v-if="message" class="box-item" effect="light" trigger="hover" :content="message" placement="top">
          <el-button size="small" link>
            <font-awesome-icon icon="fa-solid fa-circle-info" />
          </el-button>
        </el-tooltip>
      </p>
    </el-col>
    <el-col :xs="24" :sm="asTableRow ? 10 : 24" :md="asTableRow ? 10 : 24" :lg="asTableRow ? 10 : 24"
      :xl="asTableRow ? 10 : 24" v-if="!zip.notFound">
      <p v-for="license of licenses">
        <span class="justify-self-center">
          <a class="underline" :href="license['@id']" target="_blank">
            {{ first(license.name)?.['@value'] }}</a>
        </span>
      </p>
    </el-col>
    <el-col :xs="24" :sm="asTableRow ? 4 : 24" :md="asTableRow ? 4 : 24" :lg="asTableRow ? 4 : 24"
      :xl="asTableRow ? 4 : 24">
      <p v-if="zip.noAccess">
        <el-popover v-if="!isLoggedIn" :visible="visible" placement="top" :width="260">
          <p>Access to this content is restricted.<br>Request Access:<br><br></p>
          <div style="text-align: left; margin: 0">
            <el-button type="primary" @click="visible = false">
              <template v-if="!isLoggedIn">
                <router-link v-if="isLoginEnabled" to="/login">Sign Up or Log In</router-link>
              </template>
            </el-button>
          </div>
          <template #reference>
            <el-button type="danger" circle size="large">
              <font-awesome-icon icon="fa-solid fa-lock" size="lg" />
            </el-button>
          </template>
        </el-popover>
        <el-popover v-else-if="isLoggedIn" :visible="visible" placement="top" :width="260">
          <el-row>
            <p class="items-center">Access to this content is restricted. You are logged in and can apply for permission
              to access these files.</p>
          </el-row>
          <template #reference>
            <el-button type="danger" circle size="large">
              <font-awesome-icon icon="fa-solid fa-lock" size="lg" />
            </el-button>
          </template>
        </el-popover>
      </p>
      <p v-else-if="zip.notFound">
        Zip file {{ zip.name }} not found.
      </p>
      <p v-else>
        <el-link ref="linkElement" :underline="false" type="primary" :href="zip.url" :download="zip.name"
          :onClick="trackEvent">
          <el-button type="primary" circle size="large">
            <el-tooltip class="box-item" effect="dark" content="Click to download item." placement="bottom">
              <font-awesome-icon icon="fa-solid fa-arrow-down" size="xl" />
            </el-tooltip>
          </el-button>
        </el-link>
      </p>
    </el-col>
  </el-row>
</template>
<script>
import { getLocalStorage } from '@/storage';
import convertSize from 'convert-size';
import { first } from 'lodash';

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
        this.isLoggedIn = getLocalStorage({ key: 'isLoggedIn' });
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
      this.isLoggedIn = getLocalStorage({ key: 'isLoggedIn' });
      this.zip = await this.$zip.get(this.id, this.name);
      const group = first(this.licenses)?.['@id'];
      const access = { hasAccess: this.zip.hasAccess, group };
      const accessDetails = { access, license: first(this.license) };
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
