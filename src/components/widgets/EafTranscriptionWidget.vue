<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue';
import EafTimelineView from '@/components/widgets/EafTimelineView.vue';
import { type EafDocument, parseEaf } from '@/composables/useEafParser';

const props = defineProps<{
  src: string;
  currentTime?: number;
  showHeader?: boolean;
  duration?: number;
}>();

const viewMode = ref<'table' | 'timeline'>('timeline');
const canShowTimeline = computed(() => props.currentTime !== undefined && props.duration);

const emit = defineEmits<{
  seek: [seconds: number];
}>();

const eafDoc = ref<EafDocument>();
const selectedTierIds = ref<string[]>([]);
const loading = ref(true);

const tiers = computed(() => eafDoc.value?.tiers.filter((t) => t.annotations.length > 0) ?? []);

type MergedRow = {
  startMs: number;
  endMs: number;
  texts: { tierId: string; value: string }[];
};

const selectedTiers = computed(() => tiers.value.filter((t) => selectedTierIds.value.includes(t.tierId)));

const mergedRows = computed<MergedRow[]>(() => {
  const groups = new Map<string, MergedRow>();

  for (const tier of selectedTiers.value) {
    for (const ann of tier.annotations) {
      const key = `${ann.startMs}-${ann.endMs}`;

      let group = groups.get(key);
      if (!group) {
        group = { startMs: ann.startMs, endMs: ann.endMs, texts: [] };
        groups.set(key, group);
      }

      group.texts.push({ tierId: tier.tierId, value: ann.value });
    }
  }

  return Array.from(groups.values()).sort((a, b) => a.startMs - b.startMs || a.endMs - b.endMs);
});

const showTierLabels = computed(() => selectedTierIds.value.length > 1);

const fetchAndParse = async (url: string) => {
  loading.value = true;

  try {
    const response = await fetch(url);
    if (!response.ok) {
      return;
    }

    const xml = await response.text();
    eafDoc.value = parseEaf(xml);
    const nonEmpty = tiers.value;
    if (nonEmpty.length > 0) {
      selectedTierIds.value = [nonEmpty[0].tierId];
    }
  } finally {
    loading.value = false;
  }
};

watch(
  () => props.src,
  (url) => {
    if (url) {
      fetchAndParse(url);
    }
  },
  { immediate: true },
);

const currentTimeMs = computed(() => (props.currentTime ?? -1) * 1000);

const formatTime = (ms: number): string => {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  const millis = Math.floor((ms % 1000) / 10);
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}.${String(millis).padStart(2, '0')}`;
};

const isActive = (startMs: number, endMs: number): boolean => {
  if (props.currentTime === undefined) {
    return false;
  }

  return currentTimeMs.value >= startMs && currentTimeMs.value < endMs;
};

const tableRef = ref<InstanceType<typeof import('element-plus')['ElTable']>>();

const activeRowIndex = computed(() => {
  if (props.currentTime === undefined) {
    return -1;
  }

  return mergedRows.value.findIndex((r) => isActive(r.startMs, r.endMs));
});

watch(activeRowIndex, (index) => {
  if (index < 0) {
    return;
  }

  nextTick(() => {
    const tableEl = tableRef.value?.$el as HTMLElement | undefined;
    if (!tableEl) {
      return;
    }

    // Element Plus uses el-scrollbar inside the body wrapper
    const scrollViewport = tableEl.querySelector('.el-table__body-wrapper .el-scrollbar__wrap') as HTMLElement | null;
    const rows = tableEl.querySelectorAll('.el-table__body tbody tr');
    if (!scrollViewport || !rows?.[index]) {
      return;
    }

    const row = rows[index] as HTMLElement;
    const viewportHeight = scrollViewport.clientHeight;
    const rowTop = row.offsetTop;
    const rowBottom = rowTop + row.offsetHeight;
    const scrollTop = scrollViewport.scrollTop;
    const scrollBottom = scrollTop + viewportHeight;

    // If row is outside visible area, scroll to centre it
    if (rowBottom > scrollBottom || rowTop < scrollTop) {
      scrollViewport.scrollTo({
        top: rowTop - viewportHeight / 2,
        behavior: 'smooth',
      });
    }
  });
});

const handleRowClick = (row: MergedRow) => {
  emit('seek', row.startMs / 1000);
};

const tableRowClassName = ({ rowIndex }: { row: MergedRow; rowIndex: number }) => {
  return rowIndex === activeRowIndex.value ? 'eaf-active-row' : '';
};
</script>

<template>
  <div v-if="loading" class="p-4 text-center">
    <el-skeleton :rows="5" animated />
  </div>
  <div v-else-if="tiers.length > 0" class="w-full">
    <div v-if="props.showHeader && eafDoc" class="mb-3 flex flex-wrap gap-x-6 gap-y-1 text-sm text-gray-600">
      <div v-if="eafDoc.author"><span class="font-semibold">Author:</span> {{ eafDoc.author }}</div>
      <div v-if="eafDoc.date"><span class="font-semibold">Date:</span> {{ new
        Date(eafDoc.date).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' }) }}</div>
      <div v-if="eafDoc.version"><span class="font-semibold">Version:</span> {{ eafDoc.version }}</div>
      <div v-if="eafDoc.format"><span class="font-semibold">Format:</span> {{ eafDoc.format }}</div>
      <div v-if="eafDoc.languages.length">
        <span class="font-semibold">Languages:</span>
        {{eafDoc.languages.map((l) => l.langLabel || l.langId).join(', ')}}
      </div>
    </div>

    <!-- Tier selector (independent height, not constrained by viewer) -->
    <div v-if="tiers.length > 1" class="mb-3">
      <div class="flex items-center gap-3 flex-wrap">
        <span class="text-sm font-semibold text-gray-600">Tiers ({{ tiers.length }}):</span>
        <el-checkbox :model-value="selectedTierIds.length === tiers.length"
          :indeterminate="selectedTierIds.length > 0 && selectedTierIds.length < tiers.length" size="small"
          @change="(val: boolean) => selectedTierIds = val ? tiers.map((t) => t.tierId) : []">
          All
        </el-checkbox>
        <el-checkbox-group v-model="selectedTierIds" class="flex flex-wrap gap-x-4 gap-y-1">
          <el-checkbox v-for="tier in tiers" :key="tier.tierId" :label="tier.tierId" :value="tier.tierId"
            size="small" />
        </el-checkbox-group>
      </div>
    </div>

    <div v-if="canShowTimeline" class="flex justify-end mb-2">
      <el-button-group size="small">
        <el-button :type="viewMode === 'table' ? 'primary' : 'default'" @click="viewMode = 'table'">
          <font-awesome-icon icon="fa fa-list" />
        </el-button>
        <el-button :type="viewMode === 'timeline' ? 'primary' : 'default'" @click="viewMode = 'timeline'">
          <font-awesome-icon icon="fa fa-bars-staggered" />
        </el-button>
      </el-button-group>
    </div>

    <div v-if="canShowTimeline && viewMode === 'timeline'">
      <EafTimelineView :tiers="selectedTiers" :current-time-ms="currentTimeMs" :duration="props.duration! * 1000"
        @seek="(s) => emit('seek', s)" />
    </div>

    <div v-else style="height: 400px;">
      <el-table ref="tableRef" :data="mergedRows" :row-class-name="tableRowClassName" @row-click="handleRowClick"
        class="cursor-pointer" height="100%">
        <el-table-column label="Start" width="120">
          <template #default="{ row }">{{ formatTime(row.startMs) }}</template>
        </el-table-column>
        <el-table-column label="End" width="120">
          <template #default="{ row }">{{ formatTime(row.endMs) }}</template>
        </el-table-column>
        <el-table-column label="Text">
          <template #default="{ row }">
            <div v-for="(text, i) in row.texts" :key="i">
              <span v-if="showTierLabels" class="text-xs text-gray-400 mr-1">{{ text.tierId }}:</span>
              <span>{{ text.value }}</span>
            </div>
          </template>
        </el-table-column>
      </el-table>
    </div>
  </div>
</template>

<style>
.eaf-active-row {
  --el-table-tr-bg-color: var(--el-color-primary-light-8);
  font-weight: bold;
}
</style>
