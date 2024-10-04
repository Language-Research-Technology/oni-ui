<template>
  <el-row :gutter="20" class="pb-5" v-if="zip?.url">
    <el-col>
      <el-card :body-style="{ padding: '0px' }" class="mx-10 p-5">
        <h5 class="text-2xl font-medium">Downloads</h5>
        <hr class="divider divider-gray pt-2"/>
        <el-row>
          <el-link v-if="noAccess">
            You do not have permission to download these files.
            <template v-if="!isLoggedIn">
              <router-link class="underline" v-if="isLoginEnabled" to="/login">Sign up or Login</router-link>
            </template>
          </el-link>
          <el-link
              v-else
              :underline="true"
              type="primary"
              :href="zip.url"
              :download="zip.name">
            {{ zip.name }}
          </el-link>
          <el-tooltip v-if="zip?.numberOfFiles && zip?.expandedSize"
                      class="box-item"
                      effect="light"
                      trigger="click"
                      :content="'Number of files: ' + zip.numberOfFiles + ', size: ' + zip.expandedSize + '.'"
                      placement="top"
          >
            <el-button link>
              <font-awesome-icon icon="fa-solid fa-circle-info"/>
            </el-button>
          </el-tooltip>
        </el-row>
      </el-card>
    </el-col>
  </el-row>
</template>
<script>

import convertSize from "convert-size";

export default {
  props: ['name', 'id'],
  data() {
    return {
      isLoginEnabled: this.$store.state.configuration.ui.login?.enabled,
      isLoggedIn: false,
      noAccess: false,
      zip: {
        url: undefined,
        name: undefined,
        expandedSize: '',
        numberOfFiles: 0
      }
    }
  },
  watch: {
    'name': {
      handler(newValue, oldValue) {
        let fileName;
        if (newValue && newValue[0] && newValue?.[0]['@value']) {
          fileName = newValue?.[0]['@value'];
        } else {
          fileName = this.id;
        }
        this.zip.name = fileName + '.zip';
      },
      deep: true
    },
    'id': {
      async handler(newValue, oldValue) {
        await this.getObjectZip(newValue);
      },
      immediate: true
    },
    '$store.state.user': {
      async handler() {
        this.isLoggedIn = getLocalStorage({key: 'isLoggedIn'});
      },
      flush: 'post',
      immediate: true
    }
  },
  methods: {
    async getObjectZip(id) {
      //TODO: do we have other downloads?
      const route = `/object/${encodeURIComponent(id)}.zip`;
      let response = await this.$http.head({route});
      if (response.status === 200) {
        //TODO: response headers
        //TODO: calculate size from bites from the header called
        this.zip.url = `/api${route}`;
        try {
          const expandedSize = response.headers.get('Content-Length-Estimate')
          this.zip.expandedSize = convertSize(parseInt(expandedSize), {accuracy: 2});
        } catch (e) {
          console.error(e);
        }
        const numberOfFiles = response.headers.get('Archive-File-Count')
        this.zip.numberOfFiles = numberOfFiles;
      }
      if (response.status === 403) {
        this.noAccess = true;
      }
    }
  }
}
</script>
