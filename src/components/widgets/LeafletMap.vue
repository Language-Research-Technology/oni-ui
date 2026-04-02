<script setup lang="ts">
import * as L from 'leaflet';
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import 'leaflet-gesture-handling/dist/leaflet-gesture-handling.css';
import 'leaflet.path.drag';
import 'leaflet/dist/leaflet.css';

import iconUrl from 'leaflet/dist/images/marker-icon.png';

import iconRetinaUrl from 'leaflet/dist/images/marker-icon-2x.png';
import shadowUrl from 'leaflet/dist/images/marker-shadow.png';
import transformer from '@/components/widgets/geo';
import type { GeoEntity } from './geo_types';

// @ts-expect-error Upstream issue
L.Icon.Default.prototype._getIconUrl = undefined;

L.Icon.Default.mergeOptions({
  iconRetinaUrl,
  iconUrl,
  shadowUrl,
});

const mapRef = ref();

const props = defineProps<{
  modelValue: GeoEntity;
}>();

const transform = computed(() => transformer(L, props.modelValue));

let map: L.Map;

onBeforeUnmount(() => map?.remove());

const initMap = async () => {
  // leaflet-gesture-handling is UMD-only and accesses the global `L` directly.
  // We must set window.L before dynamically importing it so production builds work.
  window.L = L;
  const { GestureHandling } = await import('leaflet-gesture-handling');
  L.Map.addInitHook('addHandler', 'gestureHandling', GestureHandling);

  map = L.map(mapRef.value, {
    // @ts-expect-error Upstream issue
    gestureHandling: true,
  });

  map.setView([-27, 140], 3);

  L.tileLayer('//{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors',
  }).addTo(map);

  L.control.scale().addTo(map);

  const featuresLayer = L.featureGroup();
  featuresLayer.addTo(map);

  watch(
    () => props.modelValue,
    (val) => {
      featuresLayer.clearLayers();

      if (!val) {
        return;
      }

      const shape = transform.value.fromEntity();
      if (shape) {
        try {
          shape.addTo(featuresLayer);
        } catch (error) {
          console.log(error);
          console.log(shape);
        }
      }
      const bounds = featuresLayer.getBounds();
      if (bounds.isValid()) {
        map.flyToBounds(bounds, { maxZoom: 7 });
      }
    },
    { immediate: true },
  );
};

onMounted(() => initMap());
</script>

<template>
  <div ref="mapRef" class="flex-1" v-once></div>
</template>
