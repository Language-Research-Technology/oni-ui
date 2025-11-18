import { useGtm } from '@gtm-support/vue-gtm';
import { inject, onMounted, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { ui } from '@/configuration';
import type { ApiService, EntityType, GetSearchResponse, SearchParams } from '@/services/api';

const { mapConfig, searchFields } = ui;

type HierarchicalBucket = {
  name: string;
  count: number;
  children: Array<{ name: string; count: number }>;
};

export type FacetType = {
  buckets: Array<{ name: string; count: number }> | HierarchicalBucket[];
  display: string;
  order: number;
  name: string;
  active: boolean;
  help?: string;
  type?: 'standard' | 'hierarchical';
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

export const ordering = [
  { value: 'asc', label: 'Ascending' },
  { value: 'desc', label: 'Descending' },
] as const;

export const generateQueryString = (lines: AdvancedSearchLine[]) => {
  let qS = '';

  lines.forEach((sg, i) => {
    let lastOneSG = false;
    if (i + 1 === lines.length) {
      lastOneSG = true;
    }

    if (sg.field === 'all_fields') {
      let qqq = '( ';
      Object.keys(searchFields).forEach((f, index, keys) => {
        let lastOne = false;
        if (index + 1 === keys.length) {
          lastOne = true;
        }
        let qq = '';
        qq = `${f} : ${sg.searchInput} ${!lastOne ? 'OR' : ''} `;
        qqq += qq;
      });
      qS += `${qqq} ) ${!lastOneSG ? sg.operation : ''} `;
    } else {
      qS += ` ( ${sg.field}: ${sg.searchInput} ) ${!lastOneSG ? sg.operation : ''}`;
    }
  });

  return qS;
};

export const useSearch = (searchType: 'list' | 'map') => {
  const router = useRouter();
  const route = useRoute();
  const gtm = useGtm();

  const api = inject<ApiService>('api');
  if (!api) {
    throw new Error('API instance not provided');
  }

  const isMap = searchType === 'map';

  // Search state
  const searchInput = ref('');
  const advancedSearchLines = ref<AdvancedSearchLine[]>([{ ...blankAdvancedSearchLine }]);
  const advancedSearchEnabled = ref(false);
  const filters = ref<Record<string, string[]>>({});

  // Pagination
  const pageSize = ref(10);
  const currentPage = ref(1);
  const totals = ref(0);

  // Other
  const facets = ref<FacetType[]>();
  const isLoading = ref(false);
  const filtersChanged = ref(false);
  const errorDialogText = ref<string | undefined>();
  const entities = ref<EntityType[]>([]);

  const more = ref(false);
  const filterButton = ref([]);
  const isBrowse = ref(false);

  const defaultOrder = ordering.find((o) => o.value === ui.search?.default.ordering) || ordering[0];
  const selectedOrder = ref(defaultOrder);

  const sorting = ui.search?.sorting || [{ value: 'relevance', label: 'Relevance' }];
  const defaultSorting = sorting.find((s) => s.value === ui.search?.default.sorting) || sorting[0];
  if (!defaultSorting) {
    throw new Error('No default sorting option found');
  }
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
      // TODO: We should really use zod to validate
      advancedSearchLines.value = JSON.parse(decodeURIComponent(route.query.a.toString())) as AdvancedSearchLine[];
      advancedSearchEnabled.value = true;
    }

    zoomLevel.value = route.query.z ? Number.parseInt(route.query.z.toString(), 10) : mapConfig.zoom;

    boundingBox.value = route.query.bb
      ? (JSON.parse(decodeURIComponent(route.query.bb.toString())) as typeof mapConfig.boundingBox)
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

    const query = advancedSearchEnabled.value
      ? generateQueryString(
          advancedSearchLines.value.map((l) => {
            if (l.searchInput === '') {
              l.searchInput = '*';
            }
            return l;
          }),
        )
      : searchInput.value.toString();

    try {
      const params: SearchParams = {
        query,
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

  const aggregateIntoDecades = (yearBuckets: Array<{ name: string; count: number }>): HierarchicalBucket[] => {
    const decadeMap = new Map<string, { count: number; years: Array<{ name: string; count: number }> }>();

    for (const bucket of yearBuckets) {
      // Parse the timestamp (in seconds since epoch)
      const timestamp = Number.parseInt(bucket.name, 10);

      // Skip invalid timestamps
      if (Number.isNaN(timestamp)) {
        continue;
      }

      // Convert timestamp (seconds) to milliseconds and create Date object
      const date = new Date(timestamp);
      const year = date.getFullYear();

      // Skip invalid years
      if (Number.isNaN(year)) {
        continue;
      }

      const decadeStart = Math.floor(year / 10) * 10;
      const decadeName = `${decadeStart}s`;

      const decade = decadeMap.get(decadeName);
      const yearBucket = { name: String(year), count: bucket.count };

      if (decade) {
        decade.count += bucket.count;
        decade.years.push(yearBucket);
      } else {
        decadeMap.set(decadeName, { count: bucket.count, years: [yearBucket] });
      }
    }

    const hierarchicalBuckets: HierarchicalBucket[] = [];

    for (const [decadeName, data] of decadeMap.entries()) {
      hierarchicalBuckets.push({
        name: decadeName,
        count: data.count,
        children: data.years.sort((a, b) => Number.parseInt(a.name, 10) - Number.parseInt(b.name, 10)),
      });
    }

    return hierarchicalBuckets;
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
      const help = info.help;
      const type = info.type;
      const active = !!filters.value[facet] && filters.value[facet].length > 0;

      // biome-ignore lint/style/noNonNullAssertion: impossible for it to not exist
      const rawBuckets = newFacets[facet]!;

      // Process date histogram facets into hierarchical decade structure
      const buckets = type === 'date_histogram' ? aggregateIntoDecades(rawBuckets) : rawBuckets;

      a.push({
        buckets,
        display: display || facet,
        order,
        name,
        help,
        active,
        type: type === 'date_histogram' ? 'hierarchical' : 'standard',
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
    sorting,
    facets,
    geohashGrid,
    searchFields,
    entities,
    filters,
    isLoading,
    totals,
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
