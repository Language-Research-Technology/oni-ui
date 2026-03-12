<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue';
import { type EafDocument, parseEaf } from '@/composables/useEafParser';

const props = defineProps<{
  src: string;
  currentTime?: number;
  showHeader?: boolean;
}>();

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

const languageLabelMap = computed(() => {
  const map = new Map<string, string>();
  if (!eafDoc.value) {
    return map;
  }
  for (const lang of eafDoc.value.languages) {
    map.set(lang.langId, lang.langLabel || lang.langId);
  }
  return map;
});

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

    <div class="flex" style="height: 400px;">
      <div v-if="tiers.length > 1" class="pr-4 shrink-0 overflow-y-auto">
        <h4 class="text-lg font-semibold mb-2">Tiers ({{ tiers.length }})</h4>
        <el-checkbox :model-value="selectedTierIds.length === tiers.length"
          :indeterminate="selectedTierIds.length > 0 && selectedTierIds.length < tiers.length" class="mb-2"
          @change="(val: boolean) => selectedTierIds = val ? tiers.map((t) => t.tierId) : []">
          Select all
        </el-checkbox>
        <el-checkbox-group v-model="selectedTierIds" class="flex flex-col gap-2">
          <div v-for="tier in tiers" :key="tier.tierId">
            <el-checkbox :label="tier.tierId" :value="tier.tierId" />
            <div class="ml-6 text-xs text-gray-500">
              <div v-if="tier.annotations.length">Start: {{ formatTime(tier.annotations[0].startMs) }}</div>
              <div v-if="tier.participant">{{ tier.participant }}</div>
              <div v-if="tier.annotator">Annotator: {{ tier.annotator }}</div>
              <div v-if="tier.langRef && languageLabelMap.get(tier.langRef)">{{ languageLabelMap.get(tier.langRef) }}
              </div>
            </div>
          </div>
        </el-checkbox-group>
      </div>

      <div class="flex-1 min-w-0">
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
  </div>
</template>

<style>
.eaf-active-row {
  --el-table-tr-bg-color: var(--el-color-primary-light-8);
  font-weight: bold;
}
</style>
