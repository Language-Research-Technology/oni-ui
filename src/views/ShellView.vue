<script setup lang="ts">
import { onMounted, ref, watch } from 'vue';

import { RouterView, useRoute, useRouter } from 'vue-router';
import FooterView from '@/components/Footer.vue';
import MaintenacePage from '@/components/MaintenacePage.vue';
import NavView from '@/components/Nav.vue';
import { configuration } from '@/configuration';
import { logout } from '@/services/auth';

const { ui } = configuration;
const router = useRouter();
const route = useRoute();

import { useAuthStore } from '@/stores/auth';

const authStore = useAuthStore();

const {
  login: { manageTermsAndConditions },
} = ui;

const defaultNavRoute = ui?.topNavItems?.[0]?.route || '/search';

const showTerms = ref(false);
const terms = ref<{ id?: string; description?: string; body?: string; url?: string } | undefined>(undefined);

const manageTerms = async () => {
  // TODO
  const fetchedTerms = {
    error: undefined,
    agreement: 'moo',
    id: '123',
    description: 'moo',
    body: 'moo',
    url: 'https://localhost:6000/moo',
  }; // await this.$terms.get();
  if (fetchedTerms.error) {
    throw new Error(`Error managing Terms and Conditions: ${fetchedTerms.error}`);
  }

  if (!fetchedTerms.agreement) {
    showTerms.value = true;
  }

  terms.value = fetchedTerms;
  authStore.loginTermsUrl = fetchedTerms.url;
};

const acceptTerms = async () => {
  // TODO
  const response = { error: undefined }; // await this.$terms.accept(this.terms.id);
  //If there is an error I dont want to alert the user.
  showTerms.value = false;

  if (response.error) {
    throw new Error(`Error accepting Terms and Conditions: ${response.error}`);
  }
};

const doLogout = async () => {
  logout();

  authStore.user = undefined;
  authStore.isLoggedIn = false;
  authStore.lastRoute = undefined;
  showTerms.value = false;

  await router.push('/logout');
};

onMounted(() => {
  if (route.path === '/') {
    router.push(defaultNavRoute);
  }
});

watch(
  () => route.path,
  (path) => {
    if (path === '/') {
      router.push(defaultNavRoute);
    }
  },
);

if (authStore.isLoggedIn && manageTermsAndConditions) {
  manageTerms();
}
</script>

<template>
  <template v-if="ui">
    <header class="sticky top-0 z-50">
      <el-row :gutter="0" :offset="0" style="" class="flex items-center justify-center">
        <el-col :xs="24" :sm="24" :md="24" :lg="22" :xl="17" :offset="0">
          <NavView />
        </el-col>
      </el-row>
    </header>

    <el-row :gutter="0" :offset="0" style="" class="flex items-center justify-center">
      <el-col :xs="24" :sm="24" :md="24" :lg="22" :xl="17" :offset="0">
        <main class="">
          <RouterView />
        </main>
      </el-col>
    </el-row>

    <footer>
      <FooterView />
    </footer>
  </template>

  <template v-else>
    <MaintenacePage />
  </template>

  <el-dialog v-model="showTerms" width="50%" center class="mt-4 mb-4" :show-close="false" :close-on-click-modal="false">
    <template #header>
      <h2 class="break-normal">Terms And Conditions</h2>
    </template>

    <div>
      <p class="font-bold">{{ terms?.description }}</p>
      <pre class="whitespace-pre-wrap py-4 mt-3">{{ terms?.body }}</pre>

      <br />

      <a :href="terms?.url" class="break-normal underline text-blue-600" target="_blank noreferer">
        Terms & Conditions
      </a>
    </div>

    <template #footer>
      <span class="dialog-footer">
        <el-button type="primary" @click="acceptTerms">Accept Terms</el-button>
        <el-button type="info" @click="doLogout">Logout</el-button>
      </span>
    </template>
  </el-dialog>
</template>

<style>
.el-dialog {
  width: unset;
  max-width: var(--el-dialog-width);
}

.el-dialog .el-dialog__body {
  max-height: calc(100svh - 350px);
  overflow: auto;
}
</style>
