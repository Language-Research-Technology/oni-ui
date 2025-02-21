<template>
  <!-- component -->
  <div class="bg-gray-100 rounded-sm shadow-lg p-4 px-4 md:p-8 mb-6">
    <div class="grid gap-4 gap-y-2 text-sm grid-cols-1 lg:grid-cols-3">
      <div class="text-gray-600">
        <p class="font-medium text-lg">User Memberships</p>
        <p></p>
      </div>

      <div class="lg:col-span-2">
        <div class="grid gap-4 gap-y-2 text-sm grid-cols-1 md:grid-cols-5">
          <div class="md:col-span-5">
            <p class="p-1 m-1 text-center">You have access to the following licenses:</p>
            <br/>
            <ul v-loading="loading" class="divide-y-2 divide-gray-100">
              <li class="p-3" v-for="item in memberships" :key="item">
                {{ item.group }}
              </li>
            </ul>
          </div>
        </div>

        <div class="md:col-span-2">
          <label for="key">&nbsp;</label>
          <div class="h-10 flex rounded-sm items-center mt-1">
            <input type="button" value="Check Memberships" id="key" name="key"
                   class="cursor-pointer bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-sm"
                   @click="this.getUserMemberships()"/>
          </div>
          <div class="h-10 flex mt-2">
            <p>Click 'Check Memberships' to refresh your access list</p>
          </div>
        </div>
      </div>
      <div class="h-10 flex rounded-sm items-center">
        <el-link underline="underline" :href="authorizationProvider?.url" target="_blank" class="mx-1"
                 title="Will open in a new tab">
          Verify your access in {{ authorizationProvider?.label }}&nbsp;<font-awesome-icon
            icon="fa-solid fa-arrow-up-right-from-square"/>
        </el-link>
      </div>
    </div>
  </div>
  <el-dialog v-model="noEmrollmentDialogVisible" width="50%" center>
    <el-alert :title="'Enrollment Required'" type="warning"
              :closable="false">
      <enrollment-card/>
    </el-alert>
    <template #footer>
      <span class="dialog-footer">
        <el-button type="primary" @click="noEmrollmentDialogVisible = false">Continue without enrollment</el-button>
      </span>
    </template>
  </el-dialog>
</template>

<script>
import { getLocalStorage, removeLocalStorage, tokenSessionKey } from '@/storage';
import EnrollmentCard from './cards/EnrollmentCard.component.vue';

export default {
  components: { EnrollmentCard },
  data() {
    return {
      loading: false,
      memberships: [],
      noEmrollmentDialogVisible: false,
      enrollmentUrl: '',
      authorizationProvider: this.$store.state.configuration.ui.authorizationProvider || {},
    };
  },
  mounted() {
    this.enrollmentUrl = this.$store.state.configuration.ui.enrollment.URL;
    this.$nextTick(async function () {
      await this.getUserMemberships();
    });
  },
  methods: {
    async getUserMemberships() {
      this.loading = true;
      const membershipsStatus = await this.$membership.set();
      //TODO: do smarter membership checks
      //If user is not enrolled need to send it to enrollmentURL if configured
      if (this.$store.state.configuration.ui.enrollment?.enforced) {
        if (!membershipsStatus?.enrolled) {
          this.noEmrollmentDialogVisible = true;
        }
      }
      this.memberships = membershipsStatus?.memberships;
      this.loading = false;
    },
  },
};
</script>

<!--
TODO: Read
[VueJS 3](https://v3.vuejs.org/guide/introduction.html)
[Vue-router](https://next.router.vuejs.org/)
[Vuex (state management)](https://next.vuex.vuejs.org/)
[Font Awesome Icons](https://fontawesome.com/v5.15/icons?d=gallery&p=2&m=free)
[Element Plus UI Controls](https://element-plus.org/en-US/component/border.html)
[TailwindCSS - bootstrap on steroids](https://tailwindcss.com/docs)
-->
