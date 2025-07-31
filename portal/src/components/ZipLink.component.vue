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
      <template v-if="zip.noAccess">
        <el-popover v-if="!isLoggedIn" placement="top" :width="260">
          <p>Access to this content is restricted.<br>Request Access:<br><br></p>
          <div style="text-align: left; margin: 0">
            <el-button type="primary">
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
        <el-popover v-else placement="top" :width="260">
          <enrollment-card v-if="noEnrollment" />
          <el-row>
            <p class="items-center">
              You are logged in and can apply for permission to view these files.<br><br>
            </p>
          </el-row>
          <el-row v-if="enrollment?.url">
            <el-link underline="underline" :href="enrollment.url" target="_blank">
              {{ enrollment.label }}
              &nbsp;<font-awesome-icon icon="fa-solid fa-arrow-up-right-from-square" />
            </el-link>
          </el-row>
          <template #reference>
            <el-button type="danger" circle size="large">
              <font-awesome-icon icon="fa-solid fa-lock" size="lg" />
            </el-button>
          </template>
        </el-popover>
      </template>
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
import { first, isEqual } from 'lodash';
import EnrollmentCard from './cards/EnrollmentCard.component.vue';

export default {
  components: { EnrollmentCard },
  props: ['id', 'name', 'message', 'licenses', 'asTableRow', 'access'],
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
      enrollment: {},
      errorDialogText: '',
      noEnrollment: false,
      user: '',
      helpUrl: this.$store.state.configuration.ui?.help?.helpUrl || '',
      loading: false,
      memberships: [],
      licenseConfig: this.$store.state.configuration.ui?.licenses || [],
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
    this.loading = true;
    await this.checkUserMemberships();
    this.getEnrollment();
    this.user = this.$store.state.user;
    this.loading = false;
  },
  async updated() {
    await this.processZip();
    this.loading = true;
    await this.checkUserMemberships();
    this.getEnrollment();
    this.user = this.$store.state.user;
    this.loading = false;
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
      if (this.licenseConfig.length > 0) {
        if (this.access) {
          const license = this.licenseConfig.find((l) => {
            if (l.group === this.access.group) {
              return l.enrollment;
            }
          })
          //TODO: I'm sending the this.license but not using it??
          // const propLicense = this.license;
          // debugger
          this.enrollment = license?.enrollment;
        }
      } else {
        this.errorDialogText = 'No licenses configured';
      }
      console.log(license)
    },
  },
};
</script>
