<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue';
import type { EafTier } from '@/composables/useEafParser';

const props = defineProps<{
  tiers: EafTier[];
  currentTimeMs: number;
  duration: number;
}>();

const emit = defineEmits<{
  seek: [seconds: number];
}>();

const containerRef = ref<HTMLElement>();
const containerWidth = ref(800);

const TIER_LABEL_WIDTH = 140;
const VISIBLE_WINDOW_MS = 30_000;
const TIER_ROW_HEIGHT = 40;
const RULER_HEIGHT = 32;

const TIER_COLOURS = [
  { bg: '#dbeafe', border: '#93c5fd', hover: '#bfdbfe', text: '#1e40af' },
  { bg: '#fef3c7', border: '#fcd34d', hover: '#fde68a', text: '#92400e' },
  { bg: '#d1fae5', border: '#6ee7b7', hover: '#a7f3d0', text: '#065f46' },
  { bg: '#fee2e2', border: '#fca5a5', hover: '#fecaca', text: '#991b1b' },
  { bg: '#e9d5ff', border: '#c4b5fd', hover: '#ddd6fe', text: '#5b21b6' },
  { bg: '#ffedd5', border: '#fdba74', hover: '#fed7aa', text: '#9a3412' },
  { bg: '#ccfbf1', border: '#5eead4', hover: '#99f6e4', text: '#115e59' },
  { bg: '#fce7f3', border: '#f9a8d4', hover: '#fbcfe8', text: '#9d174d' },
];

const tiersWithColours = computed(() =>
  props.tiers.map((tier, i) => ({
    ...tier,
    colour: TIER_COLOURS[i % TIER_COLOURS.length],
  })),
);

const visibleWindowMs = computed(() => Math.min(VISIBLE_WINDOW_MS, props.duration || VISIBLE_WINDOW_MS));

const timelineWidth = computed(() => {
  const availableWidth = containerWidth.value - TIER_LABEL_WIDTH;
  if (props.duration <= 0) {
    return availableWidth;
  }
  return (props.duration / visibleWindowMs.value) * availableWidth;
});

const pxPerMs = computed(() => {
  if (props.duration <= 0) {
    return 0;
  }
  return timelineWidth.value / props.duration;
});

const rulerTicks = computed(() => {
  if (props.duration <= 0) {
    return [];
  }

  const intervals = [500, 1000, 2000, 5000, 10_000, 30_000, 60_000, 120_000, 300_000];
  const maxTicks = 500;
  const targetTickCount = 20;
  const minInterval = props.duration / maxTicks;
  const idealInterval = Math.max(visibleWindowMs.value / targetTickCount, minInterval);
  const interval = intervals.find((i) => i >= idealInterval) ?? intervals[intervals.length - 1];
  const majorEvery = interval < 5000 ? 5 : 2;

  const ticks: { ms: number; px: number; label: string; major: boolean }[] = [];
  let tickIndex = 0;
  for (let ms = 0; ms <= props.duration; ms += interval) {
    ticks.push({
      ms,
      px: ms * pxPerMs.value,
      label: formatTime(ms),
      major: tickIndex % majorEvery === 0,
    });
    tickIndex++;
  }
  return ticks;
});

const playheadPx = computed(() => props.currentTimeMs * pxPerMs.value);

const formatTime = (ms: number): string => {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  if (ms < 60_000) {
    const tenths = Math.floor((ms % 1000) / 100);
    return `${seconds}.${tenths}s`;
  }
  return `${minutes}:${String(seconds).padStart(2, '0')}`;
};

const handleAnnotationClick = (startMs: number) => {
  emit('seek', startMs / 1000);
};

const handleRulerClick = (event: MouseEvent) => {
  const target = event.currentTarget as HTMLElement;
  const rect = target.getBoundingClientRect();
  const clickX = event.clientX - rect.left;
  const ms = clickX / pxPerMs.value;
  if (ms >= 0 && ms <= props.duration) {
    emit('seek', ms / 1000);
  }
};

watch(
  () => props.currentTimeMs,
  () => {
    const scrollEl = containerRef.value;
    if (!scrollEl) {
      return;
    }

    const scrollableWidth = containerWidth.value - TIER_LABEL_WIDTH;
    const targetScroll = playheadPx.value - scrollableWidth / 3;
    const currentScroll = scrollEl.scrollLeft;

    if (playheadPx.value < currentScroll || playheadPx.value > currentScroll + scrollableWidth) {
      scrollEl.scrollTo({ left: Math.max(0, targetScroll), behavior: 'smooth' });
    }
  },
);

let resizeObserver: ResizeObserver | undefined;

onMounted(() => {
  if (containerRef.value) {
    containerWidth.value = containerRef.value.clientWidth;
    resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        containerWidth.value = entry.contentRect.width;
      }
    });
    resizeObserver.observe(containerRef.value);
  }
});

onUnmounted(() => {
  resizeObserver?.disconnect();
});
</script>

<template>
  <div ref="containerRef" class="eaf-timeline">
    <div class="eaf-timeline__inner" :style="{ width: `${timelineWidth + TIER_LABEL_WIDTH}px`, minWidth: '100%' }">
      <!-- Time ruler -->
      <div class="eaf-ruler" :style="{ height: `${RULER_HEIGHT}px` }">
        <div class="eaf-ruler__label" :style="{ width: `${TIER_LABEL_WIDTH}px` }" />
        <div class="eaf-ruler__track" @click="handleRulerClick">
          <template v-for="tick in rulerTicks" :key="tick.ms">
            <div class="eaf-ruler__tick" :class="{ 'eaf-ruler__tick--major': tick.major }"
              :style="{ left: `${tick.px}px` }">
              <div class="eaf-ruler__tick-line" />
              <span v-if="tick.major" class="eaf-ruler__tick-label">{{ tick.label }}</span>
            </div>
          </template>
        </div>
      </div>

      <!-- Tier rows -->
      <div v-for="(tier, tierIndex) in tiersWithColours" :key="tier.tierId" class="eaf-tier"
        :class="{ 'eaf-tier--alt': tierIndex % 2 === 1 }">
        <div class="eaf-tier__label" :style="{ width: `${TIER_LABEL_WIDTH}px`, height: `${TIER_ROW_HEIGHT}px` }">
          <span class="eaf-tier__label-dot" :style="{ background: tier.colour.border }" />
          <span class="eaf-tier__label-text" :title="tier.tierId">{{ tier.tierId }}</span>
        </div>

        <div class="eaf-tier__track" :style="{ height: `${TIER_ROW_HEIGHT}px` }">
          <div v-for="ann in tier.annotations" :key="ann.id" class="eaf-annotation" :style="{
            left: `${ann.startMs * pxPerMs}px`,
            width: `${Math.max((ann.endMs - ann.startMs) * pxPerMs, 3)}px`,
            '--ann-bg': tier.colour.bg,
            '--ann-border': tier.colour.border,
            '--ann-hover': tier.colour.hover,
            '--ann-text': tier.colour.text,
          }" :title="`${formatTime(ann.startMs)} – ${formatTime(ann.endMs)}\n${ann.value}`"
            @click="handleAnnotationClick(ann.startMs)">
            <span class="eaf-annotation__text">{{ ann.value }}</span>
          </div>
        </div>
      </div>

      <!-- Playhead -->
      <div v-if="currentTimeMs >= 0" class="eaf-playhead" :style="{ left: `${playheadPx + TIER_LABEL_WIDTH}px` }">
        <div class="eaf-playhead__head" />
        <div class="eaf-playhead__line" />
      </div>
    </div>
  </div>
</template>

<style scoped>
.eaf-timeline {
  overflow-x: auto;
  overflow-y: auto;
  position: relative;
  border-radius: 6px;
  background: #ffffff;
  border: 1px solid #e2e8f0;
  max-height: 500px;
}

.eaf-timeline__inner {
  position: relative;
}

.eaf-ruler {
  display: flex;
  position: sticky;
  top: 0;
  z-index: 25;
  background: #f8fafc;
  border-bottom: 1px solid #e2e8f0;
}

.eaf-ruler__label {
  flex-shrink: 0;
  position: sticky;
  left: 0;
  z-index: 26;
  background: #f8fafc;
  border-right: 1px solid #e2e8f0;
}

.eaf-ruler__track {
  position: relative;
  flex: 1;
  cursor: crosshair;
}

.eaf-ruler__tick {
  position: absolute;
  top: 0;
  bottom: 0;
}

.eaf-ruler__tick-line {
  width: 1px;
  background: #cbd5e1;
  height: 10px;
}

.eaf-ruler__tick--major .eaf-ruler__tick-line {
  height: 18px;
  background: #94a3b8;
}

.eaf-ruler__tick-label {
  position: absolute;
  top: 16px;
  left: 0;
  transform: translateX(-50%);
  white-space: nowrap;
  user-select: none;
  font-size: 10px;
  font-family: ui-monospace, 'SF Mono', monospace;
  color: #64748b;
  letter-spacing: 0.02em;
}

.eaf-tier {
  display: flex;
  border-bottom: 1px solid #f1f5f9;
}

.eaf-tier--alt {
  background: #fafbfc;
}

.eaf-tier__label {
  flex-shrink: 0;
  position: sticky;
  left: 0;
  z-index: 20;
  background: #ffffff;
  border-right: 1px solid #e2e8f0;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 0 10px;
}

.eaf-tier--alt .eaf-tier__label {
  background: #fafbfc;
}

.eaf-tier__label-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
}

.eaf-tier__label-text {
  font-size: 11px;
  font-weight: 500;
  color: #475569;
  font-family: ui-monospace, 'SF Mono', monospace;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.eaf-tier__track {
  position: relative;
  flex: 1;
}

.eaf-annotation {
  position: absolute;
  top: 5px;
  bottom: 5px;
  border-radius: 4px;
  padding: 0 5px;
  cursor: pointer;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  display: flex;
  align-items: center;
  background: var(--ann-bg);
  border: 1px solid var(--ann-border);
  transition: background 0.15s ease, box-shadow 0.15s ease;
}

.eaf-annotation:hover {
  background: var(--ann-hover);
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.12);
  min-width: fit-content;
  z-index: 30;
}

.eaf-annotation__text {
  font-size: 11px;
  color: var(--ann-text);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  line-height: 1;
}

.eaf-annotation:hover .eaf-annotation__text {
  overflow: visible;
}

.eaf-playhead {
  position: absolute;
  top: 0;
  bottom: 0;
  width: 0;
  pointer-events: none;
  z-index: 15;
}

.eaf-playhead__head {
  width: 0;
  height: 0;
  border-left: 5px solid transparent;
  border-right: 5px solid transparent;
  border-top: 7px solid #dc2626;
  position: absolute;
  top: 0;
  left: -5px;
  filter: drop-shadow(0 0 2px rgba(220, 38, 38, 0.3));
}

.eaf-playhead__line {
  position: absolute;
  top: 7px;
  bottom: 0;
  left: 0;
  width: 1.5px;
  background: #dc2626;
  box-shadow: 0 0 4px rgba(220, 38, 38, 0.25);
  transform: translateX(-0.75px);
}
</style>
