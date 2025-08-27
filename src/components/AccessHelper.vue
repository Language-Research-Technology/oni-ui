<script setup lang="ts">
import { inject } from 'vue';

import type { ApiService, EntityType, RoCrate } from '@/services/api';

const { access, license } = defineProps<{
  access: NonNullable<EntityType['extra']['access']>;
  license: NonNullable<RoCrate['license']>;
}>();

import { ui } from '@/configuration';
import { login } from '@/services/auth';
import { useAuthStore } from '@/stores/auth';

const { isLoggedIn, user } = useAuthStore();

const api = inject<ApiService>('api');
if (!api) {
  throw new Error('api is not provided');
}

const {
  login: { enabled: isLoginEnabled },
} = ui;

const localLicense = Array.isArray(license) ? license[0] : license;

if (!localLicense) {
  console.warn('🪚 WHY: No license');
  throw new Error('No License');
}
</script>

<template>
  <template v-if="access.files">
    <el-row class="px-5 py-6 bg-green-100 text-green-700">
      <p>
        <font-awesome-icon icon="fa-solid fa-5x fa-user-lock" />
        Access to
        <a :href="localLicense['@id']" class="font-bold">
          {{ localLicense['name'] || localLicense['@id'] }}
        </a>
        granted to
        {{ user?.['name'] || user?.['email'] }}
      </p>
    </el-row>
  </template>

  <template v-else>
    <el-row class="px-5 py-6 bg-red-200 text-red-700">
      <el-row body-class="flex gap-4">
        <p>
          <font-awesome-icon icon="fa-solid fa-5x fa-lock" />
          Request access or login for this item.
        </p>
      </el-row>

      <template v-if="isLoggedIn">
        <el-row>
          <p class="items-center">
            You are logged in and can apply for permission to view these files
          </p>
        </el-row>

        <template v-if="access.enrollmentUrl">
          <el-row class="mt-4">
            <el-link underline="always" :href="access.enrollmentUrl" target="_blank">
              Apply for access <font-awesome-icon icon="fa-solid fa-arrow-up-right-from-square" />
            </el-link>
          </el-row>
        </template>

        <template v-else>
          <el-row>
            <p class="items-center">
              No access control URL has been configured, please contact the administrator.
            </p>
          </el-row>
        </template>
      </template>

      <template v-else>
        <a class="underline mt-2 cursor-pointer" v-if="isLoginEnabled" @click="login">
          Sign Up or Log In
        </a>
      </template>
    </el-row>
  </template>
</template>
