<script setup lang="ts">
import { onBeforeUnmount, onMounted, onUpdated, ref, watch } from 'vue';

import 'leaflet/dist/leaflet.css';
import * as L from 'leaflet';
import 'leaflet.path.drag';
import 'leaflet-editable';

// import { GestureHandling } from 'leaflet-gesture-handling';
// import 'leaflet-gesture-handling/dist/leaflet-gesture-handling.css';

import Geohash from 'latlon-geohash';

import { useSearch } from '@/composables/search';

import SearchLayout from '@/components/SearchLayout.vue';
import { configuration } from '@/configuration';

const {
  advancedSearchEnabled,
  searchInput,
  facets,
  filters,
  entities,
  isLoading,
  totals,
  searchTime,
  isMap,
  selectedSorting,
  selectedOrder,
  pageSize,
  currentPage,
  errorDialogText,

  onInputChange,
  updateRoutes,
  enableAdvancedSearch,
  updateFilter,
  basicSearch,
  resetAdvancedSearch,
  filtersChanged,
  clearFilters,
  clearFilter,
  resetSearch,
  sortResults,
  orderResults,
  updatePages,
  clearError,
  setMapParams,
} = useSearch('map');

// L.Map.addInitHook('addHandler', 'gestureHandling', GestureHandling);

// //This is to fix a leaflet bug
// //https://salesforce.stackexchange.com/questions/180977/leaflet-error-when-zoom-after-close-popup-in-lightning-component
// // L.Popup.prototype._animateZoom = function (e) {
// //   if (!this._map) {
// //     return;
// //   }
// //   const pos = this._map._latLngToNewLayerPoint(this._latlng, e.zoom, e.center);
// //   const anchor = this._getAnchor();
// //   L.DomUtil.setPosition(this._container, pos.add(anchor));
// // };
//
// // L.Icon.Default.prototype._getIconUrl = undefined;
//
// L.Icon.Default.mergeOptions({
//   iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
//   iconUrl: require('leaflet/dist/images/marker-icon.png'),
//   shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
// });
//
// // L.ClickableTooltip = L.Popup.extend({
// //   onAdd: function (map) {
// //     L.Popup.prototype.onAdd.call(this, map);
// //     const el = this.getElement();
// //     el.addEventListener('click', () => {
// //       this.fire('click');
// //     });
// //     el.style.pointerEvents = 'auto';
// //   },
// // });

const SearchControl = L.Control.extend({
  options: {
    position: 'bottomright',
  },
  onAdd: (map: L.Map) => {
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
    L.DomEvent.on(button, 'click', () => resetSearch());

    return container;
  },
});

const LocationDivIcon = L.Icon.extend({
  options: {
    iconRetinaUrl: new URL('@/assets/marker-circle-icon-2x.png', import.meta.url).href,
    iconUrl: new URL('@/assets/marker-circle-icon.png', import.meta.url).href,
    shadowUrl: new URL('@/assets/marker-circle-icon.png', import.meta.url).href,
    ref: '<a href="https://www.flaticon.com/free-icons/red" title="red icons">Red icons created by hqrloveq - Flaticon</a>',
    iconSize: [24, 26], // size of the icon
    shadowSize: null, // size of the shadow
    iconAnchor: [0, 0], // point of the icon which will correspond to marker's location
    shadowAnchor: null, // the same for the shadow
    popupAnchor: [0, 0], // point from which the popup should open relative to the iconAnchor
  },
});

type NumberedIconOptions = {
  number: number | string;
};
const NumberedDivIcon = L.Icon.extend({
  options: {
    iconRetinaUrl: new URL('@/assets/marker-empty-icon.png', import.meta.url).href,
    iconUrl: new URL('@/assets/marker-empty-icon.png', import.meta.url).href,
    shadowUrl: new URL('@/assets/marker-empty-icon.png', import.meta.url).href,
    number: '',
    iconSize: new L.Point(25, 40),
    iconAnchor: new L.Point(12, 16),
    popupAnchor: new L.Point(0, -13),
    className: 'leaflet-div-icon',
  },
  createIcon: function () {
    const div = document.createElement('div');
    const img = this._createImg(this.options.iconUrl);
    const numdiv = document.createElement('div');

    numdiv.setAttribute('class', 'number');
    numdiv.innerHTML = this.options.number || '';
    div.appendChild(img);
    div.appendChild(numdiv);
    this._setIconStyles(div, 'icon');

    return div;
  },
  //you could change this to add a shadow like in the normal marker if you really wanted
  createShadow: () => null,
}) as new (
  options: NumberedIconOptions,
) => L.Icon;

// // L.CountDivIcon = L.Icon.extend({
// //   options: {
// //     number: '',
// //     className: 'leaflet-div-icon',
// //   },
// //   createIcon: function () {
// //     const div = document.createElement('div');
// //     const img = this._createImg(this.options.iconUrl);
// //     const numdiv = document.createElement('div');
// //     numdiv.setAttribute('class', 'number');
// //     numdiv.innerHTML = this.options.number || '';
// //     div.appendChild(img);
// //     div.appendChild(numdiv);
// //     this._setIconStyles(div, 'icon');
// //     return div;
// //   },
// //   //you could change this to add a shadow like in the normal marker if you really wanted
// //   createShadow: () => null,
// // });
//
const { mapConfig } = configuration.ui;

const geoHashLayer = L.featureGroup();
const tooltipLayers = L.layerGroup();
const outOfBounds = ref(0);
const tooltip = ref<L.Popup>();
const markerSelected = ref(false);
let map: L.Map;

const initMap = () => {
  map = L.map('map', {
    // @ts-expect-error No types
    gestureHandling: true,
    minZoom: 3,
    maxZoom: 18,
    worldCopyJump: false, // this is weird if true because it jumps
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
  outOfBounds.value = 0;
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
      // biome-ignore lint/style/noParameterAssign: FIXME
      position = initialPos;
      position.lng += 360 * (d + 1);
      isVisible = visibleBounds.contains(position);
    }
  } else if (east > 180) {
    const d = (east + 180) / 360;
    position.lng += 360 * d;
    isVisible = visibleBounds.contains(position);

    if (d > 1 && !isVisible) {
      // biome-ignore lint/style/noParameterAssign: FIXME
      position = initialPos;
      position.lng += 360 * (d - 1);
      isVisible = visibleBounds.contains(position);
    }
  }

  return position;
};

const updateLayers = () => {
  clearLayers();

  if (!facets.value) {
    return;
  }

  const facet = facets.value.find((f) => f.name === 'geohash');

  if (!facet) {
    return;
  }

  for (const bucket of facet.buckets) {
    try {
      const geohash = bucket.name;
      const decoded = Geohash.decode(geohash);
      console.log('🪚 decoded:', JSON.stringify(decoded, null, 2));
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
      if (bucket.count > 0) {
        const count = L.marker(latlon, {
          icon: new NumberedDivIcon({ number: bucket.count }),
        });
        L.setOptions(count, { customData: { docCount: bucket.count, key: geohash, latlng: latlon } });
        count.addTo(geoHashLayer);

        let color = '#ffffff';
        const docCount = bucket.count;
        if (docCount <= 1) color = '#ffea1f';
        if (docCount > 1 && docCount <= 10) color = '#4470a2';
        if (docCount > 10 && docCount <= 30) color = '#14a848';
        if (docCount > 30) color = '#ff0000';

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
      L.setOptions(shape, { customData: { docCount: bucket.count, key: geohash, latlng: latlon } });
      shape.addTo(geoHashLayer);

      console.log('🪚 map.getBounds:', JSON.stringify(map.getBounds(), null, 2));
      if (!map.getBounds().contains(latlon)) {
        console.log('shape is out of bounds', shape);
        outOfBounds.value += bucket.count || 0;
      }
    } catch (error) {
      console.log('ERROR GEOHASH BUCKET', error);
    }
  }
};

const calculatePrecision = (zoomLevel: number) => {
  // This is a way to match zoom levels in leaflet vs precision levels in elastic/opensearch geoHashGridAggregation
  let precision = Math.floor(zoomLevel / 2);

  if (precision < 1) {
    precision = 1;
  } else if (precision > 7) {
    precision = 7;
  }

  return precision;
};

const searchEvent = async () => {
  console.log('🪚 💜', 'SearchEvent');
  const zoom = map.getZoom();
  const precision = calculatePrecision(zoom);

  const bounds = map.getBounds();
  const ne = bounds.getNorthEast();
  const sw = bounds.getSouthWest();
  const boundingBox = {
    topRight: { lat: ne.lat, lng: ne.lng },
    bottomLeft: { lat: sw.lat, lng: sw.lng },
  };

  setMapParams({ zoom, precision, boundingBox });

  await updateRoutes();
};

const searchGeoHash = async ({
  geohash,
  pageSize,
  currentPage: newCurentPage,
}: { geohash: string; pageSize: number; currentPage: number }) => {
  const bounds = Geohash.bounds(geohash);
  const boundingBox = {
    topRight: { lat: bounds.ne.lat, lng: bounds.ne.lon },
    bottomLeft: { lat: bounds.sw.lat, lng: bounds.sw.lon },
  };

  setMapParams({ boundingBox });

  // FIXME: Implement this
  // const searchOptions = {
  //   init: false,
  //   boundingBox: boundingBox.value,
  //   multi: searchInput.value,
  //   filters: filters.value,
  //   searchFields,
  //   operation: selectedOperation.value,
  //   page: pageSize,
  //   searchFrom: newCurentPage * pageSize,
  // };

  const items = {
    hits: {
      total: 2,
      hits: [] as ItemType[],
    },
  };
  // const items = await this.$elasticService.map({
  // });

  return items;
};

const getSearchDetailUrl = (item: { '@id': string; '@type': string[]; conformsTo: { '@id': string }[] }) => {
  let url: string;

  const types = item['@type'] || [];

  const repoType = types.find((t) => t === 'RepositoryCollection');
  const fileType = types.find((t) => t === 'File');
  const itemType = types.find((t) => t === 'RepositoryObject');
  const id = encodeURIComponent(item['@id']);

  if (repoType) {
    url = `/collection?id=${id}`;
  } else if (itemType || fileType) {
    url = `/object?id=${id}`;
  } else {
    url = `/object?id=${id}`;
  }

  return url;
};

type ItemType = {
  '@id': string;
  '@type': string[];
  name?: string;
  conformsTo: { '@id': string }[];
  memberOf?: { '@id': string; name: string }[];
};

const getInnerHTMLTooltip = (item: ItemType) => {
  const title = item.name || item['@id'];
  const type = item['@type'];
  const href = getSearchDetailUrl(item);
  const memberOf = item.memberOf || [];
  let innerHTMLMemberOf = '';
  if (Array.isArray(memberOf) && memberOf.length > 0) {
    for (const mO of memberOf) {
      innerHTMLMemberOf += `
        <a
           class="text-sm m-1 text-gray-700 underline"
           href="/collection?id=${encodeURIComponent(mO?.['@id'])}&_crateId=${encodeURIComponent(mO?.['@id'])}"
        >
          ${mO?.name || mO?.['@id']}
        </a>
      `;
    }
  }

  let innerHTML = `
    <div>
      <h3 class="mb-2 mt-1 text-2xl">
        <a href="${href}">${title}</a>
      </h3>
      <h4>Type: ${type}</h4>
  `;

  if (innerHTMLMemberOf) {
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

const initControls = () => {
  map.on('load', async () => {
    console.log('🪚 🔵');
    clearLayers();
    await searchEvent();
  });

  map.on('zoomend', async () => {
    console.log('🪚 🔲', 'ZOOMED');
    // clearLayers();
    // tooltipLayers.clearLayers();
    // tooltip.value = undefined;
    // await searchEvent();
  });

  map.on('dragend', async () => {
    console.log('🪚 ⭐');
    clearLayers();
    tooltipLayers.clearLayers();
    tooltip.value = undefined;
    await searchEvent();
  });

  geoHashLayer.on('click', async (e) => {
    L.DomEvent.stopPropagation(e);
    L.DomEvent.preventDefault(e as unknown as Event);

    tooltip.value = new L.Popup({
      // FIXME: suspect these are leftover from this being a ToolTip and not a PopUp
      // permanent: true,
      // noWrap: true,
      maxWidth: 400,
      maxHeight: 400,
    });

    markerSelected.value = false;
    const data = e.propagatedFrom?.customData;

    // TODO: ask people if they like this behaviour
    const zoom = map.getZoom();
    setMapParams({ zoom });
    if (data?.docCount > 10 && zoom <= 10) {
      //if there are more than X zoom in
      let nextZoom = 1;
      if (data?.docCount >= 30) {
        nextZoom = 4;
      }
      if (data?.docCount >= 10) {
        nextZoom = 2;
      }
      map.setView(e.latlng, zoom + nextZoom);
    } else {
      if (e.propagatedFrom?.customData) {
        const data = e.propagatedFrom?.customData;
        currentPage.value = 0;
        const result = await searchGeoHash({
          geohash: data.key,
          pageSize: pageSize.value,
          currentPage: currentPage.value,
        });

        const total = result.hits.total;
        const tooltipView = document.createElement('div');
        const totalDiv = document.createElement('div');
        totalDiv.innerHTML = `<div class="m-2"><p>Total: ${total}</p></div>`;
        tooltipView.appendChild(totalDiv);

        const pages = Math.ceil((total || 0) / pageSize.value);
        const moreResultsDiv = document.createElement('div');
        if (total > pageSize.value) {
          moreResultsDiv.className = 'inline-flex rounded-md shadow-xs';
          for (let i = 0; i < pages; i++) {
            moreResultsDiv.innerHTML += `
              <a
                class="px-4 py-2 text-sm font-medium text-blue-700 bg-white border border-gray-200 rounded-s-lg hover:bg-gray-100 focus:z-10 focus:ring-2 focus:ring-blue-700 focus:text-blue-700 cursor-pointer"
                onclick="updateGeoHashSearch({geohash: '${data.key}', pageSize: ${pageSize.value}, currentPage: ${i}, nextPage: ${i + 1}})"
              >
                ${i + 1}
              </a>
            `;
          }
          tooltipView.appendChild(moreResultsDiv);
        }

        const divider = document.createElement('div');
        divider.className = 'my-2';
        divider.innerHTML = '<hr class="divide-y divide-gray-500"/>';
        tooltipView.appendChild(divider);
        const hits = document.createElement('div');
        hits.id = 'tooltip_open';

        for (const hit of result.hits.hits) {
          const newDiv = document.createElement('div');
          newDiv.innerHTML = getInnerHTMLTooltip(hit);
          hits.appendChild(newDiv);
        }
        tooltipView.appendChild(hits);

        if (total > pageSize.value) {
          tooltipView.appendChild(moreResultsDiv.cloneNode(true));
        }

        tooltip.value.setContent(tooltipView.outerHTML);
        tooltip.value.setLatLng(e.latlng);
        tooltip.value.addTo(tooltipLayers);

        markerSelected.value = true;
      }
    }
  });
};

onMounted(() => {
  initMap();
  updateLayers();
  initControls();
});

// onUpdated(() => {
//   if (map && geoHashLayer) {
//     updateLayerBuckets(buckets.value);
//   }
// });
//
// onBeforeUnmount(() => {
//   if (map) {
//     map.remove();
//   }
// });

const updateGeoHashSearch = async ({
  geohash,
  pageSize,
  currentPage,
}: { geohash: string; pageSize: number; currentPage: number }) => {
  // NOTE: Why is this needed?
  if (currentPage <= 0) {
    currentPage = 0;
  }

  const result = await searchGeoHash({
    geohash,
    pageSize,
    currentPage,
  });

  const hits = document.getElementById('tooltip_open');
  if (hits) {
    hits.innerHTML = '';
    hits.scrollTop = 0;
  }

  if (result.hits.hits.length === 0) {
    const noResults = document.createElement('div');
    noResults.innerHTML = '<div>No More Results</div>';
    if (hits) {
      hits.appendChild(noResults);
    }
  } else {
    for (const hit of result.hits.hits) {
      const newDiv = document.createElement('div');
      newDiv.innerHTML = getInnerHTMLTooltip(hit);
      if (hits) {
        hits.appendChild(newDiv);
      }
    }
  }
};

watch(facets, updateLayers);

// watch(
//   () => '$route.query',
//   async () => {
//     this.loading = true;
//     if (this.$route.query.s) {
//       this.isStart = true;
//       this.resetSearch();
//     } else {
//       await this.updateFilters({});
//       this.onInputChange(this.$route.query.q);
//       this.currentPage = 0;
//       if (this.$route.query.a) {
//         this.updateAdvancedQueries();
//       }
//       if (this.$route.query.p) {
//         this.currentPrecision = this.$route.query.p;
//       }
//       if (this.$route.query.bb) {
//         boundingBox.value = JSON.parse(decodeURIComponent(this.$route.query.bb));
//       }
//       if (this.$route.query.z) {
//         this.zoomLevel = this.$route.query.z;
//       }
//       await this.search();
//     }
//     this.loading = false;
//   },
// );
</script>

<template>
  <SearchLayout :searchInput="searchInput" :filters="filters" :facets="facets" :entities="entities"
    :clearFilter="clearFilter" :onInputChange="onInputChange" :enableAdvancedSearch="enableAdvancedSearch"
    :clearError="clearError" :filtersChanged="filtersChanged" :advancedSearchEnabled="advancedSearchEnabled"
    :updateRoutes="updateRoutes" :resetAdvancedSearch="resetAdvancedSearch" :clearFilters=clearFilters
    :updateFilter="updateFilter" :basicSearch="basicSearch" :totals="totals" :resetSearch="resetSearch" :isMap="isMap"
    :isLoading="isLoading" :searchTime="searchTime" :sortResults="sortResults" :selectedOrder="selectedOrder"
    :selectedSorting="selectedSorting" :orderResults="orderResults" :pageSize="pageSize"
    :errorDialogText="errorDialogText" :currentPage="currentPage" :updatePages="updatePages">
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
