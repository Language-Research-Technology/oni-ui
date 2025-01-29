import esb from 'elastic-builder';

import { HTTPService } from './http';
import configuration from '../../configuration.json';

type MultiProps = {
  multi?: string;
  filters?: Record<string, string[]>;
  aggs?: Record<string, object>;
  sort?: string;
  order?: string;
  operation?: string;
  pageSize?: number;
  searchFrom?: number;
  searchType?: 'basic' | 'advanced';
};

const aggMap = {
  '_geohash.@id': 'geohash',
  '_memberOf.name.@value': 'memberOf',
  '_root.name.@value': 'root',
  '_mainCollection.name.@value': 'mainCollection',
  '_subCollection.name.@value': 'subCollection',
  'license.@id': 'licenseId',
  'license.name.@value': 'licenseName',
  '@type': 'type',
  'inLanguage.name.@value': 'inLanguage',
  'communicationMode.name.@value': 'communicationMode',
  'linguisticGenre.name.@value': 'linguisticGenre',
  'encodingFormat.@value': 'encodingFormat',
  'annotationType.@value': 'annotationType',
  '_parent.@id': 'parent',
  '_collectionStack.@id': 'collectionStack',
  'conformsTo.@id': 'conformsTo',
  '_isTopLevel.@value': 'isTopLevel',
  'description.@value': 'description',
  'name.@value': 'name',
  _text: 'text',
};

const aggMapReverse = Object.fromEntries(Object.entries(aggMap).map(([key, value]) => [value, key]));

export class ElasticService {
  #searchRoute: string;
  #indexRoute: string;
  #aggs: object;
  #highlightFields: object;
  #highlightConfig: object;
  #fields: object;

  constructor() {
    this.#searchRoute = '/search/index';
    this.#indexRoute = '/items';
    this.#aggs = this.prepareAggregations(configuration.ui.aggregations);
    this.#highlightFields = ['_text'];
    this.#highlightConfig = { max_analyzer_offset: 1000000 };
    this.#fields = configuration.ui.searchFields;
  }

  prepareAggregations(aggregations: typeof configuration.ui.aggregations) {
    const a: Record<string, { terms: { field: string; size: number } }> = {};
    for (const agg of aggregations) {
      const aggName = aggMapReverse[agg.name];
      a[aggName] = { terms: { field: `${aggName}.keyword`, size: 1000 } };
    }
    return a;
  }

  async multi<T>({ multi, searchType, filters, sort, order, operation, pageSize, searchFrom }: MultiProps) {
    const searchFields = this.#fields;
    let sorting: object;
    if (sort === 'relevance') {
      sorting = [
        {
          _score: {
            order: order,
          },
        },
      ];
    } else {
      sorting = [
        {
          _script: {
            type: 'number',
            order: order,
            script: {
              lang: 'painless',
              source: `doc['${sort ? aggMapReverse[sort] : '_isTopLevel.@value'}.keyword'].size() > 0 ? 1 : 0`,
            },
          },
        },
      ];
    }

    const query =
      searchType === 'advanced'
        ? this.disMaxQuery({ queryString: multi, filters })
        : this.boolQuery({
            searchQuery: multi,
            fields: searchFields,
            filters,
            operation,
          });

    const body = {
      query,
      sort: sorting,
      size: pageSize,
      from: searchFrom,
      track_total_hits: true,
      highlight: this.highlights(this.#highlightFields),
      aggs: this.#aggs,
    };

    return body;
  }

  boolQuery({ searchQuery, fields = {}, filters, operation }) {
    const filterTerms = this.termsQuery(filters);
    const searchQueryIsEmpty = !searchQuery;
    let boolQueryObj = {};
    if (searchQueryIsEmpty && filterTerms.length > 0) {
      boolQueryObj = esb.boolQuery().filter(filterTerms);
    } else if (!searchQueryIsEmpty && filterTerms.length > 0) {
      const multiFields = [];
      for (const [key, value] of Object.entries(fields)) {
        if (value.checked) {
          multiFields.push(key);
        }
      }
      const phraseQuery = esb.multiMatchQuery(multiFields, searchQuery).type('best_fields');
      boolQueryObj = switchFilter(operation, boolQueryObj, phraseQuery, filterTerms);
    } else if (!searchQueryIsEmpty && filterTerms.length <= 0) {
      const multiFields = [];
      for (const [key, value] of Object.entries(fields)) {
        if (value.checked) {
          multiFields.push(key);
        }
      }
      const phraseQuery = esb.multiMatchQuery(multiFields, searchQuery).type('best_fields');
      boolQueryObj = switchFilter(operation, boolQueryObj, phraseQuery, filterTerms);
    } else if (searchQueryIsEmpty && filterTerms.length <= 0) {
      boolQueryObj = esb.boolQuery().must(esb.matchAllQuery());
    }
    const esbQuery = esb.requestBodySearch().query(boolQueryObj);
    const query = esbQuery.toJSON().query;
    return query;
  }

  highlights(highlightFields) {
    const esbQuery = esb
      .requestBodySearch()
      .query(esb.matchQuery('not', 'important'))
      .highlight(
        esb
          .highlight()
          .numberOfFragments(3)
          .fragmentSize(200)
          .fields(highlightFields)
          .preTags('<mark class="font-bold">')
          .postTags('</mark>'),
      );

    let highlight = esbQuery.toJSON().highlight;
    highlight = { ...highlight, ...this.#highlightConfig };
    return highlight;
  }

  disMaxQuery({ queryString, filters }) {
    const filterTerms = this.termsQuery(filters);
    const boolQuery = esb.boolQuery();

    let convertedQueryString = queryString;
    // biome-ignore lint/complexity/noForEach: moo
    Object.entries(aggMapReverse).forEach(([key, value]) => {
      convertedQueryString = convertedQueryString.replace(new RegExp(key, 'g'), value);
    });
    boolQuery.must(esb.queryStringQuery(convertedQueryString));
    boolQuery.filter(filterTerms);
    boolQuery.minimumShouldMatch(0);

    const esbQuery = esb.requestBodySearch().query(boolQuery);
    const query = esbQuery.toJSON().query;

    return query;
  }

  termsQuery(filters = {}) {
    const filterTerms = [];
    if (Object.keys(filters).length !== 0) {
      for (const bucket of Object.keys(filters)) {
        if (filters[bucket].length > 0 || (filters[bucket]?.v && filters[bucket].v.length > 0)) {
          //TODO: send the type of field in the filters
          let field = '';
          let type;
          if (!filters[bucket]?.t) {
            field = `${aggMapReverse[bucket]}.keyword`;
          } else {
            type = filters[bucket]?.t;
            field = `${aggMapReverse[bucket]}.${type}`;
          }
          const values = filters[bucket]?.v || filters[bucket];
          filterTerms.push(esb.termsQuery(field, values));
        }
      }
    }
    return filterTerms;
  }

  // queryString(searchGroup) {
  //   let qS = '';
  //   searchGroup.forEach((sg, i) => {
  //     let lastOneSG = false;
  //     if (i + 1 === searchGroup.length) {
  //       lastOneSG = true;
  //     }
  //     if (sg.searchInput.length === 0) {
  //       sg.searchInput = '*';
  //     }
  //     if (sg.field === 'all_fields') {
  //       let qqq = '( ';
  //       Object.keys(this.#fields).map((f, index, keys) => {
  //         let lastOne = false;
  //         if (index + 1 === keys.length) {
  //           lastOne = true;
  //         }
  //         let qq = '';
  //         qq = String.raw`${f} : ${sg.searchInput} ${!lastOne ? 'OR' : ''} `;
  //         qqq += qq;
  //       });
  //       qS += String.raw`${qqq} ) ${!lastOneSG ? sg.operation : ''} `;
  //     } else {
  //       qS += String.raw` ( ${sg.field}: ${sg.searchInput} ) ${!lastOneSG ? sg.operation : ''}`;
  //     }
  //   });
  //   return qS;
  // }

  async map({
    init = true,
    boundingBox,
    precision = 5,
    multi,
    searchFields,
    filters,
    operation,
    pageSize,
    searchFrom,
  }) {
    const httpService = new HTTPService();
    const route = this.#searchRoute + this.#indexRoute;
    const body = {};
    const geoAggs = esb.geoHashGridAggregation('_geohash', '_centroid').precision(precision);
    let topRight = {};
    let bottomLeft = {};
    let geoQuery = {};
    if (init) {
      topRight = esb.geoPoint().lat(90).lon(180);
      bottomLeft = esb.geoPoint().lat(-90).lon(-180);
      geoQuery = esb.geoBoundingBoxQuery().field('_centroid').topRight(topRight).bottomLeft(bottomLeft);
    } else {
      let tR = boundingBox.topRight;
      tR = fixMalformedCoordinates(tR);
      topRight = esb.geoPoint().lat(tR.lat).lon(tR.lon);
      let bL = boundingBox.bottomLeft;
      bL = fixMalformedCoordinates(bL);
      bottomLeft = esb.geoPoint().lat(bL.lat).lon(bL.lon);
      geoQuery = esb
        .geoBoundingBoxQuery()
        .field('_centroid')
        .topRight(topRight)
        .bottomLeft(bottomLeft)
        .validationMethod('COERCE');
    }
    const aggs = geoAggs.toJSON();

    body.aggs = { ...aggs, ...this.#aggs };
    const geoQueryJson = geoQuery.toJSON();
    const geoBoundingBox = geoQueryJson.geo_bounding_box;
    const boolQuery = this.boolQuery({
      searchQuery: multi,
      fields: searchFields,
      filters,
      operation,
    });
    if (!boolQuery.bool.filter) boolQuery.bool.filter = {};
    if (boolQuery.bool.filter?.length) {
      //if array
      boolQuery.bool.must = boolQuery.bool.filter;
    } else if (boolQuery.bool.filter.terms) {
      boolQuery.bool.must = { terms: boolQuery.bool.filter.terms };
    }
    boolQuery.bool.filter = { geo_bounding_box: geoBoundingBox };
    body.query = boolQuery;
    body.size = pageSize;
    body.from = searchFrom;
    body.track_total_hits = true;
    const response = await httpService.post({ route, body });
    if (response.status !== 200) {
      throw new Error(response.statusText);
    }
    const results = await response.json();
    return results;
  }
}

function switchFilter(operation, _boolQueryObj, phraseQuery, filterTerms) {
  switch (operation) {
    case 'must':
      return esb.boolQuery().must(phraseQuery).filter(filterTerms);
    case 'should':
      return esb.boolQuery().should(phraseQuery).filter(filterTerms);
    case 'must_not':
      return esb.boolQuery().mustNot(phraseQuery).filter(filterTerms);
    default:
      return esb.boolQuery().should(phraseQuery).filter(filterTerms);
  }
}

// https://opensearch.org/docs/latest/field-types/supported-field-types/geo-point/
// Valid values for latitude are [-90, 90]. Valid values for longitude are [-180, 180].
// TODO: Test send ignore_malformed=true
function fixMalformedCoordinates(coord) {
  if (coord.lon) {
    coord.lon = ((coord.lon + 180) % 360) - 180;
  }
  if (coord.lat) {
    coord.lat = ((coord.lat + 90) % 360) - 90;
  }
  return coord;
}
