import { ROCrate } from 'ro-crate';

import { configuration } from '@/configuration';
import { useAuthStore } from '@/stores/auth';

// TODO: use zod to validate the response we get back

// TODO: Can we get the types from the API?
export type GetEntitiesParams = {
  limit?: number;
  offset?: number;
  sort?: string;
  order?: string;
  conformsTo?: string;
  memberOf?: string;
};

export type SearchParams = GetEntitiesParams & {
  query: string;
  filters?: Record<string, string[]>;
  searchType?: 'basic' | 'advanced';
  // operation: selectedOperation.value.toString(),
  // queries: advancedQueries.value,
};

export type EntityType = {
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
    accessControl: 'Public' | 'Restricted';
    communicationMode: 'Song' | 'Spoken';
    language: Array<string>;
    mediaType: Array<string>;
  };
  searchExtra?: { score: number; highlight: string[] };
};

export type GetEntitiesResponse = {
  total: number;
  entities: Array<EntityType>;
};

export type GetSearchResponse = {
  total: number;
  searchTime: number;
  entities: Array<EntityType>;
  facets: Record<string, { name: string; count: number }[]>;
};

export type RoCrate = {
  memberOf?: {
    '@id': string;
    name?: string;
  };
  license?: {
    name: string;
  };
  metadataLicense?: {
    id: string;
    name: string;
  };
};

// FIXME: This current implemenation means the client and secret are client side
// so we need to ensure the scope is public only
export class ApiService {
  #apiUri: string;
  #clientId: string | undefined;
  #clientSecret: string | undefined;
  #endpoint: string;
  #store: ReturnType<typeof useAuthStore>;

  constructor() {
    const { endpoint, path, clientId } = configuration.api.rocrate;
    this.#apiUri = `${endpoint}${path}`;
    this.#clientId = clientId;
    this.#endpoint = endpoint;
    this.#store = useAuthStore();
  }

  async getEntities(params: GetEntitiesParams) {
    const entities = (await this.#get('/entities', params as unknown as Record<string, string>)) as GetEntitiesResponse;

    return entities;
  }

  async search(params: SearchParams) {
    const response = (await this.#post('/search', params as unknown as Record<string, string>)) as GetSearchResponse;

    return response;
  }

  async getRoCrate(id: string) {
    const json = await this.#get(`/entity/${encodeURIComponent(id)}`);
    if (!json) {
      return {};
    }

    if (json.errors) {
      return { errors: json.errors };
    }

    const crate = new ROCrate(json, { array: false, link: true });

    return { metadata: crate.rootDataset as RoCrate };
  }

  async getFileUrl(id: string, path: string, downloadable = false) {
    console.log('getFileUrl', id, path, downloadable);
    const params = {
      disposition: downloadable ? 'attachment' : 'inline',
      filename: path,
    };

    // TODO: deal with auth and redirects
    const queryString = new URLSearchParams(params).toString();

    const url = `${this.#apiUri}/entity/${encodeURIComponent(id)}/file/${encodeURIComponent(path)}?${queryString}`;
    console.log('🪚 url:', JSON.stringify(url, null, 2));

    return url;
  }

  async #getHeaders() {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (this.#clientId) {
      const token = await this.#getToken();
      headers.authorization = `Bearer ${token}`;
    }

    return headers;
  }

  async #getToken() {
    // TODO Do we deal with expiry?
    return this.#store.user?.accessToken;
  }

  async #get(route: string, params?: Record<string, string>) {
    const headers = await this.#getHeaders();
    const queryString = new URLSearchParams(params).toString();

    const url = `${this.#apiUri}${route}${queryString ? `?${queryString}` : ''}`;
    const response = await fetch(url, {
      method: 'GET',
      headers,
    });

    if (response.status === 404) {
      return null;
    }

    if (response.status === 401) {
      throw new Error('Not authorised');
    }

    const data = await response.json();

    if (response.status !== 200) {
      if (data.errors) {
        throw new Error(data.errors.join(', '));
      }

      throw new Error((await response.text()) || 'No body present in response');
    }

    return data;
  }

  async #post(route: string, body: object) {
    const headers = await this.#getHeaders();
    const response = await fetch(`${this.#apiUri}${route}`, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    });

    if (response.status === 404) {
      return null;
    }

    const data = await response.json();

    if (response.status !== 200) {
      if (data.errors) {
        throw new Error(data.errors.join(', '));
      }

      throw new Error((await response.text()) || 'No body present in response');
    }

    return data;
  }
}
