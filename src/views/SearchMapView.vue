<script setup lang="ts">
import { inject, onBeforeUnmount, onMounted, watch } from 'vue';

import 'leaflet/dist/leaflet.css';
import * as L from 'leaflet';
import 'leaflet.path.drag';
import 'leaflet-editable';

import { GestureHandling } from 'leaflet-gesture-handling';
import 'leaflet-gesture-handling/dist/leaflet-gesture-handling.css';

import Geohash from 'latlon-geohash';
import SearchLayout from '@/components/SearchLayout.vue';
import { LocationDivIcon, NumberedDivIcon } from '@/components/widgets/geo_types';
import { useSearch } from '@/composables/search';
import { ui } from '@/configuration';
import type { ApiService, EntityType, SearchParams } from '@/services/api';
import { getEntityUrl } from '@/tools';

const {
  advancedSearchEnabled,
  searchInput,
  advancedSearchLines,
  sorting,
  facets,
  geohashGrid,
  filters,
  entities,
  isLoading,
  totals,
  isMap,
  selectedSorting,
  selectedOrder,
  pageSize,
  currentPage,
  errorDialogText,

  onInputChange,
  updateRoutes,
  updateFilter,
  filtersChanged,
  clearFilters,
  clearFilter,
  resetSearch,
  sortResults,
  orderResults,
  updatePages,
  setSearchParams,
} = useSearch('map');

const api = inject<ApiService>('api');
if (!api) {
  throw new Error('API instance not provided');
}

L.Map.addInitHook('addHandler', 'gestureHandling', GestureHandling);

L.Icon.Default.mergeOptions({
  iconRetinaUrl: new URL('@/assets/marker-circle-icon-2x.png', import.meta.url).href,
  iconUrl: new URL('@/assets/marker-circle-icon.png', import.meta.url).href,
  shadowUrl: new URL('@/assets/marker-circle-icon.png', import.meta.url).href,
});

const SearchControl = L.Control.extend({
  options: {
    position: 'bottomright',
  },
  onAdd: () => {
    const container = L.DomUtil.create('div', 'leaflet-bar leaflet-control leaflet-control-bottomcenter');
    container.title = 'Reset Search';

    const button = L.DomUtil.create('a', '', container);
    button.innerHTML =
      '<div class="cursor-pointer">' +
      '<?xml version="1.0" encoding="utf-8"?>\n' +
      '\n' +
      '<!-- Uploaded to: SVG Repo, www.svgrepo.com, Generator: SVG Repo Mixer Tools -->\n' +
      '<svg width="30px" height="30px" viewBox="0 0 21 21" xmlns="http://www.w3.org/2000/svg">\n' +
      '\n' +
      '<g fill="none" fill-rule="evenodd" stroke="#000000" stroke-linecap="round" stroke-linejoin="round" transform="matrix(0 1 1 0 2.5 2.5)">\n' +
      '\n' +
      '<path d="m3.98652376 1.07807068c-2.38377179 1.38514556-3.98652376 3.96636605-3.98652376 6.92192932 0 4.418278 3.581722 8 8 8s8-3.581722 8-8-3.581722-8-8-8"/>\n' +
      '\n' +
      '<path d="m4 1v4h-4" transform="matrix(1 0 0 -1 0 6)"/>\n' +
      '\n' +
      '</g>\n' +
      '\n' +
      '</svg>' +
      '</div>';

    button.className = 'leaflet-control-button-search';

    L.DomEvent.disableClickPropagation(button);
    L.DomEvent.on(button, 'click', () => {
      resetSearch();

      const topRight = L.latLng(mapConfig.boundingBox.topRight);
      const bottomLeft = L.latLng(mapConfig.boundingBox.bottomLeft);
      const bounds = L.latLngBounds(bottomLeft, topRight);
      map.flyToBounds(bounds);
    });

    return container;
  },
});

const { mapConfig, urlPrefix } = ui;

const geoHashLayer = L.featureGroup();
const tooltipLayers = L.layerGroup();
let map: L.Map;

const initMap = () => {
  map = L.map('map', {
    // @ts-expect-error No types
    gestureHandling: true,
    minZoom: 3,
    maxZoom: 18,
  });

  // Starting point for zoom out
  map.setView(mapConfig.center, mapConfig.zoom);

  L.tileLayer('//{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors',
  }).addTo(map);

  L.control.scale().addTo(map);

  geoHashLayer.addTo(map);
  tooltipLayers.addTo(map);

  const control = new SearchControl();
  control.addTo(map);

  // Zoom to bounds
  const topRight = L.latLng(mapConfig.boundingBox.topRight);
  const bottomLeft = L.latLng(mapConfig.boundingBox.bottomLeft);
  const bounds = L.latLngBounds(bottomLeft, topRight);
  map.flyToBounds(bounds);
};

const clearLayers = () => {
  geoHashLayer.clearLayers();
};

const fitBounds = (position: L.LatLng) => {
  //From: https://stackoverflow.com/a/78175342/1470833
  //If the point does not fit the bounds try to flip the degrees
  const visibleBounds = map.getBounds();
  const west = visibleBounds.getWest();
  const east = visibleBounds.getEast();

  let isVisible = visibleBounds.contains(position);
  if (isVisible) {
    return undefined;
  }

  const initialPos = L.latLng({ lat: position.lat, lng: position.lng });

  if (west < -180) {
    const d = (west - 180) / 360;
    position.lng += 360 * d;
    isVisible = visibleBounds.contains(position);

    if (d < -1 && !isVisible) {
      // this part it hard to explain for me so easiest thing to do to understand how it work is to remove it and go far past 180
      position = initialPos;
      position.lng += 360 * (d + 1);
      isVisible = visibleBounds.contains(position);
    }
  } else if (east > 180) {
    const d = (east + 180) / 360;
    position.lng += 360 * d;
    isVisible = visibleBounds.contains(position);

    if (d > 1 && !isVisible) {
      position = initialPos;
      position.lng += 360 * (d - 1);
      isVisible = visibleBounds.contains(position);
    }
  }

  return position;
};

const updateLayers = () => {
  clearLayers();

  if (!geohashGrid.value) {
    return;
  }

  for (const [geohash, count] of Object.entries(geohashGrid.value)) {
    try {
      const decoded = Geohash.decode(geohash);
      const latlon = L.latLng(decoded.lat, decoded.lon);

      const newPosition = fitBounds(latlon);
      if (newPosition) {
        latlon.lat = newPosition.lat;
        latlon.lng = newPosition.lng;
      }

      const bounds = Geohash.bounds(geohash);
      const newNEBounds = fitBounds(L.latLng(bounds.ne.lat, bounds.ne.lon));
      const newSWBounds = fitBounds(L.latLng(bounds.sw.lat, bounds.sw.lon));
      if (newNEBounds && newSWBounds) {
        bounds.ne.lat = newNEBounds.lat;
        bounds.ne.lon = newNEBounds.lng;
        bounds.sw.lat = newSWBounds.lat;
        bounds.sw.lon = newSWBounds.lng;
      }

      let shape: L.Rectangle | L.Marker;
      if (count > 0) {
        const countMarker = L.marker(latlon, {
          icon: new NumberedDivIcon({ number: count }),
        });
        L.setOptions(countMarker, { customData: { count, key: geohash, latlng: latlon } });
        countMarker.addTo(geoHashLayer);

        let color = '#ffffff';
        if (count <= 1) color = '#ffea1f';
        if (count > 1 && count <= 10) color = '#4470a2';
        if (count > 10 && count <= 30) color = '#14a848';
        if (count > 30) color = '#ff0000';

        shape = L.rectangle(
          [
            [bounds.sw.lat, bounds.sw.lon],
            [bounds.ne.lat, bounds.ne.lon],
          ],
          { color, weight: 1, opacity: 0.7 },
        );
      } else {
        //TODO decide whether to use single marker or no
        shape = L.marker(latlon, {
          icon: new LocationDivIcon(),
        });
      }

      L.setOptions(shape, { customData: { count, key: geohash, latlng: latlon } });
      shape.addTo(geoHashLayer);

      if (!map.getBounds().contains(latlon)) {
        console.log('shape is out of bounds', shape);
      }
    } catch (error) {
      console.log('ERROR GEOHASH BUCKET', error);
    }
  }
};

const searchGeoHash = async ({ geohash, pageSize }: { geohash: string; pageSize: number; currentPage: number }) => {
  const bounds = Geohash.bounds(geohash);
  const boundingBox = {
    topRight: { lat: bounds.ne.lat, lng: bounds.ne.lon },
    bottomLeft: { lat: bounds.sw.lat, lng: bounds.sw.lon },
  };

  setSearchParams({ boundingBox });

  const params: SearchParams = {
    // FIXME: advanced search
    query: advancedSearchEnabled.value ? '' : searchInput.value.toString(),
    searchType: advancedSearchEnabled.value ? 'advanced' : 'basic',
    filters: filters.value,
    limit: pageSize,
    offset: (currentPage.value - 1) * pageSize,
    sort: selectedSorting.value?.value,
    order: selectedOrder.value?.value,
    boundingBox,
  };

  const results = await api.search(params);

  return results;
};

const getInnerHTMLTooltip = (entity: EntityType) => {
  const title = entity.name;
  const type = entity.entityType;
  const href = `${urlPrefix}/${getEntityUrl(entity)}`;

  let innerHTML = `
    <div>
      <h3 class="mb-2 mt-1 text-2xl">
        <a href="${href}">${title}</a>
      </h3>
      <h4>Type: ${type}</h4>
  `;

  if (entity.memberOf) {
    const innerHTMLMemberOf = `
        <a
           class="text-sm m-1 text-gray-700 underline"
           href="${urlPrefix}/collection?id=${encodeURIComponent(entity.memberOf.id)}"
        >
          ${entity.memberOf.name || entity.memberOf.id}
        </a>
      `;

    innerHTML += `
      <div :align="'middle'" v-if="" class="">
        <span class="font-normal text-gray-700">
           Member of:&nbsp;
           <span class="inline-flex flex-wrap">
             ${innerHTMLMemberOf}
           </span>
        </span>
    `;
  }

  innerHTML += `
        <p class="justify-self-end">
          <a href="${href}">See more</a>
        </p>
      </div>
    </div>

    <hr class="divide-y divide-gray-500"/>
  `;

  return innerHTML;
};

const searchEvent = () => {
  const zoomLevel = map.getZoom();

  const bounds = map.getBounds();
  const ne = bounds.getNorthEast().wrap();
  const sw = bounds.getSouthWest().wrap();
  const boundingBox = {
    topRight: { lat: ne.lat, lng: ne.lng },
    bottomLeft: { lat: sw.lat, lng: sw.lng },
  };

  setSearchParams({ zoomLevel, boundingBox });

  updateRoutes();
};

const initControls = () => {
  map.on('zoomend', () => {
    tooltipLayers.clearLayers();
    searchEvent();
  });

  map.on('dragend', () => {
    tooltipLayers.clearLayers();
    searchEvent();
  });

  geoHashLayer.on('click', async (e) => {
    L.DomEvent.stopPropagation(e);
    L.DomEvent.preventDefault(e as unknown as Event);

    const data = e.propagatedFrom?.options.customData;
    if (!data) {
      return;
    }

    const zoom = map.getZoom();

    if (data.count > 10 && zoom <= 10) {
      //if there are more than X zoom in
      let nextZoom = 1;
      if (data.count >= 30) {
        nextZoom = 4;
      }
      if (data.count >= 10) {
        nextZoom = 2;
      }
      map.setView(e.latlng, zoom + nextZoom);

      return;
    }

    const results = await searchGeoHash({
      geohash: data.key,
      pageSize: data.count,
      currentPage: 1,
    });
    if ('error' in results) {
      console.error('Error searching geohash:', results.error);

      return;
    }

    const total = results.total;
    const tooltipView = document.createElement('div');
    const totalDiv = document.createElement('div');
    totalDiv.innerHTML = `<div class="m-2"><p>Total: ${total}</p></div>`;
    tooltipView.appendChild(totalDiv);

    const divider = document.createElement('div');
    divider.className = 'my-2';
    divider.innerHTML = '<hr class="divide-y divide-gray-500"/>';
    tooltipView.appendChild(divider);
    const hits = document.createElement('div');
    hits.id = 'tooltip_open';

    for (const entity of results.entities) {
      const newDiv = document.createElement('div');
      newDiv.innerHTML = getInnerHTMLTooltip(entity);
      hits.appendChild(newDiv);
    }
    tooltipView.appendChild(hits);

    const tooltip = new L.Popup({
      maxWidth: 400,
      maxHeight: 400,
    });

    tooltip.setContent(tooltipView.outerHTML);
    tooltip.setLatLng(e.latlng);
    tooltip.addTo(tooltipLayers);
  });
};

onMounted(() => {
  initMap();
  initControls();
});

onBeforeUnmount(() => map?.remove());

watch(geohashGrid, updateLayers);
</script>

<template>
  <SearchLayout :searchInput="searchInput" :filters="filters" :facets="facets" :entities="entities" :sorting="sorting"
    :clearFilter="clearFilter" :onInputChange="onInputChange" :filtersChanged="filtersChanged"
    :updateRoutes="updateRoutes" :clearFilters=clearFilters :updateFilter="updateFilter" :totals="totals"
    :resetSearch="resetSearch" :isMap="isMap" :isLoading="isLoading" :sortResults="sortResults"
    :selectedOrder="selectedOrder" :selectedSorting="selectedSorting" :orderResults="orderResults" :pageSize="pageSize"
    :errorDialogText="errorDialogText" :currentPage="currentPage" :updatePages="updatePages"
    :setSearchParams="setSearchParams" :advancedSearchEnabled="advancedSearchEnabled"
    :advancedSearchLines="advancedSearchLines">
    <div id="map" class="flex-1 h-[calc(100vh-200px)]" v-once></div>
    <p class="text-sm">This map is not designed or suitable for Native Title research.</p>
  </SearchLayout>
</template>

<style>
.oni-tooltip-marker {
  width: 200px;
  white-space: normal;
}

.leaflet-div-icon {
  background: transparent;
  border: none;
}

.leaflet-marker-icon .number {
  position: relative;
  top: 0;
  font-size: 20px;
  width: 25px;
  text-align: center;
  font-weight: bold;
  color: brown;
  background-color: transparent;
  border: none;
  border-radius: 50%;
  padding: 1px;
}

.leaflet-tooltip .leaflet-zoom-animated .leaflet-tooltip-center {
  overflow: scroll;
}

.leaflet-tooltip .leaflet-zoom-animated .leaflet-tooltip-right {
  overflow: scroll;
}
</style>
