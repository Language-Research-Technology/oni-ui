<template>
  <el-row>
    <el-col :xs="24" :sm="9" :md="9" :lg="7" :xl="7" :offset="0"
            class="h-full max-h-screen overflow-y-auto flex flex-col h-screen p-2">
      <div v-show="!advancedSearch"
           class="flex-1 w-full min-w-full bg-white rounded mt-4 mb-4 shadow-md border">
        <search-bar ref='searchBar' @populate='populate' :searchInput="searchInput"
                    @search="search" :clearSearch="clear" :filters="this.filters" :fields="searchFields"
                    class="grow justify-items-center items-center m-4"
                    @advanced-search="enableAdvancedSearch" :enableAdvancedSearch="advancedSearch"
                    @updateSearchInput="onInputChange"
                    @basicSearch="updateRoutes" :searchPath="'map'"/>
      </div>
      <div class="flex-1 w-full min-w-full bg-white mt-4 mb-4 border-b-2">
        <div class="py-3 px-2">
          <div class="">
            <p class="text-xl text-gray-600 dark:text-gray-300 font-semibold py-1 px-2">
              Filters
            </p>
          </div>
        </div>
      </div>
      <div class="flex w-full" v-for="aggs of aggregations" :key="aggs.name">
        <ul v-if="aggs?.buckets?.length > 0 && !aggs['hide'] && aggs['name'] !== '_geohash'"
            class="flex-1 w-full min-w-full bg-white rounded p-2 mb-4 shadow-md border">
          <li @click="aggs.active = !aggs.active"
              class="hover:cursor-pointer py-3 flex md:flex md:flex-grow flex-row justify-between space-x-1">
                <span class="text-xl text-gray-600 dark:text-gray-300 font-semibold py-1 px-2">
                  {{ aggs.display }}
                      <el-tooltip v-if="aggs.help"
                                  class="box-item"
                                  effect="light"
                                  trigger="hover"
                                  :content="aggs.help"
                                  placement="top"
                      >
                      <el-button link>
                        <font-awesome-icon icon="fa-solid fa-circle-info"/>
                      </el-button>
                    </el-tooltip>
                </span>
            <span class="py-1 px-2">
                    <font-awesome-icon v-if="aggs.active" icon="fa fa-chevron-down"/>
                  <span v-else>
                    <span class="text-xs rounded-full w-32 h-32 text-white bg-purple-500 p-1">{{
                        aggs?.buckets?.length
                      }}</span>&nbsp;
                    <font-awesome-icon icon="fa fa-chevron-right"/>
                    </span>
                </span>
          </li>
          <li v-if="aggs?.buckets?.length <= 0" class="w-full min-w-full">&nbsp;</li>
          <search-aggs :buckets="aggs.buckets" :aggsName="aggs.name" :ref="aggs.name"
                       v-show="aggs.active" @is-active="aggs.active = true"
                       @changed-aggs="newAggs"/>
        </ul>
      </div>
    </el-col>
    <el-col :xs="24" :sm="15" :md="15" :lg="17" :xl="17" :offset="0"
            class="max-h-screen overflow-y-auto flex flex-row h-screen p-2 px-3">
      <div class="pr-0">
        <div class="top-20 z-10 bg-white pb-3">
          <el-row :align="'middle'" class="mt-4 pb-2 border-0 border-b-[2px] border-solid border-red-700 text-2xl">
            <el-col :xs="24" :sm="24" :md="18" :lg="18" :xl="16">
              <el-button-group class="">
                <el-button type="warning" v-show="changedFilters" @click="updateRoutes({updateFilters: true})">Apply
                  Filters
                </el-button>
              </el-button-group>
              <span class="my-1 mr-1" v-show="!changedFilters" v-if="!isEmpty(this.filters)">Filtering by:</span>
              <el-button-group v-show="!changedFilters"
                               class="my-1 mr-2" v-for="(filter, filterKey) of this.filters" :key="filterKey"
                               v-model="this.filters">
                <el-button plain>{{ clean(filterKey) }}</el-button>
                <el-button v-if="filter && filter.length > 0" v-for="f of filter" :key="f" color="#626aef" plain
                           @click="this.updateFilters({clear: {f, filterKey }})" class="text-2xl">
                  {{ clean(f) }}
                  <el-icon class="el-icon--right">
                    <CloseBold/>
                  </el-icon>
                </el-button>
              </el-button-group>
              <el-button-group class="mr-1">
                <el-button v-show="!isEmpty(this.filters)" @click="clearFilters()">Clear Filters</el-button>
              </el-button-group>
              <span id="total_results" class="my-1 mr-2">
                <span>{{ total }} Index entries (Collections, Objects, Files and Notebooks)</span>
              <span v-if="outOfBounds > 0" class="my-1" v-show="total">, some ({{ outOfBounds }}) result(s) are out of bounds; move your map to see them.
              </span>
              </span>
              <span v-if="errorText">error: {{ errorText }}</span>
            </el-col>
            <el-col :xs="24" :sm="24" :md="6" :lg="6" :xl="6">
              <el-button size="large" @click="showList()">
                               <span>
                  <font-awesome-icon icon="fa-solid fa-list"/>&nbsp;List View
                <el-tooltip
                    content="View the results as a list. Note that current search and filter options will be reset."
                    placement="bottom-end" effect="light">
                  <font-awesome-icon icon="fa fa-circle-question"/>
                </el-tooltip>
                </span>
              </el-button>
            </el-col>
            <el-col>
              <p class="text-sm">
                <font-awesome-icon icon="fa fa-triangle-exclamation"/>
                Filter and Search results will only show results on the current map view, move or resize the map
                to view other results.
              </p>
            </el-col>
          </el-row>

        </div>
      </div>
      <div id="map" class="flex-1 h-[calc(100vh-200px)]" v-once></div>
      <p class="text-sm">This map is not designed or suitable for Native Title research.</p>
    </el-col>
  </el-row>
  <el-dialog v-model="errorDialogVisible" width="40%" center>
    <el-alert title="Error" type="warning" :closable="false">
      <p class="break-normal">{{ this.errorDialogText }}</p>
    </el-alert>
    <template #footer>
        <span class="dialog-footer">
          <el-button type="primary" @click="errorDialogVisible = false">Close</el-button>
        </span>
    </template>
  </el-dialog>
  <el-row v-show="changedFilters"
          class="bg-white rounded m-4 p-4 px-8 shadow-md border"
          role="alert"
          style="bottom: 16px; z-index: 2044; position: fixed">
    <el-row class="p-2">
      <div class="w-full">
        <el-button-group class="self-center">
          <el-button @click="clearFilters()">Clear Filters</el-button>
          <el-button type="warning" @click="updateRoutes({updateFilters: true})">Apply Filters</el-button>
        </el-button-group>
      </div>
    </el-row>
  </el-row>
  <el-row></el-row>
</template>
<script>
import 'leaflet/dist/leaflet.css';
import 'leaflet-gesture-handling/dist/leaflet-gesture-handling.css';
import * as L from 'leaflet';
import 'leaflet.path.drag';
import 'leaflet-editable';
import { getLocalStorage, putLocalStorage, removeLocalStorage } from '@/storage';
import { CloseBold } from '@element-plus/icons-vue';
import Geohash from 'latlon-geohash';
import { GestureHandling } from 'leaflet-gesture-handling';
import { clone, first, isEmpty, orderBy } from 'lodash';
import {
  computed,
  defineAsyncComponent,
  nextTick,
  onBeforeUnmount,
  onMounted,
  onUpdated,
  reactive,
  ref,
  toRaw,
  watch,
} from 'vue';
import SearchAggs from './SearchAggs.component.vue';
import SearchDetailElement from './SearchDetailElement.component.vue';

import { v4 as uuid } from 'uuid';

//This is to fix a leaflet bug
//https://salesforce.stackexchange.com/questions/180977/leaflet-error-when-zoom-after-close-popup-in-lightning-component
L.Popup.prototype._animateZoom = function (e) {
  if (!this._map) {
    return;
  }
  const pos = this._map._latLngToNewLayerPoint(this._latlng, e.zoom, e.center);
  const anchor = this._getAnchor();
  L.DomUtil.setPosition(this._container, pos.add(anchor));
};

L.Icon.Default.prototype._getIconUrl = undefined;

L.Icon.Default.mergeOptions({
  iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
  iconUrl: require('leaflet/dist/images/marker-icon.png'),
  shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
});

L.ClickableTooltip = L.Popup.extend({
  onAdd: function (map) {
    L.Popup.prototype.onAdd.call(this, map);
    const el = this.getElement();
    el.addEventListener('click', () => {
      this.fire('click');
    });
    el.style.pointerEvents = 'auto';
  },
});

L.SearchControl = L.Control.extend({
  options: {
    position: 'bottomright',
    //control position - allowed: 'topleft', 'topright', 'bottomleft', 'bottomright'
  },
  onAdd: (map) => {
    const container = L.DomUtil.create('div', 'leaflet-bar leaflet-control leaflet-control-bottomcenter');
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
      window.oni_ui.resetSearch();
    });
    container.title = 'Reset Search';
    return container;
  },
});

L.LocationDivIcon = L.Icon.extend({
  options: {
    iconRetinaUrl: require('assets/marker-circle-icon-2x.png'),
    iconUrl: require('assets/marker-circle-icon.png'),
    shadowUrl: require('assets/marker-circle-icon.png'),
    ref: '<a href="https://www.flaticon.com/free-icons/red" title="red icons">Red icons created by hqrloveq - Flaticon</a>',
    iconSize: [24, 26], // size of the icon
    shadowSize: null, // size of the shadow
    iconAnchor: [0, 0], // point of the icon which will correspond to marker's location
    shadowAnchor: null, // the same for the shadow
    popupAnchor: [0, 0], // point from which the popup should open relative to the iconAnchor
  },
});

L.NumberedDivIcon = L.Icon.extend({
  options: {
    iconRetinaUrl: require('assets/marker-empty-icon.png'),
    iconUrl: require('assets/marker-empty-icon.png'),
    shadowUrl: require('assets/marker-empty-icon.png'),
    number: '',
    iconSize: new L.Point(25, 40),
    iconAnchor: new L.Point(12, 16),
    popupAnchor: new L.Point(0, -13),
    /*
    iconAnchor: (Point)
    popupAnchor: (Point)
    */
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
});

L.CountDivIcon = L.Icon.extend({
  options: {
    number: '',
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
});

export default {
  name: 'SearchMap',
  components: {
    SearchBar: defineAsyncComponent(() => import('@/components/SearchBar.component.vue')),
    SearchAggs,
    CloseBold,
  },
  props: {},
  data() {
    return {
      buckets: [],
      total: 0,
      totalRelation: 'eq',
      errorText: '',
      item: null,
      map: null,
      tooltipLayers: null,
      geoHashLayer: null,
      markerSelected: false,
      leafletAggs: [],
      aggregations: [],
      advancedSearch: false,
      searchInput: '',
      clear: false,
      filters: {},
      newSearch: true,
      selectedOperation: 'must',
      searchFields: this.$store.state.configuration.ui.searchFields, // Comes from merged API configuration
      currentPrecision: undefined,
      changedFilters: false,
      errorDialogVisible: false,
      errorDialogText: '',
      boundingBox: {},
      initBoundingBox: {
        topRight: {
          lat: 37.160316546736766,
          lon: -174.19921875,
        },
        bottomLeft: {
          lat: -69.90011762668541,
          lon: 85.60546875,
        },
        bottomRight: { lat: -11.523088, lon: 162.649886 },
        topLeft: { lat: -42.811522, lon: 108.64901 },
      },
      initView: [-25, 134],
      initZoom: 4,
      minZoom: 3,
      maxZoom: 18,
      zoomLevel: 8,
      outOfBounds: 0,
      tooltip: undefined,
      pageSize: 10,
      currentPage: 0,
    };
  },
  setup() {},
  created() {
    if (this.$route.query.q) {
      this.searchInput = this.$route.query.q;
    }
  },
  async mounted() {
    //console.log('map mounted');
    // wait so that leaflet div has a size because otherwise the tiles won't load
    //await new Promise(r => setTimeout(r, 100));
    //setTimeout(initMap, 100);
    this.initMap();
    this.clearLayers();
    this.updateLayerBuckets(this.buckets);
    this.initControls();
    //The next line makes the methods availalble outsite vue
    window.oni_ui = this;
  },
  async updated() {
    //console.log('map updated');
    if (this.map && this.geoHashLayer) {
      this.updateLayerBuckets(this.buckets);
      //this.initControls();
    }
  },
  onBeforeUnmount() {
    if (this.map) {
      this.map.remove();
    }
  },
  beforeDestroy() {
    if (this.map) {
      this.map.remove();
    }
  },
  watch: {
    async '$route.query'() {
      this.loading = true;
      if (this.$route.query.s) {
        this.isStart = true;
        this.resetSearch();
      } else {
        await this.updateFilters({});
        this.onInputChange(this.$route.query.q);
        this.currentPage = 0;
        if (this.$route.query.a) {
          this.updateAdvancedQueries();
        }
        if (this.$route.query.p) {
          this.currentPrecision = this.$route.query.p;
        }
        if (this.$route.query.bb) {
          this.boundingBox = JSON.parse(decodeURIComponent(this.$route.query.bb));
        }
        if (this.$route.query.z) {
          this.zoomLevel = this.$route.query.z;
        }
        await this.search();
      }
      this.loading = false;
    },
  },
  methods: {
    isEmpty,
    async created() {
      console.log('created');
      this.isStart = true;
      await this.updateFilters({});
      if (this.$route.query.q) {
        this.searchInput = this.$route.query.q;
      }
      if (this.$route.query.a) {
        this.updateAdvancedQueries();
      } else {
        this.advancedSearch = false;
        removeLocalStorage({ key: 'advancedQueries' });
      }
      this.loading = true;
      // const aggregations = await this.$elasticService.multi({
      //   multi: '',
      //   filters: {},
      //   sort: this.sorting[0].value,
      //   order: 'desc',
      //   operation: 'must',
      //   pageSize: 10,
      //   searchFrom: 0
      // });
      // this.aggregations = this.populateAggregations(aggregations['aggregations']);
      await this.search();
      this.loading = false;
      putLocalStorage({ key: 'lastRoute', data: this.$route.fullPath });
    },
    async mounted() {
      console.log('mounted');
      await this.updateFilters({});
      if (this.$route.query.o) {
        this.selectedOperation = this.$route.query.o;
      }
      if (!this.$route.query.sf) {
        this.searchFields = this.$store.state.configuration.ui.searchFields;
      }
      if (this.$route.query.a) {
        this.updateAdvancedQueries();
      } else {
        this.advancedSearch = false;
      }
    },
    async updated() {
      console.log('updated');
      if (this.$route.query.q) {
        this.advancedSearch = false;
      }
      // await this.updateFilters({});
      putLocalStorage({ key: 'lastRoute', data: this.$route.fullPath });
    },
    initMap() {
      this.boundingBox = clone(this.initBoundingBox);
      this.searchFields = this.$store.state.configuration.ui.searchFields;
      this.geoHashLayer = L.featureGroup();
      this.tooltipLayers = L.layerGroup();
      this.map = L.map('map', {
        gestureHandling: true,
        minZoom: this.minZoom, //Why does it stop working below 3?
        maxZoom: this.maxZoom, //18 is the max
        worldCopyJump: false, // this is weird if true because it jumps
      });
      //This below is a bit annoying because of the squares in the geohash some popups will not be visible
      //this.map.setMaxBounds([[84.67351256610522, -174.0234375], [-58.995311187950925, 223.2421875]]);
      //TODO: pass this via config. Center location and zoom level
      this.map.setView(this.initView, this.initZoom);
      L.tileLayer('//{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors',
        continuousWorld: true, // this doesnt seem to work
      }).addTo(this.map);
      L.control.scale().addTo(this.map);
      this.geoHashLayer.addTo(this.map);
      this.tooltipLayers.addTo(this.map);
      const control = new L.SearchControl();
      control.addTo(this.map);
      //Set initial bounds
      const topLeft = L.latLng(this.boundingBox.topLeft);
      const bottomRight = L.latLng(this.boundingBox.bottomRight);
      const bounds = L.latLngBounds(bottomRight, topLeft);
      console.log('bounds', JSON.stringify(bounds));
      if (bounds.isValid()) this.map.flyToBounds(bounds, { maxZoom: this.maxZoom });
    },
    clearLayers() {
      this.geoHashLayer.clearLayers();
      this.outOfBounds = 0;
    },
    updateLayerBuckets(val) {
      this.clearLayers();
      if (!val) return;
      for (const bucket of val) {
        try {
          const geohash = bucket.key;
          let latlon = Geohash.decode(geohash);
          const newPosition = this.fitBounds(L.latLng(latlon.lat, latlon.lon));
          if (newPosition) {
            latlon = newPosition;
          }
          const bounds = Geohash.bounds(geohash);
          const newNEBounds = this.fitBounds(L.latLng(bounds.ne.lat, bounds.ne.lon));
          const newSWBounds = this.fitBounds(L.latLng(bounds.sw.lat, bounds.sw.lon));
          if (newNEBounds && newSWBounds) {
            bounds.ne.lat = newNEBounds.lat;
            bounds.ne.lon = newNEBounds.lng;
            bounds.sw.lat = newSWBounds.lat;
            bounds.sw.lon = newSWBounds.lng;
          }

          let shape;
          if (bucket.doc_count > 0) {
            // TODO: clean if we are doing radius for everything or setup > 1 so you can have a single icon no circle
            // These next 2 lines will create a CIRCLE and
            // const radius = this.geohashRadius(geohash);
            // asWKT = `CIRCLE ( (${latlon['lon']} ${latlon['lat']}), ${radius} )`;
            const count = L.marker(latlon, {
              icon: new L.NumberedDivIcon({ number: bucket.doc_count }),
            });
            count._data = { docCount: bucket.doc_count, key: geohash, latlng: latlon };
            count.addTo(this.geoHashLayer);
            let color = '#ffffff';
            const docCount = bucket.doc_count;
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
              icon: new L.LocationDivIcon(),
            });
          }
          shape._data = { docCount: bucket.doc_count, key: geohash, latlng: latlon };
          shape.addTo(this.geoHashLayer);

          if (!this.map.getBounds().contains(latlon)) {
            console.log('shape is out of bounds', shape);
            this.outOfBounds += Number.parseInt(bucket.doc_count || 0);
          }
        } catch (error) {
          console.log('ERROR GEOHASH BUCKET', error);
        }
      }
    },
    initControls() {
      // if (this.$route.query.p) {
      //   this.currentPrecision = parseInt(this.$route.query.p);
      // }
      // if (this.$route.query.bb) {
      //   this.boundingBox = toRaw(JSON.parse(decodeURIComponent(this.$route.query.bb)));
      //   this.setMapBounds()
      // }
      // if (this.$route.query.z) {
      //   this.zoomLevel = parseInt(this.$route.query.z);
      // }

      this.map.on('load', async (e) => {
        this.clearLayers();
        await this.searchEvent();
      });

      this.map.on('zoomend', async (e) => {
        this.clearLayers();
        this.tooltipLayers.clearLayers();
        this.tooltip = undefined;
        await this.searchEvent();
      });

      this.map.on('dragend', async (e) => {
        this.clearLayers();
        this.tooltipLayers.clearLayers();
        this.tooltip = undefined;
        await this.searchEvent();
      });

      this.geoHashLayer.on('click', async (e) => {
        L.DomEvent.stopPropagation(e);
        L.DomEvent.preventDefault(e);
        this.tooltip = new L.Popup({
          permanent: true,
          noWrap: true,
          maxWidth: 400,
          maxHeight: 400,
        });
        const innerHHTML = '';
        this.markerSelected = false;
        const data = e.layer?._data;
        // TODO: ask people if they like this behaviour
        this.zoomLevel = this.map.getZoom();
        if (data?.docCount > 10 && this.zoomLevel <= 10) {
          //if there are more than X zoom in
          let nextZoom = 1;
          if (data?.docCount >= 30) {
            nextZoom = 4;
          }
          if (data?.docCount >= 10) {
            nextZoom = 2;
          }
          this.map.setView(e.latlng, this.zoomLevel + nextZoom);
        } else {
          if (e.layer?._data) {
            const data = e.layer?._data;
            this.currentPage = 0;
            const result = await this.searchGeoHash({
              geohash: data.key,
              pageSize: this.pageSize,
              currentPage: this.currentPage,
            });
            const total = result.hits.total;
            const tooltipView = document.createElement('div');
            const totalDiv = document.createElement('div');
            totalDiv.innerHTML = `<div class="m-2"><p>Total: ${total?.value}</p></div>`;
            tooltipView.appendChild(totalDiv);
            const pages = Math.ceil((total?.value || 0) / this.pageSize);
            const moreResultsDiv = document.createElement('div');
            if (total?.value > this.pageSize) {
              moreResultsDiv.className = 'inline-flex rounded-md shadow-sm';
              for (let i = 0; i < pages; i++) {
                moreResultsDiv.innerHTML += `<a class="px-4 py-2 text-sm font-medium text-blue-700 bg-white border border-gray-200 rounded-s-lg hover:bg-gray-100 focus:z-10 focus:ring-2 focus:ring-blue-700 focus:text-blue-700 dark:bg-gray-800 dark:border-gray-700 dark:text-white dark:hover:text-white dark:hover:bg-gray-700 dark:focus:ring-blue-500 dark:focus:text-white cursor-pointer" onclick="oni_ui.updateGeoHashSearch({geohash: '${data.key}', pageSize: ${this.pageSize}, currentPage: ${i}, nextPage: ${i + 1}})">${i + 1}</a>`;
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
              newDiv.innerHTML = this.getInnerHTMLTooltip(hit._source, total);
              hits.appendChild(newDiv);
            }
            tooltipView.appendChild(hits);
            if (total?.value > this.pageSize) {
              tooltipView.appendChild(moreResultsDiv.cloneNode(true));
            }
            this.tooltip.setContent(tooltipView.outerHTML);
            this.tooltip.setLatLng(e.latlng);
            this.tooltip.addTo(this.tooltipLayers);
            this.markerSelected = true;
          }
        }
      });
    },
    open(route) {
      this.$router.push({ path: route });
    },
    getSearchDetailUrl(item) {
      let url;
      const types = item['@type'] || [];
      const repoType = types.find((t) => t === 'RepositoryCollection');
      const fileType = types.find((t) => t === 'File');
      const itemType = types.find((t) => t === 'RepositoryObject');
      let id = encodeURIComponent(item['@id']);
      const crateId = encodeURIComponent(first(item._crateId)?.['@value']);
      if (repoType) {
        url = `/collection?id=${id}&_crateId=${crateId}`;
      } else if (itemType) {
        url = `/object?id=${id}&_crateId=${crateId}`;
      } else if (fileType) {
        let isNotebook;
        if (item?.conformsTo) {
          isNotebook = item.conformsTo.find((c) => c['@id'] === this.conformsToNotebook);
        }
        if (isNotebook) {
          id = encodeURIComponent(item._id);
          url = `/object?_id=${id}`;
        } else {
          const fileId = id;
          id = encodeURIComponent(first(item._parent)?.['@id']);
          url = `/object?id=${id}&_crateId=${crateId}&fileId=${fileId}`;
        }
      } else {
        //Defaults to object if it doesnt know what it is
        url = `/object?id=${id}&_crateId=${crateId}`;
      }
      return url;
    },
    getInnerHTMLTooltip(item) {
      const title = first(item.name)['@value'] || item['@id'];
      const type = item['@type'];
      const href = this.getSearchDetailUrl(item);
      const _memberOf = item._memberOf || [];
      let innerHTMLMemberOf = '';
      if (Array.isArray(_memberOf) && _memberOf.length > 0) {
        for (const mO of _memberOf) {
          innerHTMLMemberOf += `
        <a class="text-sm m-1 text-gray-700 dark:text-gray-300 underline"
               href="/collection?id=${encodeURIComponent(mO?.['@id'])}&_crateId=${encodeURIComponent(mO?.['@id'])}">
        ${first(mO?.name)?.['@value'] || mO?.['@id']}
        </a>
      `;
        }
      }
      let innerHTML = `
        <div>
            <h3 class="mb-2 mt-1 text-2xl">
            <a href="${href}">${title}</a></h3>
            <h4>Type: ${type}</h4>`;
      if (innerHTMLMemberOf) {
        innerHTML += `
            <div :align="'middle'" v-if="" class="">
            <span class="font-normal text-gray-700">
                Member of:&nbsp;
            <span class="inline-flex flex-wrap">
                ${innerHTMLMemberOf}
            </span>
             </p>`;
      }
      innerHTML += `
          <p class="justify-self-end">
            <a href="${href}">See more</a>
          </p>
        </div>
        <hr class="divide-y divide-gray-500"/>
      `;
      return innerHTML;
    },
    async search() {
      try {
        //console.log('search');
        if (isEmpty(this.boundingBox)) {
          this.setMapBounds();
        }
        if (this.map.getZoom() !== this.zoomLevel) {
          this.map.setZoom(this.zoomLevel);
        }
        this.changedFilters = false;
        let filters = {};
        if (!isEmpty(this.filters)) {
          filters = this.filters;
        } else {
          filters = {};
        }
        const items = await this.$elasticService.map({
          init: false,
          boundingBox: this.boundingBox,
          precision: this.currentPrecision,
          multi: this.searchInput,
          filters: toRaw(this.filters),
          searchFields: this.searchFields,
          operation: this.selectedOperation,
        });
        this.leafletAggs = items.aggregations._geohash;
        const viewport = this.leafletAggs;
        this.updateLayerBuckets(viewport?.buckets);
        this.aggregations = this.populateAggregations(items.aggregations);
        const total = items.hits?.total;
        this.total = total?.value || 0;
        this.totalRelation = total?.relation || 'eq';
        return items;
      } catch (e) {
        console.log('error', e);
        return [];
      }
    },
    async searchGeoHash({ geohash, pageSize, currentPage }) {
      this.currentPage = 0;
      if (geohash) {
        const bounds = Geohash.bounds(geohash);
        this.boundingBox = {
          topRight: { lat: bounds.ne.lat, lon: bounds.ne.lon },
          bottomLeft: { lat: bounds.sw.lat, lon: bounds.sw.lon },
        };
        // const items = await this.$elasticService.map({init: false, boundingBox});

        const items = await this.$elasticService.map({
          init: false,
          boundingBox: this.boundingBox,
          multi: this.searchInput,
          filters: toRaw(this.filters),
          searchFields: this.searchFields,
          operation: this.selectedOperation,
          page: pageSize,
          searchFrom: currentPage * pageSize,
        });
        return items;
      }
    },
    calculatePrecision(zoomLevel) {
      // This is a way to match zoom levels in leaflet vs precision levels in elastic/opensearch geoHashGridAggregation
      let precision = Math.floor(Number.parseInt(zoomLevel) / 2);
      if (precision < 1) {
        precision = 1;
      } else if (precision > 7) {
        precision = 7;
      }
      return precision;
    },
    async searchEvent(init) {
      this.zoomLevel = this.map.getZoom();
      this.currentPrecision = this.calculatePrecision(this.zoomLevel);
      this.setMapBounds(init);
      await this.updateRoutes({ updateFilters: init });
    },
    // Approximate the radius in meters of a geohash
    geohashRadius(geohash) {
      // Length of a degree (in meters) at the equator
      const metersPerDegree = 111319.9;

      // Length of a degree (in meters) at the given latitude
      function degToMetersLat(latitude) {
        return metersPerDegree * (1 / Math.cos((latitude * Math.PI) / 180));
      }

      // Decode the geohash to get its bounding box
      const bbox = Geohash.bounds(geohash);

      // Calculate the center latitude and longitude of the bounding box
      const centerLatitude = (bbox.ne.lat + bbox.sw.lat) / 2;
      //TODO: center longitude not used?
      const centerLongitude = (bbox.ne.lon + bbox.sw.lon) / 2;

      // Calculate the width and height of the bounding box in degrees
      const widthDeg = bbox.ne.lat - bbox.sw.lat; //bbox[1] - bbox[0];
      const heightDeg = bbox.ne.lon - bbox.sw.lon; //bbox[3] - bbox[2];

      // Convert the width and height from degrees to meters
      const widthMeters = widthDeg * metersPerDegree;
      const heightMeters = heightDeg * degToMetersLat(centerLatitude);

      // Use the average of the width and height as the approximate radius
      const radius = (widthMeters + heightMeters) / 2;
      return radius;
    },
    showList() {
      this.$router.push({ path: '/search' });
    },
    newAggs({ query, aggsName }) {
      if (query.f) {
        //In here we need to merge the filters
        const decodedFilters = JSON.parse(decodeURIComponent(query.f));
        this.mergeFilters(decodedFilters, aggsName);
      }
      if (query.q) {
        this.searchInput = decodeURIComponent(query.q);
      }
      //console.log(isEmpty(this.filters))
      this.changedFilters = true;
    },
    populate({ items, newSearch, aggregations }) {
      this.items = [];
      if (newSearch) {
        this.newSearch = true;
      }
      if (items?.hits) {
        const thisItems = items.hits.hits;
        this.totals = items.hits.total;
        if (thisItems.length > 0) {
          for (const item of thisItems) {
            this.items.push(item);
          }
          this.more = true;
        } else {
          this.more = false;
        }
      }
      if (items?.aggregations) {
        this.aggregations = this.populateAggregations(items.aggregations);
        this.memberOfBuckets = items.aggregations?.['_memberOf.name.@value'];
      }
    },
    populateAggregations(aggregations) {
      const a = {};
      //Note: below is converted to an ordered array not an object.
      const aggInfo = this.$store.state.configuration.ui.aggregations;
      for (const agg of Object.keys(aggregations)) {
        const info = aggInfo.find((a) => a.name === agg);
        const display = info?.display;
        const order = info?.order;
        const name = info?.name;
        const hide = info?.hide;
        const active = info?.active;
        const help = info?.help;
        a[agg] = {
          buckets: aggregations[agg]?.buckets || aggregations[agg]?.values?.buckets,
          display: display || agg,
          order: order || 0,
          name: name || agg,
          hide: hide,
          active: active,
          help: help || '',
        };
      }
      return orderBy(a, 'order');
    },
    enableAdvancedSearch() {
      alert('Advanced Search is not available in Map View.');
    },
    onInputChange(value) {
      this.searchInput = value;
    },
    async updateFilters({ clear, empty }) {
      try {
        // updating filters from command
        if (clear?.f && clear?.filterKey) {
          if (this.filters[clear.filterKey]) {
            this.filters[clear.filterKey].splice(this.filters[clear.filterKey].indexOf(clear.f), 1);
            if (isEmpty(this.filters[clear.filterKey])) {
              delete this.filters[clear.filterKey];
            }
            //if there is an update on the filter the site will do another search.
            await this.updateRoutes({ updateFilters: true });
          }
        } else {
          // or updating filters from routes
          if (isEmpty(this.$route.query.f)) {
            this.filters = {};
          } else {
            let filterQuery;
            const filters = decodeURIComponent(this.$route.query.f);
            filterQuery = JSON.parse(filters);
            this.filters = {};
            for (const [key, val] of Object.entries(filterQuery)) {
              this.filters[key] = val;
              if (this.filters[key].length === 0) {
                delete this.filters[key];
              }
            }
          }
        }
      } catch (e) {
        console.error(e);
      }
    },
    async updateRoutes({ queries, updateFilters }) {
      let filters;
      const query = {};
      let localFilterUpdate = false;
      if (!isEmpty(this.filters) || updateFilters) {
        filters = toRaw(this.filters);
        filters = encodeURIComponent(JSON.stringify(filters));
        query.f = filters;
        localFilterUpdate = true;
      } else {
        query.f = undefined;
      }
      if (this.$route.query.f && !localFilterUpdate) {
        query.f = this.$route.query.f;
      }
      let localSearchGroupUpdate = false;
      if (queries?.searchGroup) {
        this.advancedQueries = queries;
        query.q = undefined;
        query.a = queries.searchGroup;
        this.currentPage = 0;
        //this.selectedSorting = this.sorting[0];
        localSearchGroupUpdate = true;
      }
      if (this.$route.query.a && !localSearchGroupUpdate) {
        query.a = this.$route.query.a;
        query.q = undefined;
        this.updateAdvancedQueries();
      } else {
        this.advancedQueries = null; //clear advanced search
        query.q = this.searchInput;
      }
      query.z = this.zoomLevel;
      query.p = this.currentPrecision;
      query.bb = encodeURIComponent(JSON.stringify(this.boundingBox));
      console.log(JSON.stringify(this.boundingBox));
      query.r = uuid();
      await this.$router.push({ path: 'map', query, replace: false });
    },
    async bucketSelected({ checkedBuckets, id }) {
      // this.filters[id] = checkedBuckets.map((k) => {
      //   return {key: k}
      // });
      this.filters[id] = checkedBuckets;
      await this.updateRoutes({ updateFilters: true });
    },
    async resetSearch() {
      console.log(this.boundingBox);
      this.map.setZoom(this.initZoom);
      this.map.setView(this.initView, this.initZoom);
      this.zoomLevel = this.initZoom;
      this.boundingBox = this.initBoundingBox;
      this.currentPrecision = undefined;
      const topLeft = L.latLng(this.boundingBox.topLeft);
      const bottomRight = L.latLng(this.boundingBox.bottomRight);
      const bounds = L.latLngBounds(bottomRight, topLeft);
      this.map.fitBounds(bounds, { maxZoom: this.maxZoom });
      this.filters = {};
      this.searchInput = '';
      await this.searchEvent(true);
    },
    async clearFilters() {
      this.filters = {};
      await this.updateRoutes({ updateFilters: true });
    },
    mergeFilters(newFilters, aggsName) {
      const filters = toRaw(this.filters);
      if (isEmpty(this.filters)) {
        this.filters = newFilters;
      } else {
        this.filters[aggsName] = newFilters[aggsName] || [];
        if (isEmpty(this.filters[aggsName])) {
          delete this.filters[aggsName];
        }
      }
      console.log('is this.filters empty?');
      console.log(isEmpty(this.filters));
      // this.filters = filters;
    },
    clean(string) {
      if (string === 'true') {
        return 'Yes';
      }
      if (string === 'false') {
        return 'No';
      }
      string = string.replace(/@|_|(\..*)/g, '');
      return string;
    },
    setMapBounds(init) {
      if (init) {
        this.boundingBox = this.initBoundingBox;
        console.log('init bounds', init);
      }
      const bounds = this.map.getBounds();
      if (bounds.isValid()) {
        this.boundingBox = {
          topRight: { lat: bounds._northEast.lat, lon: bounds._northEast.lng },
          bottomLeft: { lat: bounds._southWest.lat, lon: bounds._southWest.lng },
        };
      } else {
        alert('Bounds not valid');
      }
      //console.log("boundingBox", JSON.stringify(this.boundingBox))
    },
    fitBounds(position) {
      //From: https://stackoverflow.com/a/78175342/1470833
      //If the point does not fit the bounds try to flip the degrees
      const visibleBounds = this.map.getBounds();
      const west = visibleBounds.getWest();
      const east = visibleBounds.getEast();
      let isVisible = visibleBounds.contains(position);
      if (isVisible) {
        return undefined;
      }
      const initialPos = L.latLng([position.lat, position.lng]);
      if (west < -180) {
        const d = Number.parseInt((west - 180) / 360);
        position.lng += 360 * d;
        isVisible = visibleBounds.contains(position);
        if (d < -1 && !isVisible) {
          // this part it hard to explain for me so easiest thing to do to understand how it work is to remove it and go far past 180
          position = initialPos;
          position.lng += 360 * (d + 1);
          isVisible = visibleBounds.contains(position);
        }
      } else if (east > 180) {
        const d = Number.parseInt((east + 180) / 360);
        position.lng += 360 * d;
        isVisible = visibleBounds.contains(position);
        if (d > 1 && !flag) {
          position = initialPos;
          position.lng += 360 * (d - 1);
          isVisible = visibleBounds.contains(position);
        }
      }
      return position;
    },
    async updateGeoHashSearch({ geohash, pageSize, currentPage, nextPage }) {
      if (currentPage <= 0) {
        currentPage = 0;
      }
      const result = await window.oni_ui.searchGeoHash({
        geohash,
        pageSize,
        currentPage,
      });
      const hits = document.getElementById('tooltip_open');
      hits.innerHTML = '';
      hits.scrollTop = 0;
      const total = result.hits.total;
      console.log(result.hits.hits.length);
      if (result.hits.hits.length === 0) {
        const noResults = document.createElement('div');
        noResults.innerHTML = '<div>No More Results</div>';
        hits.appendChild(noResults);
      } else {
        for (const hit of result.hits.hits) {
          const newDiv = document.createElement('div');
          newDiv.innerHTML = this.getInnerHTMLTooltip(hit._source, total);
          hits.appendChild(newDiv);
        }
      }

      // const totalDiv = document.createElement('div');
      // totalDiv.innerHTML = `
      // <div class="m-2">
      //   <p>Total: ${total?.value}</p>
      // </div>
      //   `;
      // hits.appendChild(totalDiv);
      // const moreResultsDiv = document.createElement('div');
      // if (total?.value > pageSize && currentPage !== 0) {
      //   moreResultsDiv.innerHTML = `<p><a class="cursor-pointer" onclick="oni_ui.updateGeoHashSearch({geohash: '${geohash}', pageSize: ${pageSize}, currentPage: ${currentPage - 1}, nextPage: false})">Previous Results</a></p>`;
      // }
      // if(result['hits']['hits'].length !== 0) {
      //   moreResultsDiv.innerHTML += `<p><a class="cursor-pointer" onclick="oni_ui.updateGeoHashSearch({geohash: '${geohash}', pageSize: ${pageSize}, currentPage: ${currentPage + 1}, nextPage: true})">Next Results</a></p>`;
      // }
      // hits.appendChild(moreResultsDiv);
    },
  },
};
</script>

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

/*.circle {*/
/*  display: table-cell;*/
/*  text-align: center;*/
/*  vertical-align: middle;*/
/*  border-radius: 50%;*/
/*  border-style: none;*/
/*  font-size: 16px;*/
/*  font-weight: bold;*/
/*  background: rgba(0, 57, 128, 0.2);*/
/*  border-color: #3388FF;*/
/*  color: white;*/
/*}*/

</style>
