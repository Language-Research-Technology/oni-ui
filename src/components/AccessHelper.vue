<script setup lang="ts">
import { inject } from 'vue';
import { useI18n } from 'vue-i18n';

import type { ApiService, EntityType, RoCrate } from '@/services/api';

const { t } = useI18n();

const { access, license } = defineProps<{
  access: EntityType['access'];
  license: RoCrate['license'];
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

const localLicense = Array.isArray(license) ? license[0] : license || { '@id': 'missing', name: 'Missing' };

if (!localLicense) {
  console.warn('🪚 WHY: No license');
  throw new Error('No License');
}
</script>

<template>
  <template v-if="access.content && access.contentAuthorizationUrl">
    <el-row class="px-5 py-6 bg-green-100 text-green-700">
      <p>
        <font-awesome-icon icon="fa-solid fa-5x fa-user-lock" />
        {{ t('access.accessTo') }}
        <a :href="localLicense['@id']" class="font-bold">
          {{ localLicense.name || localLicense['@id'] }}
        </a>
        {{ t('access.grantedTo') }}
        {{ user?.['name'] || user?.['email'] }}
      </p>
    </el-row>
  </template>
  <template v-else-if="!access.content">
    <el-row class="px-5 py-6 bg-red-200 text-red-700">
      <el-row body-class="flex gap-4">
        <p>
          <font-awesome-icon icon="fa-solid fa-5x fa-lock" />
          {{ t('access.requestAccessOrLogin') }}
        </p>
      </el-row>

      <template v-if="isLoggedIn">
        <el-row>
          <p class="items-center">
            {{ t('access.loggedInCanApply') }}
          </p>
        </el-row>

        <template v-if="access.contentAuthorizationUrl">
          <el-row class="mt-4">
            <el-link underline="always" :href="access.metadataAuthorizationUrl" target="_blank">
              {{ t('access.applyForAccess') }} <font-awesome-icon icon="fa-solid fa-arrow-up-right-from-square" />
            </el-link>
          </el-row>
        </template>

        <template v-else>
          <el-row>
            <p class="items-center">
              {{ t('access.noAccessControlUrl') }}
            </p>
          </el-row>
        </template>
      </template>

      <template v-else>
        <a class="underline mt-2 cursor-pointer" v-if="isLoginEnabled" @click="login">
          {{ t('auth.signUpOrLogin') }}
        </a>
      </template>
    </el-row>
  </template>
</template>
