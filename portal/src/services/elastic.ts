import esb from 'elastic-builder';
import { first, isEmpty } from 'lodash';

import { HTTPService } from '@/services/http';
import { configuration } from '@/configuration';

type MultiSearch<T> = {
  hits: {
    hits: T[];
    total: { value: number };
  };
  aggregations: Record<string, { key: string; doc_count: number }>;
};

type MultiProps = {
  multi?: string;
  filters?: Record<string, string[]>;
  aggs?: Record<string, object>;
  searchFields?: Record<string, { checked: boolean }>;
  sort?: string;
  order?: string;
  operation?: string;
  pageSize?: number;
  searchFrom?: number;
  queries?: Record<string, string>;
  sortField?: string;
};

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
    this.#highlightFields = configuration.ui.searchHighlights;
    this.#highlightConfig = configuration.ui.highlight || {};
    this.#fields = configuration.ui.searchFields;
  }

  prepareAggregations(aggregations) {
    const a = {};
    for (const agg of aggregations) {
      a[agg.name] = { terms: { field: agg.field, size: 1000 } };
    }
    return a;
  }

  async multi<T>({
    multi,
    filters,
    aggs,
    searchFields,
    sort,
    order,
    operation,
    pageSize,
    searchFrom,
    queries,
    sortField,
  }: MultiProps) {
    try {
      const httpService = new HTTPService();
      const route = this.#searchRoute + this.#indexRoute;

      let sorting: object;
      if (sort === 'relevance') {
        sorting = [
          {
            _score: {
              order: order,
            },
          },
        ];
      } else if (sortField) {
        const sortByKeyword: Record<string, object> = {};
        sortByKeyword[sortField] = { order: order };
        sorting = [sortByKeyword];
      } else {
        sorting = [
          {
            _script: {
              type: 'number',
              order: order,
              script: {
                lang: 'painless',
                source: `doc['${sort}'].size() > 0 ? 1 : 0`,
              },
            },
          },
        ];
      }

      const query = queries
        ? this.disMaxQuery({ queries, filters })
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
        aggs: aggs || this.#aggs,
      };

      const response = await httpService.post(route, body);

      if (response.status !== 200) {
        const error = await response.json();
        const msg = `Query Error: ${error?.message}` || 'There was an error with your query';
        throw new Error(msg);
      }

      const results = (await response.json()) as MultiSearch<T>;
      // console.log('🪚 results:', JSON.stringify(results, null, 2));

      return {
        hits: results.hits.hits,
        total: results.hits.total.value,
        aggregations: results.aggregations,
      };
    } catch (e) {
      const err = e as Error;
      throw new Error(err.message);
    }
  }

  async single({ index, id, _crateId, _id }) {
    const httpService = new HTTPService({ router: this.router, loginPath: '/login' });
    let route = this.#searchRoute + this.#indexRoute;
    if (index) {
      route = `${this.#searchRoute}/${index}`;
    }
    const body = {
      aggs: this.#aggs, // maybe we dont need to send aggregations
      query: {},
    };
    if (_id) {
      body.query = {
        match: {
          _id: decodeURIComponent(_id),
        },
      };
    } else {
      body.query = {
        dis_max: {
          queries: [
            { match: { '@id': decodeURIComponent(id) } },
            { match: { _crateId: decodeURIComponent(_crateId) } },
          ],
        },
      };
    }

    const response = await httpService.post({ route, body });
    if (response.status !== 200) {
      throw new Error(response.statusText);
    }
    const results = await response.json();
    return first(results?.hits?.hits);
  }

  boolQuery({ searchQuery, fields, filters, operation }) {
    const filterTerms = this.termsQuery(filters);
    let boolQueryObj = {};
    if (isEmpty(searchQuery) && filterTerms.length > 0) {
      boolQueryObj = esb.boolQuery().filter(filterTerms);
    } else if (!isEmpty(searchQuery) && filterTerms.length > 0) {
      const multiFields = [];
      for (const [key, value] of Object.entries(fields)) {
        if (value.checked) {
          multiFields.push(key);
        }
      }
      const phraseQuery = esb.multiMatchQuery(multiFields, searchQuery).type('best_fields');
      boolQueryObj = switchFilter(operation, boolQueryObj, phraseQuery, filterTerms);
    } else if (!isEmpty(searchQuery) && filterTerms.length <= 0) {
      const multiFields = [];
      for (const [key, value] of Object.entries(fields)) {
        if (value.checked) {
          multiFields.push(key);
        }
      }
      const phraseQuery = esb.multiMatchQuery(multiFields, searchQuery).type('best_fields');
      boolQueryObj = switchFilter(operation, boolQueryObj, phraseQuery, filterTerms);
    } else if (isEmpty(searchQuery) && filterTerms.length <= 0) {
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

  disMaxQuery({ queries, filters }) {
    const filterTerms = this.termsQuery(filters);
    const mustDMQueries = [];
    const mustBoolQueries = [];
    const shouldDMQueries = [];
    const shouldBoolQueries = [];
    const mustNotDMQueries = [];
    const mustNotBoolQueries = [];
    const boolQuery = esb.boolQuery();
    if (queries.queryString) {
      boolQuery.must(esb.queryStringQuery(queries.queryString));
    } else {
      //Note: this code below is never used. Delete
      for (const q of queries) {
        if (q.operation === 'must') {
          if (q.multiField) {
            mustDMQueries.push(esb.multiMatchQuery(q.fields, q.query).operator('or').type(q.type));
          } else {
            let b = esb.matchQuery(q.fields, q.query);
            if (q.type === 'phrase_prefix') {
              b = esb.matchPhrasePrefixQuery(q.fields, q.query);
            }
            if (q.type === 'wildcard') {
              b = esb.wildcardQuery(q.fields, q.query);
            }
            if (q.type === 'regex') {
              b = esb.regexpQuery(q.fields, q.query).caseInsensitive(true);
            }
            mustBoolQueries.push(esb.boolQuery().must(b));
          }
        }
        if (q.operation === 'should') {
          if (q.multiField) {
            shouldDMQueries.push(esb.multiMatchQuery(q.fields, q.query).operator('or').type(q.type));
          } else {
            let b = esb.matchQuery(q.fields, q.query);
            if (q.type === 'phrase_prefix') {
              b = esb.matchPhrasePrefixQuery(q.fields, q.query);
            }
            if (q.type === 'wildcard') {
              b = esb.wildcardQuery(q.fields, q.query);
            }
            if (q.type === 'regex') {
              b = esb.regexpQuery(q.fields, q.query).caseInsensitive(true);
            }
            shouldBoolQueries.push(esb.boolQuery().must(b));
          }
        }
        if (q.operation === 'must_not') {
          if (q.multiField) {
            mustNotDMQueries.push(esb.multiMatchQuery(q.fields, q.query).operator('or').type(q.type));
          } else {
            let b = esb.matchQuery(q.fields, q.query);
            if (q.type === 'phrase_prefix') {
              b = esb.matchPhrasePrefixQuery(q.fields, q.query);
            }
            if (q.type === 'wildcard') {
              b = esb.wildcardQuery(q.fields, q.query);
            }
            if (q.type === 'regex') {
              b = esb.regexpQuery(q.fields, q.query).caseInsensitive(true);
            }
            mustNotBoolQueries.push(esb.boolQuery().must(b));
          }
        }
      }
      if (mustDMQueries.length > 0) {
        boolQuery.must(esb.disMaxQuery().queries(mustDMQueries));
      }
      if (mustBoolQueries.length > 0) {
        boolQuery.must(mustBoolQueries);
      }
      if (shouldDMQueries.length > 0) {
        boolQuery.should(esb.disMaxQuery().queries(shouldDMQueries));
      }
      if (shouldBoolQueries.length > 0) {
        boolQuery.should(shouldBoolQueries);
      }
      if (mustNotDMQueries.length > 0) {
        boolQuery.mustNot(esb.disMaxQuery().queries(mustNotDMQueries));
      }
      if (mustNotBoolQueries.length > 0) {
        boolQuery.mustNot(mustNotBoolQueries);
      }
    }
    boolQuery.filter(filterTerms);
    boolQuery.minimumShouldMatch(0);
    const esbQuery = esb.requestBodySearch().query(boolQuery);
    const query = esbQuery.toJSON().query;
    return query;
  }

  termsQuery(filters) {
    const filterTerms = [];
    if (!isEmpty(filters)) {
      for (const bucket of Object.keys(filters)) {
        if (filters[bucket].length > 0 || (filters[bucket]?.v && filters[bucket].v.length > 0)) {
          //TODO: send the type of field in the filters
          let field = '';
          let type;
          if (!filters[bucket]?.t) {
            field = bucket.concat('.keyword');
          } else {
            type = filters[bucket]?.t;
            field = bucket.concat(`.${type}`);
          }
          const values = filters[bucket]?.v || filters[bucket];
          filterTerms.push(esb.termsQuery(field, values));
        }
      }
    }
    return filterTerms;
  }

  queryString(searchGroup) {
    let qS = '';
    searchGroup.forEach((sg, i) => {
      let lastOneSG = false;
      if (i + 1 === searchGroup.length) {
        lastOneSG = true;
      }
      if (isEmpty(sg.searchInput)) {
        sg.searchInput = '*';
      }
      if (sg.field === 'all_fields') {
        let qqq = '( ';
        Object.keys(this.#fields).map((f, index, keys) => {
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
  }

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
    console.log(JSON.stringify(body));
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
