<script setup lang="ts">
import { computed } from 'vue';

import { useConfigurationStore } from '@/stores/configuration';

import AccessControlIcon from '@/components/widgets/AccessControlIcon.vue';
import CommunicationModeIcon from '@/components/widgets/CommunicationModeIcon.vue';
import MediaTypeIcon from '@/components/widgets/MediaTypeIcon.vue';

const { aggregations, field, asIcons } = defineProps<{
  aggregations: Record<string, { buckets: { key: string } }>;
  asIcons: boolean;
  field: { name: string; display: string };
}>();

const { ui } = useConfigurationStore();
const licenses = ui?.licenses || [];

const findLicense = (key: string) => {
  const license = licenses.find((l) => l.license === key);
  if (license) {
    if (!license.access) {
      return 'login';
    }

    return license.access;
  }

  return 'public';
};

const buckets = computed(() => {
  const localBuckets = [];
  const bucketAggs = aggregations?.[field.name]?.buckets;

  if (!(Array.isArray(bucketAggs) && bucketAggs.length > 0)) {
    return [];
  }

  for (const bucket of bucketAggs) {
    let key = '';
    if (field.name === 'license.@id') {
      key = findLicense(bucket.key);
    } else {
      key = bucket.key;
    }
    localBuckets.push({
      key,
      name: field.name,
      display: field.display,
    });
  }
  // const uniqueBuckets = uniqBy(localBuckets, 'key');
  const orderedBuckets = localBuckets.sort((a, b) => a.key.localeCompare(b.key));

  return orderedBuckets;
});
</script>

<template>
  <template v-if="buckets.length > 0" class="w-full" v-for="(b, index) of buckets" :key="b.key+'_'+index">
    <span v-if="asIcons">
      <CommunicationModeIcon v-if="field.name.startsWith('communicationMode')" :communicationMode="b.key" />
      <MediaTypeIcon v-else-if="field.name.startsWith('encodingFormat')" :mediaType="b.key" />
      <AccessControlIcon v-else-if="field.name.startsWith('license')" :accessControl="b.key" />
    </span>

    <span v-else>{{ b.key }}<span v-if="index + 1 < buckets.length">,&nbsp;</span></span>
  </template>
</template>
