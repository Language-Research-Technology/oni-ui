<template>
  <div class="flex items-center justify-center py-32">
    <div class="bg-gray-200 w-96 rounded-lg py-8 flex flex-col items-center">
      <el-row class="h-32 items-center" align="middle">
        <el-col :xs="24" :sm="24" :md="24" :lg="24" :xl="24">
          <p v-loading="loading"></p>
        </el-col>
        <el-col class="flex flex-col items-center" :xs="24" :sm="24" :md="24" :lg="24" :xl="24">
          <p>{{ loadingText }}</p>
          <br/>
          <p v-if="goHome">
            <el-link href="/login">Login</el-link>
          </p>
        </el-col>
      </el-row>
      <br/>
      <el-row v-if="showEnrollment" class="h-32 items-center p-2" align="middle">
        <p>Enrollment is required to access some datasets</p>
        <br/>
        <enrollment-card/>
      </el-row>
      <el-row v-if="showEnrollment" class="p-5" align="middle">
        <p>
          <el-link href="/">Continue without enrollment</el-link>
        </p>
      </el-row>
    </div>
  </div>
</template>

<script>
import {
  loginSessionKey,
  tokenSessionKey,
  putLocalStorage,
  getLocalStorage,
  removeLocalStorage,
} from "@/storage";
import EnrollmentCard from '../cards/EnrollmentCard.component.vue';
import {event as gaEvent} from 'vue-gtag';

export default {
  components: {EnrollmentCard},
  data() {
    return {
      error: false,
      loading: true,
      loadingText: 'Loading...',
      goHome: false,
      showEnrollment: false
    };
  },
  mounted() {
    this.login();
  },
  methods: {
    async login() {
      try {
        this.loadingText = 'Logging you in';
        let {code_verifier} = getLocalStorage({key: loginSessionKey}) || {};
        removeLocalStorage({key: loginSessionKey});
        let response = await this.$http.post({
          route: `/oauth/${this.$route.query.state}/code`,
          body: {code: this.$route.query.code, state: this.$route.query.state, code_verifier},
        });
        if (response.status !== 200) {
          this.error = true;
          this.$store.commit("setIsLoggedIn", false);
          console.log(response.statusText);
          this.loadingText = 'There was an error trying to login, try again';
          this.loading = false;
          await new Promise((resolve) => setTimeout(resolve, 3000));
          await this.$router.push("/login");
          this.$gtag.event("/oauth-callback", {
            'event_category': "login",
            'event_label': "error-login-in",
            'value': response.status
          });
        } else {
          try {
            this.loadingText = 'Checking memberships';
            let {token} = await response.json();
            let user = JSON.parse(atob(token.split(".")[1]));
            this.$store.commit("setUserData", user);
            this.$store.commit("setIsLoggedIn", true);
            putLocalStorage({key: tokenSessionKey, data: {token}});
            this.$cookies.set("session", token);
            const membershipsStatus = await this.$membership.set();
            const memberships = membershipsStatus?.memberships;
            //TODO: do smarter membership checks
            //If user is not enrolled need to send it to enrollmentURL if configured
            if (Array.isArray(memberships) === true && memberships.length === 0 && this.$store.state.configuration.ui.enrollment.enforced) {
              this.loadingText = 'Please enroll first';
              this.showEnrollment = true;
            } else {
              let lastRoute = getLocalStorage({key: 'lastRoute'});
              removeLocalStorage({key: 'lastRoute'});
              if (lastRoute) {
                await this.$router.push(lastRoute);
              } else {
                await this.$router.push("/");
              }
            }
            this.$gtag.event("/oauth-callback", {
              'event_category': "login",
              'event_label': "log-in",
              'value': this.$route.query.state
            });
            this.loading = false;
          } catch (e) {
            this.loading = false;
            this.loadingText = e.message;
            console.log(e);
          }
        }
      } catch (e) {
        this.loadingText = 'there was an error login you in, please try again';
        this.goHome = true;
        this.loading = false;
        this.$gtag.event("/oauth-callback", {
          'event_category': "login",
          'event_label': "error-login-in",
          'value': e
        });
        console.error(e);
      }
    },
  },
};
</script>
