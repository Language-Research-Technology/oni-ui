<script setup lang="ts">
import { onMounted, onUpdated, ref } from 'vue';

import EnrollmentCard from '@/components/cards/EnrollmentCard.vue';

const { access, license } = defineProps<{
  access: { hasAccess: boolean; group?: string };
  license: { '@id': string; name?: string };
}>();

import { useConfigurationStore } from '@/stores/configuration';
import { useUserStore } from '@/stores/user';

const { ui } = useConfigurationStore();
const { isLoggedIn, user } = useUserStore();

const {
  login: { enabled: isLoginEnabled },
  licenses,
} = ui;

const isLoading = ref(false);
const errorMessage = ref('');
const noEnrollment = ref(false);
const enrollment = ref<{ url: string; label: string; class: string }>();

const getEnrollment = () => {
  if (licenses.length === 0) {
    errorMessage.value = 'No licenses configured';
  }

  const license = licenses.find((l) => {
    if (l.group === access.group) {
      return l.enrollment;
    }
  });

  // @ts-expect-error Need to fix types
  enrollment.value = license?.enrollment;
};

// const refreshAuthorization = () => {
//   const membershipsStatus = await this.$membership.set();
//   if (!membershipsStatus.error) {
//     //await this.$router.push(this.$route.fullPath);
//     window.location.reload();
//   }
// };

const doWork = async () => {
  isLoading.value = true;

  // await checkUserMemberships(false);
  getEnrollment();

  isLoading.value = false;
};
onUpdated(doWork);

onMounted(doWork);
</script>

<template v-loading="loading">
  <template v-if="access['hasAccess'] && access['group']">
    <el-row class="px-5 py-6 bg-green-100 text-green-700">
      <div class="pr-3">
        <font-awesome-icon icon="fa-solid fa-5x fa-user-lock" />
      </div>
      <div>
        <p>Access to <a :href="license['@id']" class="font-bold">{{
          license['name'] || license['@id']
            }}</a> granted
          to {{ user?.['name'] || user?.['email'] }}
        </p>
      </div>
    </el-row>
  </template>

  <template v-else-if="!access['hasAccess']">
    <el-row class="px-5 py-6 bg-red-200 text-red-700">
      <el-row>
        <p class="items-center">
          <font-awesome-icon icon="fa-solid fa-5x fa-lock" />&nbsp;You do not have
          permission to see these files.&nbsp;
        </p>
      </el-row>

      <el-row v-if="errorMessage">
        <p class="items-center">
          {{ errorMessage }}
        </p>
      </el-row>

      <template v-if="isLoggedIn" v-loading="isLoading">
        <EnrollmentCard v-if="noEnrollment" />

        <template v-else>
          <el-row>
            <p class="items-center">You are logged in and you can apply for
              permission to view these files</p>
          </el-row>

          <el-row v-if="enrollment?.url">
            <el-link :underline="true" :href="enrollment.url" target="_blank" class="mx-1"
              title="Will open in a new tab">
              {{ enrollment.label }}&nbsp;<font-awesome-icon icon="fa-solid fa-arrow-up-right-from-square" />
            </el-link>
            <EnrollmentCard v-if="noEnrollment" />
          </el-row>

          <el-row v-if="enrollment?.url">
            or
            <!-- <el-link underline="underline" type='default' @click="refreshAuthorization()" class="mx-1"> -->
            refresh permissions
            <!-- </el-link> -->
            <EnrollmentCard v-if="noEnrollment" />
          </el-row>

          <el-row v-else>
            <p class="items-center">No access control url has been configured,
              please contact the administrator</p>
          </el-row>
        </template>
      </template>

      <template v-if="!isLoggedIn">
        <router-link class="underline" v-if="isLoginEnabled" to="/login">Sign up or
          Login</router-link>
      </template>
    </el-row>
  </template>
</template>
