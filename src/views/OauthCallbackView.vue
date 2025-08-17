<script setup lang="ts">
import { storeToRefs } from 'pinia';
import { inject, onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';

import EnrollmentCard from '@/components/cards/EnrollmentCard.vue';
import type { ApiService } from '@/services/api';
import { handleCallback } from '@/services/auth';
import { useAuthStore } from '@/stores/auth';

const api = inject<ApiService>('api');
if (!api) {
  throw new Error('API instance not provided');
}

const router = useRouter();
const authStore = useAuthStore();

const { isLoggedIn, user, lastRoute } = storeToRefs(authStore);

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
  } catch (e) {
    const err = e as Error;
    setError(err.message);
  }
};

onMounted(async () => {
  try {
    const newUser = await handleCallback();
    if (!newUser) {
      setError('There was an error trying to login, try again');
      goHome.value = true;
      return;
    }

    user.value = newUser;
    isLoggedIn.value = true;

    getMemberships();
  } catch (error) {
    console.error('Authentication error:', error);
    setError('There was an error trying to login, try again');
    goHome.value = true;
  }

  if (lastRoute.value) {
    const route = lastRoute.value;
    lastRoute.value = undefined;
    await router.push(route);
  } else {
    await router.push('/');
  }
});
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
            <el-link>
              <router-link to="/login">
                Login
              </router-link>
            </el-link>
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
          <el-link>
            <router-link to="/">Continue without enrollment</router-link>
          </el-link>
        </p>
      </el-row>
    </div>
  </div>
</template>
