<script setup lang="ts">
import { useGtm } from '@gtm-support/vue-gtm';
import { inject, onUpdated, ref } from 'vue';
import { ui } from '@/configuration';
import { type ApiService, type EntityType, type GetZipMetaResponse } from '@/services/api';
import { useAuthStore } from '@/stores/auth';
import { formatFileSize } from '@/tools';

const {
  id,
  name,
  asTableRow = false,
  access,
} = defineProps<{
  id: string;
  name: string;
  asTableRow: boolean;
  access?: NonNullable<EntityType['extra']['access']>;
}>();

const api = inject<ApiService>('api');
if (!api) {
  throw new Error('API instance not provided');
}

const { isLoggedIn } = useAuthStore();
const gtm = useGtm();

const emit = defineEmits(['accessDetails']);

const zip = ref<GetZipMetaResponse>();
const loading = ref(false);

const isLoginEnabled = ui.login.enabled;

const zipName = `${name || id}.zip`;

const processZip = async () => {
  zip.value = await api.getZipMeta(id);
  console.log('🪚 🔲');
  console.log('🪚 zip.value:', JSON.stringify(zip.value, null, 2));
  // const access = { hasAccess: zip.value.status !== 'noAccess', group: license };
  // emit('accessDetails', accessDetails);
};

const trackEvent = () => {
  if (zip.value?.status !== 'ok') {
    return;
  }

  gtm?.trackEvent({
    event: 'object-download',
    category: 'object',
    label: 'download-zip',
    value: zip.value.url,
  });
};

const doWork = async () => {
  loading.value = true;
  await processZip();
  loading.value = false;
};

onUpdated(doWork());
doWork();
</script>

<template>
  <!-- TODO: remove this asTableRow -->
  <el-row class="py-2">
    <el-col :xs="32" :sm="asTableRow ? 10 : 32" :md="asTableRow ? 10 : 32" :lg="asTableRow ? 10 : 32"
      :xl="asTableRow ? 10 : 24">
      <p>{{ zipName }}</p>

      <p v-if="zip?.status == 'ok'">
        Files: {{ zip.numberOfFiles }}, Size: {{ formatFileSize(zip.expandedSize || 0) }}
      </p>
    </el-col>

    <el-col :xs="24" :sm="asTableRow ? 4 : 24" :md="asTableRow ? 4 : 24" :lg="asTableRow ? 4 : 24"
      :xl="asTableRow ? 4 : 24">
      <template v-if="zip?.status === 'noAccess'">
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
          <el-row>
            <p class="items-center">
              You are logged in and can apply for permission to view these files.<br><br>
            </p>
          </el-row>
          <el-row>
            <el-link underline="underline" :href="access?.enrollmentUrl" target="_blank">
              Apply for access <font-awesome-icon icon="fa-solid fa-arrow-up-right-from-square" />
            </el-link>
          </el-row>
          <template #reference>
            <el-button type="danger" circle size="large">
              <font-awesome-icon icon="fa-solid fa-lock" size="lg" />
            </el-button>
          </template>
        </el-popover>
      </template>

      <p v-else-if="zip?.status === 'notFound'">
        Zip file {{ zipName }} not found.
      </p>
      <p v-else>
        <el-link ref="linkElement" :underline="false" type="primary" :href="zip?.url" :download="zipName"
          :onClick="trackEvent">
          <el-button type="primary" circle size="large">
            <el-tooltip class="box-item" effect="dark" content="Click to download item." placement="bottom">
              <font-awesome-icon icon="fa-solid fa-download" size="lg" />
            </el-tooltip>
          </el-button>
        </el-link>
      </p>
    </el-col>
  </el-row>
</template>
