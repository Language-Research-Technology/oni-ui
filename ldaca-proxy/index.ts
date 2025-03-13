import { pipeline } from 'node:stream/promises';

import express from 'express';

const app = express();

import configuration from '../configuration.json';
import { ElasticService } from './elastic';

const es = new ElasticService();

app.get('/ldaca/entities', async (req, res) => {
  const queryString = URL.parse(`http://dummy${req.url}`)?.search || '';
  const url = 'https://data.ldaca.edu.au/api/objects' + queryString;
  const response = await fetch(url, { redirect: 'follow' });
  if (!response.ok) {
    const body = response.text();
    res.status(response.status).send(body);

    return;
  }

  // @ts-expect-error Ignore type errors
  const { total, data } = await response.json();

  // @ts-expect-error Ignore type errors
  const entities = data.map(({ crateId, locked, objectRoot, record, url, ...rest }) => ({
    id: crateId,
    ...rest,
  }));
  const result = {
    total,
    entities,
  };

  res.json(result);
});

const synthesise = async (id: string) => {
  const body = await es.multi({
    multi: '*',
    searchType: 'advanced',
    filters: { '@id': [id] },
    pageSize: 10,
    searchFrom: 0,
  });

  const response = await fetch(url, {
    method: 'POST',
    body: JSON.stringify(body),
  });

  // biome-ignore lint/suspicious/noExplicitAny: foo
  const result = (await response.json()) as any;
  if (result.hits.hits.length !== 1) {
    console.error('Synthesise failed: more than 1 hit');
    return [404, null];
  }

  const hit = result.hits.hits[0];

  const memberOf = hit._source._memberOf[0]['@id'];

  const parentUrl = `https://data.ldaca.edu.au/api/object/meta?id=${encodeURIComponent(memberOf)}`;
  const response2 = await fetch(parentUrl);

  if (response2.status === 404) {
    console.error('Synthesise failed: no parent crate');
    return [404, null];
  }

  const rocrateRaw = await response2.text();
  const rocrate = JSON.parse(rocrateRaw);

  const metadata = rocrate['@graph'].find((item: any) => item['@id'] === 'ro-crate-metadata.json');
  const parentId = metadata.about['@id'];
  metadata.about['@id'] = id;

  const parent = rocrate['@graph'].find((item: any) => item['@id'] === parentId);
  const child = rocrate['@graph'].find((item: any) => item['@id'] === id);
  child['license'] = parent['license'];
  child['memberOf'] = { '@id': parentId, name: parent['name'] };

  return [200, rocrate];
};

app.get('/ldaca/entity/:id/file/:path', async (req, res) => {
  const idUrl = new URL(req.params.id);
  idUrl.pathname = '';
  const url = `https://data.ldaca.edu.au/api/object/${encodeURIComponent(idUrl.toString())}/${encodeURIComponent(req.params.path)}`;
  const response = await fetch(url);

  // response.headers.forEach((value, name) => {
  //   res.setHeader(name, value);
  // });

  res.status(response.status);

  if (!response.body) {
    res.status(response.status).json({ error: `Failed to fetch: ${response.statusText}` });

    return;
  }

  await pipeline(response.body, res);
});

app.get('/ldaca/entity/:id', async (req, res) => {
  const queryString = (URL.parse(`http://dummy${req.url}`)?.search || '').replace(/^\?/, '&');
  const url = `https://data.ldaca.edu.au/api/object/meta?id=${encodeURIComponent(req.params.id)}${queryString}`;
  const response = await fetch(url);

  let rocrate: any;
  let status = response.status;

  if (response.status === 404) {
    const result = await synthesise(req.params.id);
    status = result[0];
    rocrate = result[1];
  } else {
    rocrate = JSON.parse(await response.text());
  }

  const metadata = rocrate['@graph'].find((item: any) => item['@id'] === 'ro-crate-metadata.json');
  const object = rocrate['@graph'].find((item: any) => item['@id'] === metadata.about['@id']);
  if (object.hasOwnProperty('hasPart')) {
    for (const partId of object.hasPart) {
      const part = rocrate['@graph'].find((item: any) => item['@id'] === partId['@id']);
      const query = partId['@id'].split('?')[1];
      const searchParams = new URLSearchParams(query);
      part.filename = searchParams.get('path'); // ?.replace(/\//g, '_');
      part['@id'] = searchParams.get('id') + '/' + searchParams.get('path');
      partId['@id'] = part['@id'];
    }
  }

  res.status(status).send(rocrate);
});

app.get('/ldaca/oauth/:provider/login', async (req, res) => {
  const url = `https://data.ldaca.edu.au/api/oauth/${req.params.provider}/login`;
  console.log('🪚 url:', JSON.stringify(url, null, 2));
  const response = await fetch(url);

  res.status(response.status);

  if (!response.body) {
    res.status(response.status).json({ error: `Failed to fetch: ${response.statusText}` });

    return;
  }

  const body = await response.text();

  res.status(response.status).send(body);
});

app.post('/ldaca/oauth/:provider/code', async (req, res) => {
  const url = `https://data.ldaca.edu.au/api/oauth/${req.params.provider}/code`;

  let data = '';
  req.setEncoding('utf8');
  req.on('data', (chunk) => {
    data += chunk;
  });

  req.on('end', async () => {
    const response = await fetch(url, {
      method: 'POST',
      body: data,
    });

    if (!response.body) {
      res.status(response.status).json({ error: `Failed to fetch: ${response.statusText}` });

      return;
    }

    res.status(response.status);
    await pipeline(response.body, res);
  });
});

type EntityType = {
  id: string;
  name: string;
  description: string;
  conformsTo: 'https://w3id.org/ldac/profile#Collection' | 'https://w3id.org/ldac/profile#Object';
  recordType: Array<'DataSet' | 'RepositoryCollection' | 'RepositoryObject' | 'File'>;
  memberOf: string;
  root: string;
  createdAt: string;
  updatedAt: string;
  extra: {
    collectionCount: number;
    objectCount: number;
    subCollectionCount: number;
    fileCount: number;
    language: Array<string>;
    accessControl: 'Public' | 'Restricted';
    communicationMode: 'Song' | 'Spoken';
    mediaType: Array<string>;
  };
};

type GetSearchResponse = {
  total: number;
  searchTime: number;
  entities: Array<EntityType & { searchExtra: { score: number; highlight: string[] } }>;
  facets: Record<string, { name: string; count: number }[]>;
};

const aggMap: Record<string, string> = {
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

const url = 'https://data.ldaca.edu.au/api/search/index/items';

const filter = async (filters: Record<string, string[]>) => {
  const body = await es.multi({
    filters: filters,
    sort: 'relevance',
    order: 'desc',
  });

  const response = await fetch(url, {
    method: 'POST',
    body: JSON.stringify(body),
  });

  // biome-ignore lint/suspicious/noExplicitAny: foo
  const result = (await response.json()) as any;

  if (result.hits.hits.length > 0) {
    return {
      data: result.hits.hits,
      aggregations: result.aggregations,
      total: result.hits.total.value,
    };
  }
};

app.post('/ldaca/search', async (req, res) => {
  let data = '';
  req.setEncoding('utf8');
  req.on('data', (chunk) => {
    data += chunk;
  });

  req.on('end', async () => {
    const params = JSON.parse(data);
    const body = await es.multi({
      multi: params.query,
      searchType: params.searchType,
      filters: params.filters,
      sort: params.sort,
      order: params.order,
      pageSize: params.limit,
      searchFrom: params.offset,
    });

    const response = await fetch(url, {
      method: 'POST',
      body: JSON.stringify(body),
    });

    // biome-ignore lint/suspicious/noExplicitAny: foo
    const result = (await response.json()) as any;

    const conformsTo = configuration.ui.conformsTo;

    const entities = await Promise.all(
      // biome-ignore lint/suspicious/noExplicitAny: foo
      result.hits.hits.map(async (hit: any) => {
        let summaries;
        let subCollections;
        let members;

        const id = hit._source['@id'];
        const typem = hit._source?.['@type'];

        if (typem.includes('RepositoryCollection')) {
          subCollections = await filter({ memberOf: [id], conformsTo: [conformsTo.collection] });

          members = await filter({ collectionStack: [id], conformsTo: [conformsTo.object] });

          summaries = await filter({ collectionStack: [id] });
        }

        if (typem.includes('RepositoryObject')) {
          summaries = await filter({ parent: [id] });
        }

        // Get the buckets to extract one value: File counts
        let fileCount: { doc_count: number } | undefined;
        const buckets: Array<any> = summaries?.aggregations?.['@type']?.buckets;
        if (buckets) {
          fileCount = buckets.find((obj) => obj.key === 'File');
        }

        return {
          id: hit._source['@id'],
          name: hit._source.name?.[0]['@value'],
          description: hit._source.description?.[0]['@value'],
          conformsTo: hit._source.conformsTo?.[0]['@id'],
          recordType: hit._source?.['@type'],
          memberOf: hit._source._memberOf?.[0]['@id'],
          root: hit._source._root?.[0]['@id'],
          createdAt: new Date(),
          updatedAt: new Date(),
          extra: {
            subCollectionCount: subCollections?.total,
            objectCount: members?.total,
            fileCount: fileCount?.doc_count,
            accessControl: 'Public',
            // @ts-ignore
            communicationMode: summaries?.aggregations['communicationMode.name.@value'].buckets.map(({ key }) => key),
            // @ts-ignore
            mediaType: summaries?.aggregations['encodingFormat.@value'].buckets.map(({ key }) => key),
          },
          searchExtra: {
            score: hit._score,
            highlight: hit.highlight,
          },
        };
      }),
    );

    const facets: Record<string, { name: string; count: number }[]> = {};

    for (const key in result.aggregations) {
      const values = result.aggregations[key].buckets.map((bucket: { key: string; doc_count: number }) => ({
        name: bucket.key,
        count: bucket.doc_count,
      }));

      const name = aggMap[key];

      facets[name] = values;
    }

    const converted: GetSearchResponse = {
      total: result.hits.total.value,
      searchTime: result.took,
      entities,
      facets,
    };

    res.status(response.status).send(JSON.stringify(converted, null, 2));
  });
});

app.post('/api/search/index/items', async (req, res) => {
  const url = 'https://data.ldaca.edu.au/api/search/index/items';

  let data = '';
  req.setEncoding('utf8');
  req.on('data', (chunk) => {
    data += chunk;
  });

  req.on('end', async () => {
    const response = await fetch(url, {
      method: 'POST',
      // @ts-expect-error Ignore type errors
      headers: req.headers,
      body: data,
    });

    const body = await response.text();
    res.status(response.status).send(body);
  });
});

export const ldacaProxy = app;
