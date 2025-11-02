<script setup lang="ts">
import { useGtm } from '@gtm-support/vue-gtm';
import { injectHead } from '@unhead/vue';
import { inject, onMounted, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRoute } from 'vue-router';

import AccessHelper from '@/components/AccessHelper.vue';
import CollectionMembers from '@/components/CollectionMembers.vue';
import CitationCard from '@/components/cards/CitationCard.vue';
import LicenseCard from '@/components/cards/LicenseCard.vue';
import MemberOfCard from '@/components/cards/MemberOfCard.vue';
import RetrieveDataMetadata from '@/components/cards/RetrieveDataMetadata.vue';
import SummariesCard from '@/components/cards/SummariesCard.vue';
import TakedownCard from '@/components/cards/TakedownCard.vue';
import DownloadsModal from '@/components/DownloadsModal.vue';
import MetaField from '@/components/MetaField.vue';
import MemberOfLink from '@/components/widgets/MemberOfLink.vue';
import { useHead } from '@/composables/head';
import { useEntityView } from '@/composables/useEntityView';
import { ui } from '@/configuration';
import type { ApiService, EntityType, RoCrate } from '@/services/api';

const { t } = useI18n();
const route = useRoute();
const head = injectHead();
const gtm = useGtm();

const api = inject<ApiService>('api');
if (!api) {
  throw new Error('API instance not provided');
}

const { collection: config, features } = ui;

const id = route.query.id as string;

const errorDialogText = ref('');
const errorDialogVisible = ref(false);
const openDownloads = ref(false);

const metadata = ref<RoCrate | undefined>();
const entity = ref<EntityType | undefined>();

const { name, meta, populateName, populateMeta, handleMissingEntity } = useEntityView(config);

const populate = (md: RoCrate) => {
  populateName(md);
  populateMeta(md);
  useHead(head, md);
};

const fetchData = async () => {
  if (!id) {
    handleMissingEntity();

    return;
  }

  try {
    const { error, entity: rawEntity, metadata: rawMeatadata } = await api.getEntity(id);
    if (error) {
      errorDialogText.value = error;
      errorDialogVisible.value = true;

      return;
    }

    if (!rawMeatadata) {
      handleMissingEntity();

      return;
    }

    gtm?.trackEvent({
      event: '/collection',
      category: 'collection',
      label: 'loaded-collection',
      value: id,
    });

    metadata.value = rawMeatadata;
    entity.value = rawEntity;

    populate(rawMeatadata);
  } catch (e) {
    console.error(e);
  }

  document.dispatchEvent(
    new Event('ZoteroItemUpdated', {
      bubbles: true,
      cancelable: true,
    }),
  );
};

watch(
  () => route.params,
  () => fetchData(),
);

onMounted(fetchData);
</script>

<template>
  <div v-if="metadata && entity" class="px-10 pt-10 pb-7 bg-white z-10">
    <el-row :align="'middle'" class="mb-2 text-3xl font-medium">
      <h5>
        <MemberOfLink v-if="metadata['pcdm:memberOf']" :memberOf="metadata['pcdm:memberOf']" />
        {{ name }}
      </h5>
    </el-row>
    <hr class="divider divider-gray pt-2" />
  </div>

  <el-row :justify="'center'" v-if="metadata && entity" class="m-5 pt2 px-10 pb-7">
    <el-col :xs="24" :sm="24" :md="14" :lg="16" :xl="16">
      <el-row class="px-5">
        <el-col v-for="m of meta">
          <MetaField :meta="m" />
        </el-col>
      </el-row>

      <el-row>
        <el-col>
          <CollectionMembers :title="t('collection.subCollections')" :id="id" entityType="http://pcdm.org/models#Collection"
            routePath="collection" />
        </el-col>
      </el-row>

      <el-row>
        <el-col>
          <CollectionMembers :title="t('collection.objectsInCollection')" :id="id" entityType="http://pcdm.org/models#Object"
            routePath="object" />
        </el-col>
      </el-row>
    </el-col>

    <el-col :xs="24" :sm="24" :md="10" :lg="8" :xl="8">
      <el-row v-if="metadata.license" :gutter="20" class="pb-5">
        <el-col class="overflow-visible!">
          <el-card class="mx-10 !overflow-visible">
            <h5 class="text-2xl font-medium">{{ t('collection.access') }}
              <el-tooltip class="box-item" effect="light" trigger="hover"
                :content="t('collection.accessTooltip')" placement="top">
                <font-awesome-icon icon="fa-solid fa-circle-info" class="ml-2 cursor-pointer" size="xs" color="gray" />
              </el-tooltip>
            </h5>
            <hr class="divider divider-gray pt-2" />
            <AccessHelper :access="entity.access" :license="metadata.license" />
            <LicenseCard v-if="metadata.license" :license="metadata.license" />
          </el-card>
        </el-col>
      </el-row>

      <el-row :gutter="20" class="pb-5" v-if="metadata['pcdm:memberOf']">
        <el-col>
          <MemberOfCard v-if="metadata['pcdm:memberOf']" routePath="collection" :memberOf="metadata['pcdm:memberOf']" />
        </el-col>
      </el-row>

      <el-row :gutter="20" class="pb-5">
        <el-col>
          <el-card class="mx-10">
            <h5 class="text-2xl font-medium">{{ t('collection.content') }}
              <el-tooltip class="box-item" effect="light" trigger="hover"
                :content="t('collection.contentTooltip')" placement="top">
                <font-awesome-icon icon="fa-solid fa-circle-info" class="ml-2 cursor-pointer" size="xs" color="gray" />
              </el-tooltip>
            </h5>
            <hr class="divider divider-gray pt-2" />
            <SummariesCard :entity="entity" />
          </el-card>
        </el-col>
      </el-row>

      <el-row :gutter="20" class="pb-5" v-if="features?.hasZipDownload && name != undefined">
        <el-col>
          <el-card class="mx-10">
            <h5 class="text-2xl font-medium">{{ t('collection.downloads') }}
              <el-tooltip class="box-item" effect="light" trigger="hover"
                :content="t('collection.downloadsTooltip')"
                placement="top">
                <font-awesome-icon icon="fa-solid fa-circle-info" class="ml-2 cursor-pointer" size="xs" color="gray" />
              </el-tooltip>
            </h5>
            <hr class="divider divider-gray pt-2" />

            <DownloadsModal :simpleView="true" :id="id" idFieldName="@id" />

            <el-link @click="openDownloads = !openDownloads" type="primary">{{ t('collection.showAllDownloads') }}</el-link>

            <DownloadsModal :id="id" :idFieldName="'root'" v-model="openDownloads" />
          </el-card>
        </el-col>
      </el-row>

      <el-row :gutter="20" class="pb-5">
        <el-col>
          <el-card class="mx-10">
            <h5 class="text-2xl font-medium">{{ t('collection.retrieveMetadata') }}
              <el-tooltip class="box-item" effect="light" trigger="hover"
                :content="t('collection.retrieveMetadataTooltip')"
                placement="top">
                <font-awesome-icon icon="fa-solid fa-circle-info" class="ml-2 cursor-pointer" size="xs" color="gray" />
              </el-tooltip>
            </h5>
            <hr class="divider divider-gray pt-2" />
            <RetrieveDataMetadata :id="id" />
            <template v-if="metadata.metadataLicense?.id">
              <hr class="divider divider-gray mt-4 pb-2" />
              <h4 class="text-1xl font-medium">
                {{ t('collection.metadataLicensedAs') }}
                <el-link underline="always" type="primary" :href="metadata.metadataLicense.id" target="_blank"
                  class="mx-1">
                  {{ metadata.metadataLicense.name ||
                    metadata.metadataLicense.id }}
                </el-link>
              </h4>
            </template>
          </el-card>
        </el-col>
      </el-row>

      <el-row :gutter="20" class="pb-5" v-if="!metadata['creditText']">
        <el-col>
          <CitationCard :metadata="metadata" />
        </el-col>
      </el-row>

      <el-row :gutter="20" class="pb-5">
        <el-col>
          <TakedownCard />
        </el-col>
      </el-row>
    </el-col>
  </el-row>

  <el-dialog v-model="errorDialogVisible" width="40%" center>
    <el-alert :title="t('common.error')" type="warning" :closable="false">
      <p class="break-normal">{{ errorDialogText }}</p>
    </el-alert>
    <template #footer>
      <span class="dialog-footer">
        <el-button type="primary" @click="errorDialogVisible = false">{{ t('common.close') }}</el-button>
      </span>
    </template>
  </el-dialog>
</template>
