import * as crypto from 'node:crypto';
import { pipeline } from 'node:stream/promises';
import cookieParser from 'cookie-parser';
import express, { type Express, type Request } from 'express';
import jwt from 'jsonwebtoken';
import morgan from 'morgan';

const app = express();

app.use(morgan('combined'));
app.use(cookieParser());

import configuration from '../src/configuration.json';
import { ElasticService } from './elastic';

const es = new ElasticService();

const baseUrl = 'https://data-uat.ldaca.edu.au';

const LICENSES: Record<string, string> = {
  'https://language-research-technology.github.io/qa/licenses/farms-to-freeways/all/v1/':
    'https://test.cadre.ada.edu.au/catalogue/application?id=https://language-research-technology.github.io/qa/licenses/farms-to-freeways/all/v1/',
  'https://language-research-technology.github.io/qa/licenses/ice-aus/login/v1/':
    'https://test.cadre.ada.edu.au/catalogue/application?id=XX',
  'https://language-research-technology.github.io/qa/licenses/ausESL/all/v1/':
    'https://test.cadre.ada.edu.au/catalogue/application?id=XX',
  '#PLACEHOLDER-License': 'https://test.cadre.ada.edu.au/catalogue/application?id=XX',
  'https://www.ldaca.edu.au/licenses/holmer-fieldnotes/placeholder/all/v1/':
    'https://test.cadre.ada.edu.au/catalogue/application?id=https://www.ldaca.edu.au/licenses/holmer-fieldnotes/placeholder/all/v1/',
  'https://www.ldaca.edu.au/licenses/sydney-speaks/license-a/all/v1/':
    'https://test.cadre.ada.edu.au/catalogue/application?id=https://www.ldaca.edu.au/licenses/sydney-speaks/license-a/all/v1/',
  'https://www.ldaca.edu.au/licenses/sydney-speaks/license-b/all/v1/':
    'https://test.cadre.ada.edu.au/catalogue/application?id=https://www.ldaca.edu.au/licenses/sydney-speaks/license-b/all/v1/',
  'https://www.ldaca.edu.au/licenses/ausesl/transcriptions-audio/all/v1/':
    'https://test.cadre.ada.edu.au/catalogue/application?id=https://www.ldaca.edu.au/licenses/ausesl/transcriptions-audio/all/v1/',
  'https://language-research-technology.github.io/qa/licenses/udhr/auto/v1/':
    'https://test.cadre.ada.edu.au/catalogue/application?id=https://language-research-technology.github.io/qa/licenses/udhr/auto/v1/',
  'https://language-research-technology.github.io/qa/licenses/udhr/manual/v1/':
    'https://test.cadre.ada.edu.au/catalogue/application?id=https://language-research-technology.github.io/qa/licenses/udhr/manual/v1/',
  'https://language-research-technology.github.io/qa/licenses/udhr/license1/v1/':
    'https://test.cadre.ada.edu.au/catalogue/application?id=https://language-research-technology.github.io/qa/licenses/udhr/license1/v1/',
  'https://language-research-technology.github.io/qa/licenses/udhr/license2/v1/':
    'https://test.cadre.ada.edu.au/catalogue/application?id=https://language-research-technology.github.io/qa/licenses/udhr/license2/v1/',
  'https://language-research-technology.github.io/qa/licenses/udhr/license3/v1/':
    'https://test.cadre.ada.edu.au/catalogue/application?id=https://language-research-technology.github.io/qa/licenses/udhr/license3/v1/',
  'https://language-research-technology.github.io/qa/licenses/udhr/license4/v1/':
    'https://test.cadre.ada.edu.au/catalogue/application?id=https://language-research-technology.github.io/qa/licenses/udhr/license4/v1/',
};

const getMemberships = async (token: string) => {
  if (!token) {
    return [];
  }

  // const response = await fetch(`${baseUrl}/api/auth/memberships`, {
  const response = await fetch(`${baseUrl}/api/user/memberships`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (response.status !== 200) {
    return [];
  }

  const membershipsStatus = (await response.json()) as { memberships: { id: string; userId: string; group: string }[] };

  if (!membershipsStatus || !membershipsStatus.memberships) {
    return [];
  }

  return membershipsStatus.memberships.map(({ group }) => group).filter(Boolean);
};

const getExtra = async (id: string, entityType: string, token: string) => {
  let summaries: Awaited<ReturnType<typeof filter>>;
  let subCollections: Awaited<ReturnType<typeof filter>>;
  let members: Awaited<ReturnType<typeof filter>>;

  const conformsTo = configuration.ui.conformsTo;

  if (entityType === 'http://pcdm.org/models#Collection') {
    subCollections = await filter({ memberOf: [id], conformsTo: [conformsTo.collection] });

    members = await filter({ collectionStack: [id], conformsTo: [conformsTo.object] });

    summaries = await filter({ collectionStack: [id] });
  }

  if (entityType === 'http://pcdm.org/models#Object') {
    summaries = await filter({ parent: [id] });
  }

  // Get the buckets to extract one value: File counts
  let fileCount: { doc_count: number } | undefined;
  // biome-ignore lint/suspicious/noExplicitAny: foo
  const buckets: Array<any> = summaries?.aggregations?.['@type']?.buckets;
  if (buckets) {
    fileCount = buckets.find((obj) => obj.key === 'File');
  }

  const memberships = await getMemberships(token);

  const us = await filter({ '@id': [id] });
  if (!us) {
    throw new Error('Failed to get data for the current entity');
  }

  const access = us?.data?.[0]?._source?._access;
  if (!access) {
    throw new Error('Failed to get access for the current entity');
  }

  const extraAccess = 'group' in access ? !!memberships.includes(access.group) : access.hasAccess;

  const extra = {
    counts: {
      subCollections: subCollections?.total,
      objects: members?.total,
      files: fileCount?.doc_count,
    },
    accessControl: 'Public',
    access: {
      metadata: true,
      content: extraAccess,
    },
    // @ts-expect-error
    communicationMode: summaries?.aggregations['communicationMode.name.@value'].buckets.map(({ key }) => key),
    // @ts-expect-error
    mediaType: summaries?.aggregations['encodingFormat.@value'].buckets.map(({ key }) => key),
    // @ts-expect-error
    language: summaries?.aggregations['inLanguage.name.@value'].buckets.map(({ key }) => key),
  };

  const enrollmenrUrl = LICENSES[access.group];
  if (enrollmenrUrl) {
    // @ts-expect-error
    extra.access.contentAuthorizationUrl = enrollmenrUrl;
  }

  return extra;
};

const synthesise = async (id: string) => {
  const body = await es.multi({
    multi: '*',
    searchType: 'advanced',
    filters: { '@id': [id] },
    pageSize: 10,
    searchFrom: 0,
  });

  const response = await fetch(searchUrl, {
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

  const parentUrl = `${baseUrl}/api/object/meta?id=${encodeURIComponent(memberOf)}`;
  const response2 = await fetch(parentUrl);

  if (response2.status === 404) {
    console.error('Synthesise failed: no parent crate');
    return [404, null];
  }

  const rocrateRaw = await response2.text();
  const rocrate = JSON.parse(rocrateRaw);

  // biome-ignore lint/suspicious/noExplicitAny: foo
  const metadata = rocrate['@graph'].find((item: any) => item['@id'] === 'ro-crate-metadata.json');
  const parentId = metadata.about['@id'];
  metadata.about['@id'] = id;

  // biome-ignore lint/suspicious/noExplicitAny: foo
  const parent = rocrate['@graph'].find((item: any) => item['@id'] === parentId);
  // biome-ignore lint/suspicious/noExplicitAny: foo
  const child = rocrate['@graph'].find((item: any) => item['@id'] === id);
  child.license = parent.license;
  child.memberOf = { '@id': parentId, name: parent.name };

  return [200, rocrate];
};

const getcrate = async (id: string) => {
  const url = `${baseUrl}/api/object/meta?id=${encodeURIComponent(id)}`;
  const response = await fetch(url);

  // biome-ignore lint/suspicious/noExplicitAny: foo
  let rocrate: any;

  if (response.status === 404) {
    const result = await synthesise(id);
    rocrate = result[1];
  } else {
    rocrate = JSON.parse(await response.text());
  }

  if (!rocrate) {
    return null;
  }

  // biome-ignore lint/suspicious/noExplicitAny: foo
  const metadata = rocrate['@graph'].find((item: any) => item['@id'] === 'ro-crate-metadata.json');
  // biome-ignore lint/suspicious/noExplicitAny: foo
  const object = rocrate['@graph'].find((item: any) => item['@id'] === metadata.about['@id']);
  if (Object.hasOwn(object, 'hasPart')) {
    for (const partId of object.hasPart) {
      // biome-ignore lint/suspicious/noExplicitAny: foo
      const part = rocrate['@graph'].find((item: any) => item['@id'] === partId['@id']);
      const query = partId['@id'].split('?')[1];
      const searchParams = new URLSearchParams(query);
      part.filename = searchParams.get('path'); // ?.replace(/\//g, '_');
      part['@id'] = `${searchParams.get('id')}/${searchParams.get('path')}`;
      partId['@id'] = part['@id'];
    }
  }

  return rocrate;
};

const getScalarEntityType = (recordType: string) => {
  if (recordType.includes('RepositoryCollection')) {
    return 'http://pcdm.org/models#Collection';
  }

  if (recordType.includes('RepositoryObject')) {
    return 'http://pcdm.org/models#Object';
  }

  throw new Error(`Unknown recordType ${recordType}`);
};

app.get('/ldaca/entities', async (req, res) => {
  const token = req.cookies['x-token'];

  const queryString = URL.parse(`http://dummy${req.url}`)?.search || '';
  const url = `${baseUrl}/api/objects${queryString}`;
  const response = await fetch(url, { redirect: 'follow' });
  if (!response.ok) {
    const body = response.text();
    res.status(response.status).send(body);

    return;
  }

  const { total, data } = await response.json();

  const entities = await Promise.all(
    // @ts-expect-error
    data.map(async ({ crateId, locked, objectRoot, record, url, ...rest }) => {
      const entityType = getScalarEntityType(rest.recordType);

      const extra = await getExtra(crateId, entityType, token);

      return {
        id: crateId,
        ...rest,
        entityType,
        ...extra,
      };
    }),
  );

  const result = {
    total,
    entities,
  };

  res.json(result);
});

app.get('/ldaca/entity/:id', async (req, res) => {
  const token = req.cookies['x-token'];

  const url = `${baseUrl}/api/object?id=${encodeURIComponent(req.params.id)}`;
  const response = await fetch(url, { redirect: 'follow' });

  if (!response.ok) {
    const body = response.text();
    res.status(response.status).send(body);

    return;
  }

  // biome-ignore lint/suspicious/noExplicitAny: foo
  const data = (await response.json()) as any;

  // biome-ignore lint/correctness/noUnusedVariables: foo
  const { id, crateId, license, objectRoot, locked, rootConformsTos, ...rest } = data;
  if (rootConformsTos.length > 1) {
    throw new Error('Multiple conformsTo found in rootConformsTos');
  }

  const entityType = rootConformsTos[0].conformsTo.endsWith('Object')
    ? 'http://pcdm.org/models#Object'
    : 'http://pcdm.org/models#Collection';

  const extra = await getExtra(crateId, entityType, token);

  const result = {
    id: crateId,
    recordType: entityType,
    memberOf: 'Unknown',
    root: 'Unknown',
    extra,
    ...rest,
  };

  return res.json(result);
});

app.get('/ldaca/entity/:id/file/:path', async (req, res) => {
  if (req.params.path === 'ro-crate-metadata.json') {
    const rocrate = await getcrate(req.params.id);

    return res.send(rocrate);
  }

  const idUrl = new URL(req.params.id);
  idUrl.pathname = '';
  const url = `${baseUrl}/api/object/${encodeURIComponent(idUrl.toString())}/${encodeURIComponent(req.params.path)}`;
  const response = await fetch(url);

  res.status(response.status);

  if (!response.body) {
    res.status(response.status).json({ error: `Failed to fetch: ${response.statusText}` });

    return;
  }

  // @ts-expect-error
  await pipeline(response.body, res);
});

app.get('/ldaca/user/terms', async (req, res) => {
  const token = req.cookies['x-token'];

  const url = `${baseUrl}/api/user/terms`;
  const response = await fetch(url, {
    redirect: 'follow',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const body = response.text();
    res.status(response.status).send(body);

    return;
  }

  // biome-ignore lint/suspicious/noExplicitAny: foo
  const data = (await response.json()) as any;

  return res.json(data);
});

app.get('/ldaca/user/terms/accept', async (req: Request<{ id: string }>, res) => {
  const token = req.cookies['x-token'];

  const url = `${baseUrl}/api/user/terms/accept?id=${req.params.id}`;
  const response = await fetch(url, {
    redirect: 'follow',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const body = response.text();
    res.status(response.status).send(body);

    return;
  }

  // biome-ignore lint/suspicious/noExplicitAny: foo
  const data = (await response.json()) as any;

  return res.json(data);
});

app.head('/ldaca/zip/:id', async (req, res) => {
  const token = req.cookies['x-token'];

  const url = `${baseUrl}/api/object/${encodeURIComponent(req.params.id)}.zip`;
  const response = await fetch(url, {
    method: 'HEAD',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (response.status === 404) {
    res.status(404).end();

    return;
  }

  if (!response.ok) {
    throw new Error(`Failed to fetch: ${response.statusText}`);
  }

  res.set('Content-Length-Estimate', response.headers.get('Content-Length-Estimate') || '0');
  res.set('Archive-File-Count', response.headers.get('Archive-File-Count') || '0');

  res.end();
});

app.get('/ldaca/zip/:id', async (req, res) => {
  const token = req.cookies['x-token'];

  const url = `${baseUrl}/api/object/${encodeURIComponent(req.params.id)}.zip`;
  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  res.status(response.status);

  if (!response.body) {
    res.status(response.status).json({ error: `Failed to fetch: ${response.statusText}` });

    return;
  }

  // @ts-expect-error
  await pipeline(response.body, res);
});

app.get('/ldaca/oauth/:provider/login', async (req, res) => {
  const url = `${baseUrl}/api/oauth/${req.params.provider}/login`;
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
  const url = `${baseUrl}/api/oauth/${req.params.provider}/code`;

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

    // @ts-expect-error
    await pipeline(response.body, res);
  });
});

type EntityType = {
  id: string;
  name: string;
  description: string;
  entityType: 'http://pcdm.org/models#Collection' | 'http://pcdm.org/models#Object';
  memberOf: string;
  rootCollection: string;
  createdAt: string;
  updatedAt: string;
  counts: {
    collections: number;
    objects: number;
    subCollections: number;
    files: number;
  };
  language: Array<string>;
  accessControl: 'Public' | 'Restricted';
  communicationMode: 'Song' | 'Spoken';
  mediaType: Array<string>;
};

type GetSearchResponse = {
  total: number;
  searchTime: number;
  entities: Array<EntityType & { searchExtra: { score: number; highlight: string[] } }>;
  facets: Record<string, { name: string; count: number }[]>;
  geohashGrid: Record<string, number>;
};

const aggMap: Record<string, string> = {
  _geohash: 'geohash',
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

const searchUrl = `${baseUrl}/api/search/index/items`;

const filter = async (filters: Record<string, string[]>) => {
  const body = await es.multi({
    filters: filters,
    sort: 'relevance',
    order: 'desc',
  });

  const response = await fetch(searchUrl, {
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
  const token = req.cookies['x-token'];

  let data = '';
  req.setEncoding('utf8');
  req.on('data', (chunk) => {
    data += chunk;
  });

  req.on('end', async () => {
    const params = JSON.parse(data);
    // biome-ignore lint/suspicious/noExplicitAny: foo
    let body: any;

    if (params.boundingBox) {
      body = await es.map({
        multi: params.query,
        filters: params.filters,
        boundingBox: params.boundingBox,
        precision: params.geohashPrecision,
        searchFrom: 0,
      });
    } else {
      body = await es.multi({
        multi: params.query,
        searchType: params.searchType,
        filters: params.filters,
        sort: params.sort,
        order: params.order,
        pageSize: params.limit,
        searchFrom: params.offset,
      });
    }

    const response = await fetch(searchUrl, {
      method: 'POST',
      body: JSON.stringify(body),
    });

    // biome-ignore lint/suspicious/noExplicitAny: foo
    const result = (await response.json()) as any;

    const entities = await Promise.all(
      // biome-ignore lint/suspicious/noExplicitAny: foo
      result.hits.hits.map(async (hit: any) => {
        const id = hit._source['@id'];
        const typem = hit._source?.['@type'];
        const entityType = typem.includes('RepositoryCollection')
          ? 'http://pcdm.org/models#Collection'
          : 'http://pcdm.org/models#Object';

        const extra = await getExtra(id, entityType, token);

        return {
          id: hit._source['@id'],
          name: hit._source.name?.[0]['@value'],
          description: hit._source.description?.[0]['@value'],
          conformsTo: hit._source.conformsTo?.[0]['@id'],
          entityType,
          memberOf: hit._source._memberOf?.[0]['@id'],
          root: hit._source._root?.[0]['@id'],
          createdAt: new Date(),
          updatedAt: new Date(),
          extra,
          searchExtra: {
            score: hit._score,
            highlight: hit.highlight,
          },
        };
      }),
    );

    const facets: Record<string, { name: string; count: number }[]> = {};

    const geohashGrid: Record<string, number> = {};
    result.aggregations._geohash?.buckets.forEach((bucket: Record<string, number>) => {
      geohashGrid[bucket.key] = bucket.doc_count;
    });

    delete result.aggregations._geohash;

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
      geohashGrid,
    };

    res.status(response.status).send(JSON.stringify(converted, null, 2));
  });
});

app.post('/api/search/index/items', async (req, res) => {
  const url = `${baseUrl}/api/search/index/items`;

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

app.get('/.well-known/openid-configuration', async (_req, res) => {
  const body = {
    issuer: 'http://localhost:5173',
    authorization_endpoint: 'http://localhost:5173/ldaca/oauth/authorize',
    token_endpoint: 'http://localhost:5173/ldaca/oauth/token',
    userinfo_endpoint: 'http://localhost:5173/ldaca/oauth/userinfo',
    // "revocation_endpoint": "https://data.ldaca.edu.au/oauth/revoke",
    // "introspection_endpoint": "https://data.ldaca.edu.au/oauth/introspect",
    // "jwks_uri": "https://data.ldaca.edu.au/oauth/discovery/keys",
    scopes_supported: ['public', 'profile', 'openid', 'email'],
    response_types_supported: ['code', 'token', 'id_token', 'id_token token'],
    response_modes_supported: ['query', 'fragment', 'form_post'],
    grant_types_supported: ['authorization_code', 'client_credentials', 'implicit_oidc'],
    token_endpoint_auth_methods_supported: ['client_secret_basic', 'client_secret_post'],
    subject_types_supported: ['public'],
    id_token_signing_alg_values_supported: ['RS256'],
    claim_types_supported: ['normal'],
    claims_supported: ['iss', 'sub', 'aud', 'exp', 'iat', 'email', 'given_name', 'family_name', 'name'],
    code_challenge_methods_supported: ['plain', 'S256'],
  };

  res.status(200).send(body);
});

app.get('/ldaca/oauth/authorize', async (req, res) => {
  const qs = new URLSearchParams(req.query as Record<string, string>).toString();
  const { state } = req.query;

  const response = await fetch(`${baseUrl}/api/oauth/cilogon/login?${qs}`);

  const { url, code_verifier } = (await response.json()) as { url: string; code_verifier: string };

  res.cookie('x-code-verifier', code_verifier, { httpOnly: true });
  res.cookie('x-state', state, { httpOnly: true });

  res.redirect(301, url);
});

// NOTE: This is a dirty hack to intercept the login flow manually done by the user for testing
app.get('/ldaca/oauth/intercept', async (req, res) => {
  const { code } = req.query;
  const code_verifier = req.cookies['x-code-verifier'];
  const state = req.cookies['x-state'];

  const response = await fetch(`${baseUrl}/api/oauth/cilogon/code`, {
    method: 'POST',
    body: JSON.stringify({ code, state: 'cilogon', code_verifier }),
  });

  const { token } = (await response.json()) as { token: string };

  res.cookie('x-token', token, { httpOnly: true });

  res.redirect(301, `http://localhost:5173/auth/callback?code=moo&state=${state}`);
});

app.post('/ldaca/oauth/token', async (req, res) => {
  const access_token = req.cookies['x-token'];

  const response = await fetch(`${baseUrl}/api/user`, {
    headers: {
      Authorization: `Bearer ${access_token}`,
    },
  });

  const user = ((await response.json()) as { user: Record<string, string> }).user;

  const claims = {
    iss: 'http://localhost:5173',
    sub: user.id,
    aud: 'your-client-id',
    nonce: 'random-nonce-value',
    email: user.email,
    email_verified: true,
    name: user.name,
  };

  const { privateKey } = crypto.generateKeyPairSync('rsa', {
    modulusLength: 2048,
    publicKeyEncoding: {
      type: 'spki',
      format: 'pem',
    },
    privateKeyEncoding: {
      type: 'pkcs8',
      format: 'pem',
    },
  });

  const payload = {
    ...claims,
    auth_time: Math.floor(Date.now() / 1000),
  };

  // JWT sign options
  const signOptions: jwt.SignOptions = {
    algorithm: 'RS256',
    expiresIn: '365d',
    issuer: claims.iss,
    audience: claims.aud,
    subject: claims.sub,
    header: {
      typ: 'JWT',
      alg: 'RS256',
    },
  };

  const { iss: _iss, aud: _aud, sub: _sub, ...payloadWithoutDuplicates } = payload;

  const id_token = jwt.sign(payloadWithoutDuplicates, privateKey, signOptions);

  const data = {
    access_token,
    token_type: 'Bearer',
    expires_in: 720000,
    scope: 'public openid profile email',
    created_at: 1754443546,
    id_token,
  };

  res.status(200).send(data);
});

export const ldacaProxy: Express = app;
