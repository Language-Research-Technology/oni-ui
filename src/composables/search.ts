import { useGtm } from '@gtm-support/vue-gtm';
import { inject, onMounted, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { ui } from '@/configuration';
import type { ApiService, EntityType, GetSearchResponse, SearchParams } from '@/services/api';

const { mapConfig } = ui;

export type FacetType = {
  buckets: Array<{ name: string; count: number }>;
  display: string;
  order: number;
  name: string;
  active?: boolean;
  help: string;
};

export type AdvancedSearchLine = {
  field: string;
  operation: string;
  operator: string;
  type: string;
  searchInput: string;
};

export type SetSearchParamsOptions = {
  zoomLevel?: number;
  boundingBox?: { topRight: { lat: number; lng: number }; bottomLeft: { lat: number; lng: number } };
  advancedSearchLines?: AdvancedSearchLine[];
  advancedSearchEnabled?: boolean;
};

export const blankAdvancedSearchLine: AdvancedSearchLine = {
  field: 'all_fields',
  operation: 'AND',
  operator: 'AND',
  type: 'phrase',
  searchInput: '',
};

export const useSearch = (searchType: 'list' | 'map') => {
  const router = useRouter();
  const route = useRoute();
  const gtm = useGtm();

  const api = inject<ApiService>('api');
  if (!api) {
    throw new Error('API instance not provided');
  }

  const { searchFields } = ui;

  const isMap = searchType === 'map';

  // Search state
  const searchInput = ref('');
  const advancedSearchLines = ref<AdvancedSearchLine[]>([]);
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

  const more = ref(false);
  const filterButton = ref([]);
  const isBrowse = ref(false);

  const ordering =
    ui.search?.ordering ||
    ([
      { value: 'asc', label: 'Ascending' },
      { value: 'desc', label: 'Descending' },
    ] as const);
  const defaultOrder = ordering[0];
  const selectedOrder = ref(defaultOrder);

  const fallbackSorting = { value: 'relevance', label: 'Relevance' };
  const sorting = ui.search?.sorting || [fallbackSorting];
  const defaultSorting = ui.search?.searchSorting || sorting[0] || fallbackSorting;
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
    searchInput.value = route.query.q?.toString() || '';

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

    if (route.query.a) {
      advancedSearchLines.value = JSON.parse(decodeURIComponent(route.query.a.toString()));
      advancedSearchEnabled.value = true;
    }

    zoomLevel.value = route.query.z ? Number.parseInt(route.query.z.toString(), 10) : mapConfig.zoom;

    boundingBox.value = route.query.bb
      ? JSON.parse(decodeURIComponent(route.query.bb.toString()))
      : mapConfig.boundingBox;
  };

  const syncStateToUrlAndNavigate = async () => {
    const query: { q?: string; f?: string; a?: string; z?: string; p?: string; bb?: string } = {};

    if (Object.keys(filters.value).length > 0) {
      query.f = encodeURIComponent(JSON.stringify(filters.value));
    }

    if (advancedSearchEnabled.value) {
      query.a = encodeURIComponent(JSON.stringify(advancedSearchLines.value));
      currentPage.value = 1;
    } else {
      query.q = searchInput.value ? searchInput.value.toString() : undefined;
    }

    if (isMap) {
      query.z = zoomLevel.value.toString();
      query.bb = encodeURIComponent(JSON.stringify(boundingBox.value));
    }

    await router.push({ path: isMap ? 'map' : 'search', query, replace: true });
  };

  const setSearchParams = (options: SetSearchParamsOptions) => {
    if (options.zoomLevel) {
      zoomLevel.value = options.zoomLevel;
    }

    if (options.boundingBox) {
      boundingBox.value = options.boundingBox;
    }

    if (options.advancedSearchLines) {
      advancedSearchLines.value = options.advancedSearchLines;
      syncStateToUrlAndNavigate();
    }

    if ('advancedSearchEnabled' in options) {
      advancedSearchEnabled.value = !!options.advancedSearchEnabled;
      if (advancedSearchEnabled.value) {
        searchInput.value = '';
      } else {
        advancedSearchLines.value = [blankAdvancedSearchLine];
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

  const search = async () => {
    filtersChanged.value = false;

    isLoading.value = true;

    try {
      const params: SearchParams = {
        query: advancedSearchEnabled.value ? advancedSearchLines.value.toString() : searchInput.value.toString(),
        searchType: advancedSearchEnabled.value ? 'advanced' : 'basic',
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
      if ('error' in results) {
        errorDialogText.value = results.error;
        isLoading.value = false;

        return;
      }

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

  const populateFacets = (newFacets: GetSearchResponse['facets']) => {
    const a: FacetType[] = [];
    const aggInfo = ui.aggregations;

    for (const facet of Object.keys(newFacets)) {
      const order = aggInfo.findIndex((a) => a.name === facet);
      if (order < 0) {
        continue;
      }

      // biome-ignore lint/style/noNonNullAssertion: impossible for it to not exist
      const info = aggInfo[order]!;
      const display = info.display;
      const name = info.name;
      const active = facets.value?.find((a) => a.name === facet)?.active || info.active;
      const help = info.help;
      a.push({
        // biome-ignore lint/style/noNonNullAssertion: impossible for it to not exist
        buckets: newFacets[facet]!,
        display: display || facet,
        order: order,
        name: name,
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

    searchInput.value = '';
    filters.value = {};

    advancedSearchLines.value = [blankAdvancedSearchLine];

    selectedOrder.value = defaultOrder;
    filterButton.value = [];
    isBrowse.value = false;
    currentPage.value = 1;
    filters.value = {};

    zoomLevel.value = mapConfig.zoom;
    boundingBox.value = mapConfig.boundingBox;

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

  const doWork = async () => {
    syncStateFromUrl();

    search();
  };

  watch(
    () => route.query,
    async () => {
      currentPage.value = 1;

      doWork();
    },
  );

  onMounted(() => doWork());

  syncStateFromUrl();

  return {
    advancedSearchEnabled,
    searchInput,
    advancedSearchLines,
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
    updateFilter,
    filtersChanged,
    clearFilter,
    clearFilters,
    resetSearch,
    sortResults,
    orderResults,
    updatePages,
    setSearchParams,
  };
};
