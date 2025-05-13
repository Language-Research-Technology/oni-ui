<template v-loading="loading">

  <template v-for="(f, index) of buckets" :key="f.field+'_'+index" v-loading="loading">
    <h5><span class="font-semibold">{{ f.field }}</span></h5>
    <ul class="list-disc my-2 mx-3 pl-2" v-if="f?.buckets.length > 0">
      <template v-for="bucket of f?.buckets" :key="bucket.key">
        <li>{{ bucket.key }}</li>
      </template>
    </ul>
  </template>
  <template v-if="access && access['hasAccess'] && access['group']">
    <el-row class="px-5 py-6 bg-green-100 text-green-700">
      <div class="pr-3">
        <font-awesome-icon icon="fa-solid fa-5x fa-user-lock"/>
      </div>
      <div>
        <template v-for="(l, index) of licenses">
          {{l}}
        </template>
        <p>Access to <a :href="license['@id']" class="font-bold">{{
            first(license['name'])?.['@value'] || license['@id']
          }}</a> granted
          to {{ this.user?.['name'] || this.user?.['email'] }}
        </p>
      </div>
    </el-row>
  </template>
  <template v-else-if="access && !access['hasAccess']">
    <el-row class="px-5 py-6 bg-yellow-200 text-yellow-700">
      <el-row>
        <p class="items-center">
          <font-awesome-icon icon="fa-solid fa-5x fa-lock"/>&nbsp;Request access for this item.&nbsp;
        </p>
      </el-row>
      <el-row v-if="errorMessage">
        <p class="items-center">
          {{ errorMessage }}
        </p>
      </el-row>
      <template v-if="isLoggedIn" v-loading="loading">
        <enrollment-card v-if="noEnrollment"/>
        <template v-else>
          <el-row>
            <p class="items-center">You are logged in and you can apply for permission to view these files</p>
          </el-row>
          <el-row v-if="enrollment?.url">
            <el-link underline="underline" :href="enrollment.url" target="_blank" class="mx-1"
                     title="Will open in a new tab">
              {{ enrollment.label }}&nbsp;<font-awesome-icon icon="fa-solid fa-arrow-up-right-from-square"/>
            </el-link>
            <enrollment-card v-if="noEnrollment"/>
          </el-row>
          <el-row v-if="enrollment?.url">
            or <el-link underline="underline" type='default' @click="refreshAuthorization()" class="mx-1">
            refresh permissions
          </el-link>
            <enrollment-card v-if="noEnrollment"/>
          </el-row>
          <el-row v-else>
            <p class="items-center">No access control url has been configured, please contact the administrator</p>
          </el-row>
        </template>
      </template>
      <template v-if="!isLoggedIn">
        <router-link class="underline" v-if="isLoginEnabled" to="/login">Sign up or Login</router-link>
      </template>
    </el-row>
  </template>
</template>
<script>
import { first, isEqual } from 'lodash';

import { getLocalStorage } from '@/storage';
import EnrollmentCard from './cards/EnrollmentCard.component.vue';

export default {
  components: { EnrollmentCard },
  props: ['id','licenses'],
  data() {
    return {
      restrictedLicenses: this.$store.state.configuration.ui?.licenses || [],
      isLoginEnabled: this.$store.state.configuration.ui.login?.enabled,
      emailHelp: this.$store.state.configuration.ui?.email?.help,
      enrollment: {},
      errorDialogText: '',
      isLoggedIn: false,
      noEnrollment: false,
      user: '',
      helpUrl: this.$store.state.configuration.ui?.help?.helpUrl || '',
      loading: false,
      errorMessage: undefined,
      memberships: [],
      access: null,
      buckets: [],
      fields: [{ 'name': 'license.name.@value', 'display': 'Data licenses for access' }],
      aggregations: { 'license.@id': { 'terms': { 'field': 'license.name.@value.keyword', 'size': '1000' } } }
    };
  },
  watch: {
    //lazy watcher to detect if it has been emptied and its not freshly mounted
    //TODO: not sure if we need both watchers and mounted to checkIfLoggedIn
    '$store.state.user': {
      async handler() {
        this.isLoggedIn = getLocalStorage({ key: 'isLoggedIn' });
      },
      flush: 'post',
      immediate: true,
    },
  },
  computed() {
    this.loading = true;
    this.populateBuckets();
    this.loading = false;
  },
  async updated() {
    //await this.loadData();
  },
  async mounted() {
    await this.loadData();
  },
  methods: {
    first,
    populateBuckets() {
      this.buckets = [];
      for (const field of this.fields) {
        if (this.aggregations?.[field?.name]) {
          this.buckets.push({
            name: field.name,
            field: field.display,
            buckets: this.aggregations[field.name]?.buckets,
          });
        }
      }
    },
    async checkUserMemberships(isClick) {
      const membershipsStatus = await this.$membership.get();
      if (!membershipsStatus.error) {
        if (membershipsStatus.unenrolled) {
          this.noEnrollment = true;
        } else {
          if (isClick) {
            if (!isEqual(this.memberships, membershipsStatus.memberships)) {
              this.memberships = membershipsStatus.memberships;
              // Instead of re-rendering the spa with router.go, I will reload the entire thing, because in Safari it was not working
              // this.$router.go(0);
              window.location.reload();
            }
          } else {
            this.memberships = membershipsStatus.memberships;
          }
        }
      } else {
        this.isLoggedIn = getLocalStorage({ key: 'isLoggedIn' });
      }
    },
    getEnrollment() {
      if (this.restrictedLicenses.length > 0) {
        const license = this.restrictedLicenses.find((l) => {
          if (l.group === this.access?.group) {
            return l.enrollment;
          }
        });
        //TODO: I'm sending the this.license but not using it??
        // const propLicense = this.license;
        // debugger
        this.enrollment = license?.enrollment;
      } else {
        this.errorDialogText = 'No licenses configured';
      }
    },
    async refreshAuthorization() {
      const membershipsStatus = await this.$membership.set();
      if (!membershipsStatus.error) {
        //await this.$router.push(this.$route.fullPath);
        window.location.reload();
      }
    },
    async loadData() {
      this.loading = true;
      console.log('aggregations', this.aggregations);
      const filters = {'_collectionStack.@id': [this.id]};
      const result = await this.$elasticService.filter({filters, aggregations: this.aggregations});
      console.log('result', result);
      this.buckets = result?.aggregations || [];
      await this.checkUserMemberships();
      this.getEnrollment();
      this.user = this.$store.state.user;
      this.loading = false;
    }
  }
};
</script>
