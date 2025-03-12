<script setup lang="ts">
import { inject, ref } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { storeToRefs } from 'pinia';

import { useGtm } from '@gtm-support/vue-gtm';

import EnrollmentCard from '@/components/cards/EnrollmentCard.vue';

import { useAuthStore } from '@/stores/auth';

import type { ApiService } from '@/services/api';

const api = inject<ApiService>('api');
if (!api) {
  throw new Error('API instance not provided');
}

const router = useRouter();
const route = useRoute();
const authStore = useAuthStore();
const gtm = useGtm();

const { codeVerifier, isLoggedIn, user, token } = storeToRefs(authStore);

const error = ref(false);
const isLoading = ref(true);
const loadingText = ref('Loading...');
const goHome = ref(false);
const showEnrollment = ref(false);

const setError = (text: string) => {
  console.error(text);
  error.value = true;
  isLoggedIn.value = false;
  loadingText.value = text;
  isLoading.value = false;
};

const getMemberships = async () => {
  try {
    loadingText.value = 'Checking memberships';

    // const membershipsStatus = await this.$membership.set();
    // const memberships = membershipsStatus?.memberships;
    // //TODO: do smarter membership checks
    //If user is not enrolled need to send it to enrollmentURL if configured
    // if (
    //   Array.isArray(memberships) === true &&
    //   memberships.length === 0 &&
    //   this.$store.state.configuration.ui.enrollment.enforced
    // ) {
    //   loadingText.value = 'Please enroll first';
    //   this.showEnrollment = true;
    // } else {
    //   const lastRoute = getLocalStorage({ key: 'lastRoute' });
    //   removeLocalStorage({ key: 'lastRoute' });
    //   if (lastRoute) {
    //     await this.$router.push(lastRoute);
    //   } else {
    //     await this.$router.push('/');
    //   }
    // }
    gtm?.trackEvent({
      event: '/oauth-callback',
      category: 'login',
      label: 'log-in',
      value: route.query.state,
    });
  } catch (e) {
    const err = e as Error;
    setError(err.message);
  }
};

const login = async () => {
  const { provider } = route.params;
  const { code } = route.query;

  if (!code) {
    console.error('No code provided');
    setError('There was an error trying to login, try again');

    return;
  }

  if (!codeVerifier.value) {
    console.error('No code verifier provided');
    setError('There was an error trying to login, try again');

    return;
  }

  try {
    loadingText.value = 'Logging you in';
    const { errors, token: newToken } = await api.getOAuthToken(
      provider as string,
      code?.toString(),
      codeVerifier.value,
    );

    if (errors) {
      setError('There was an error trying to login, try again');

      await new Promise((resolve) => setTimeout(resolve, 3000));

      await router.push('/login');

      gtm?.trackEvent({
        event: '/oauth-callback',
        category: 'login',
        label: 'error-login-in',
        value: errors,
      });

      return;
    }

    isLoggedIn.value = true;
    token.value = newToken;

    const tokenUser = JSON.parse(atob(newToken.split('.')[1]));
    user.value = tokenUser;

    getMemberships();

    isLoading.value = false;
  } catch (e) {
    console.error(e);

    setError('There was an error trying to login, try again');
    goHome.value = true;

    gtm?.trackEvent({
      event: '/oauth-callback',
      category: 'login',
      label: 'error-login-in',
      value: e,
    });
  }
};

login();
</script>

<template>
  <div class="flex items-center justify-center py-32">
    <div class="bg-gray-200 w-96 rounded-lg py-8 flex flex-col items-center">
      <el-row class="h-32 items-center" align="middle">
        <el-col :xs="24" :sm="24" :md="24" :lg="24" :xl="24">
          <p v-loading="isLoading"></p>
        </el-col>
        <el-col class="flex flex-col items-center" :xs="24" :sm="24" :md="24" :lg="24" :xl="24">
          <p>{{ loadingText }}</p>
          <br />
          <p v-if="goHome">
            <el-link href="/login">Login</el-link>
          </p>
        </el-col>
      </el-row>
      <br />
      <el-row v-if="showEnrollment" class="h-32 items-center p-2" align="middle">
        <p>Enrollment is required to access some datasets</p>
        <br />
        <EnrollmentCard />
      </el-row>
      <el-row v-if="showEnrollment" class="p-5" align="middle">
        <p>
          <el-link href="/">Continue without enrollment</el-link>
        </p>
      </el-row>
    </div>
  </div>
</template>
