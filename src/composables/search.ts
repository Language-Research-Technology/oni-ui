import { ref, onMounted, inject, watch } from 'vue';

import { configuration } from '@/configuration';
import type { ApiService, EntityType, GetSearchResponse, SearchParams } from '@/services/api';

import { useGtm } from '@gtm-support/vue-gtm';
import { useRoute, useRouter } from 'vue-router';

const { mapConfig } = configuration.ui;

export type FacetType = {
  buckets: Array<{ name: string; count: number }>;
  display: string;
  order: number;
  name: string;
  active?: boolean;
  help: string;
  hide?: boolean;
};

export const useSearch = (searchType: 'list' | 'map') => {
  const router = useRouter();
  const route = useRoute();
  const gtm = useGtm();

  const api = inject<ApiService>('api');
  if (!api) {
    throw new Error('API instance not provided');
  }

  const { ui } = configuration;
  const { searchFields } = ui;

  const isMap = searchType === 'map';

  // Search state
  const searchInput = ref('');
  const advancedSearchEnabled = ref(false);
  const filters = ref<Record<string, string[]>>({});

  // Pagination
  const pageSize = ref(10);
  const currentPage = ref(1);
  const totals = ref(0);
  const searchTime = ref(0);

  // Other
  const facets = ref<FacetType[]>();
  const isLoading = ref(false);
  const filtersChanged = ref(false);
  const errorDialogText = ref<string | undefined>();
  const entities = ref<EntityType[]>([]);
  const selectedOperation = ref(route.query.o || 'must');
  const resetAdvancedSearch = ref(false);

  const more = ref(false);
  const clear = ref(false);
  const filterButton = ref([]);
  const isBrowse = ref(false);

  const ordering = ui.search?.ordering || [
    { value: 'asc', label: 'Ascending' },
    { value: 'desc', label: 'Descending' },
  ];
  const defaultOrder = ordering[0];
  const selectedOrder = ref(defaultOrder);

  const sorting = ui.search?.sorting || [{ value: 'relevance', label: 'Relevance' }];
  const defaultSorting = ui.search?.searchSorting || sorting[0];
  const selectedSorting = ref(defaultSorting);

  // Map Stuff
  const zoomLevel = ref(mapConfig.zoom);
  const boundingBox = ref(mapConfig.boundingBox);
  const geohashGrid = ref<Record<string, number>>({});

  const clearFilter = async (f: string, filterKey: string) => {
    if (filters.value[filterKey]) {
      filters.value[filterKey].splice(filters.value[filterKey].indexOf(f), 1);

      if (filters.value[filterKey].length === 0) {
        delete filters.value[filterKey];
      }

      await syncStateToUrlAndNavigate();
    }
  };

  const syncStateFromUrl = () => {
    console.log('🪚 🟩');
    searchInput.value = route.query.q?.toString() || '';
    advancedSearchEnabled.value = !!route.query.a;

    filters.value = {};

    if (route.query.f) {
      const filterQuery = JSON.parse(decodeURIComponent(route.query.f.toString())) as Record<string, string[]>;
      for (const [key, val] of Object.entries(filterQuery)) {
        filters.value[key] = val;
        if (filters.value[key].length === 0) {
          delete filters.value[key];
        }
      }
    }

    zoomLevel.value = route.query.z ? Number.parseInt(route.query.z.toString(), 10) : mapConfig.zoom;

    boundingBox.value = route.query.bb
      ? JSON.parse(decodeURIComponent(route.query.bb.toString()))
      : mapConfig.boundingBox;
  };

  const syncStateToUrlAndNavigate = async ({ searchGroup }: { searchGroup?: object[] } = {}) => {
    console.log('🪚 syncStateToUrlAndNavigate');
    const query: { q?: string; f?: string; a?: string; z?: string; p?: string; bb?: string } = {};

    if (Object.keys(filters.value).length > 0) {
      query.f = encodeURIComponent(JSON.stringify(filters.value));
    }

    // TODO: rather than passing this have a function set it directly maybe?
    if (searchGroup) {
      query.a = encodeURIComponent(JSON.stringify(searchGroup));
      currentPage.value = 1;
    } else {
      if (route.query.a) {
        query.a = route.query.a.toString();
      } else {
        query.q = searchInput.value ? searchInput.value.toString() : undefined;
      }
    }

    if (isMap) {
      query.z = zoomLevel.value.toString();
      query.bb = encodeURIComponent(JSON.stringify(boundingBox.value));
    }

    await router.push({ path: isMap ? 'map' : 'search', query, replace: true });
  };

  const setMapParams = ({
    zoom,
    boundingBox: localBoundingBox,
  }: {
    zoom?: number;
    boundingBox?: { topRight: { lat: number; lng: number }; bottomLeft: { lat: number; lng: number } };
  }) => {
    if (zoom) {
      zoomLevel.value = zoom;
    }

    if (localBoundingBox) {
      boundingBox.value = localBoundingBox;
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

  const search = async () => {
    console.log('🪚 search');
    filtersChanged.value = false;

    isLoading.value = true;

    try {
      const params: SearchParams = {
        query: route.query.a ? generateQueryString(route.query.a.toString()) : searchInput.value.toString(),
        searchType: route.query.a ? 'advanced' : 'basic',
        filters: filters.value,
        limit: pageSize.value,
        offset: (currentPage.value - 1) * pageSize.value,
        sort: selectedSorting.value?.value,
        order: selectedOrder.value?.value,
      };

      if (isMap) {
        params.geohashPrecision = calculatePrecision(zoomLevel.value);
        params.boundingBox = { ...boundingBox.value };
      }

      const results = await api.search(params);

      searchTime.value = results.searchTime;

      entities.value = [];

      if (results.entities) {
        totals.value = results.total;

        for (const entity of results.entities) {
          entities.value.push(entity);
        }

        more.value = true;
      } else {
        more.value = false;
      }

      if (results.facets) {
        facets.value = populateFacets(results.facets);
      }

      geohashGrid.value = results.geohashGrid;

      isLoading.value = false;

      gtm?.trackEvent({
        event: '/search',
        category: 'search',
        label: 'search',
      });
    } catch (e) {
      const err = e as Error;
      errorDialogText.value = err.message;
      isLoading.value = false;
    }
  };

  const generateQueryString = (rawSearchGroup: string) => {
    let qS = '';
    const searchGroup = JSON.parse(decodeURIComponent(rawSearchGroup));
    // @ts-expect-error FIXME:
    searchGroup.forEach((sg, i) => {
      let lastOneSG = false;
      if (i + 1 === searchGroup.length) {
        lastOneSG = true;
      }
      if (sg.searchInput.length === 0) {
        sg.searchInput = '*';
      }
      if (sg.field === 'all_fields') {
        let qqq = '( ';
        Object.keys(searchFields).map((f, index, keys) => {
          let lastOne = false;
          if (index + 1 === keys.length) {
            lastOne = true;
          }
          let qq = '';
          qq = String.raw`${f} : ${sg.searchInput} ${!lastOne ? 'OR' : ''} `;
          qqq += qq;
        });
        qS += String.raw`${qqq} ) ${!lastOneSG ? sg.operation : ''} `;
      } else {
        qS += String.raw` ( ${sg.field}: ${sg.searchInput} ) ${!lastOneSG ? sg.operation : ''}`;
      }
    });
    return qS;
  };

  const populateFacets = (newFacets: GetSearchResponse['facets']) => {
    const a: FacetType[] = [];
    // NOTE: below is converted to an ordered array not an object.
    const aggInfo = ui.aggregations;

    for (const facet of Object.keys(newFacets)) {
      const info = aggInfo.find((a) => a.name === facet);
      const display = info?.display;
      const order = info?.order;
      const name = info?.name;
      const hide = info?.hide;
      const active = facets?.value?.find((a) => a.name === facet)?.active || info?.active;
      const help = info?.help;
      a.push({
        buckets: newFacets[facet],
        display: display || facet,
        order: order || 0,
        name: name || facet,
        hide: hide,
        active: active,
        help: help || '',
      });
    }

    return a.sort((a, b) => a.order - b.order);
  };

  const onInputChange = (value: string) => {
    searchInput.value = value;
  };

  const resetSearch = async () => {
    scrollToTop();

    clear.value = !clear.value;

    searchInput.value = '';
    filters.value = {};

    if (resetAdvancedSearch.value) {
      advancedSearchEnabled.value = false;
    } else {
      advancedSearchEnabled.value = !!route.query.a;
    }
    resetAdvancedSearch.value = true;

    route.query.o = selectedOperation.value;
    selectedOrder.value = defaultOrder;
    filterButton.value = [];
    isBrowse.value = false;
    currentPage.value = 1;
    filters.value = {};

    const query = {};

    // TODO: Reset the map stuff
    // map.setZoom(initZoom);
    // map.setView(initView, initZoom);
    //
    // zoomLevel.value = initZoom;
    // boundingBox.value = { ...initBoundingBox };
    //
    // const topRight = L.latLng(boundingBox.value.topRight);
    // const bottomLeft = L.latLng(boundingBox.value.bottomLeft);
    // const bounds = L.latLngBounds(bottomLeft, topRight);
    // map.fitBounds(bounds, { maxZoom });
    await router.push({ path: isMap ? 'map' : 'search' });
  };

  const scrollToTop = () => {
    setTimeout(() => {
      window.scrollTo(0, 0);
      const scrollable = document.querySelectorAll('[data-scroll-to-top]');

      for (const el of scrollable) {
        if (el.scrollTop > 0) {
          el.scrollTo({ top: 0 });
        }
      }
    }, 100);
  };

  const sortResults = (sort: string) => {
    currentPage.value = 1;
    selectedSorting.value = sorting.find(({ value }) => value === sort) || defaultSorting;
    search();
  };

  const orderResults = (order: string) => {
    currentPage.value = 1;
    selectedOrder.value = ordering.find(({ value }) => value === order) || defaultOrder;
    search();
  };

  const updatePages = async (page: number) => {
    currentPage.value = page;
    await search();
    scrollToTop();
  };

  const clearFilters = async () => {
    filters.value = {};
    await syncStateToUrlAndNavigate();
  };

  const updateFilter = (name: string, values: string[]) => {
    if (values.length === 0) {
      delete filters.value[name];
    } else {
      filters.value[name] = values;
    }

    filtersChanged.value = true;
  };

  const enableAdvancedSearch = () => {
    advancedSearchEnabled.value = true;
    searchInput.value = '';
    scrollToTop();
  };

  const basicSearch = () => {
    advancedSearchEnabled.value = false;
    resetAdvancedSearch.value = true;
    resetSearch();
  };

  const doWork = async () => {
    await syncStateFromUrl();

    search();
  };

  const clearError = () => {
    errorDialogText.value = undefined;
  };

  watch(
    () => route.query,
    async () => {
      currentPage.value = 1;

      doWork();
    },
  );

  onMounted(() => doWork());

  return {
    advancedSearchEnabled,
    searchInput,
    errorDialogText,
    facets,
    geohashGrid,
    searchFields,
    entities,
    filters,
    isLoading,
    totals,
    searchTime,
    isMap,
    selectedOrder,
    selectedSorting,
    pageSize,
    currentPage,

    onInputChange,
    updateRoutes: syncStateToUrlAndNavigate,
    enableAdvancedSearch,
    basicSearch,
    updateFilter,
    resetAdvancedSearch,
    filtersChanged,
    clearFilter,
    clearFilters,
    resetSearch,
    sortResults,
    orderResults,
    updatePages,
    clearError,
    setMapParams,
  };
};
