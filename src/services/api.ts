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
  boundingBox?: {
    topRight: { lat: number; lng: number };
    bottomLeft: { lat: number; lng: number };
  };
  geohashPrecision?: number;
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
    access?: {
      metadata: boolean;
      files: boolean;
      enrollmentUrl?: string;
    };
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
  geohashGrid: Record<string, number>;
};

type ROCratePerson = {
  '@type': 'Person';
  description?: string;
  name: string;
};
export type RoCrate = {
  '@id': string;
  '@type': ['DataSet', 'RepositoryObject' | 'RepositoryCollection'];
  name: string;
  // TODO: Check this
  creditText: string | string[];
  datePublished: string;
  doi?: string;
  'pcdm:memberOf'?: {
    '@id': string;
    name?: string;
  };
  license?: {
    '@id': string;
    '@type': string;
    name: string;
    description?: string;
    'ldac:access': string;
    metadataIsPublic?: boolean;
    allowTextIndex?: boolean;
  };
  metadataLicense?: {
    id: string;
    name: string;
  };
  author?: ROCratePerson | ROCratePerson[];
  creator?: ROCratePerson | ROCratePerson[];
};

export class ApiService {
  #apiUri: string;
  #clientId: string | undefined;
  #usesRedirects: boolean | undefined;
  #store: ReturnType<typeof useAuthStore>;

  constructor() {
    const { endpoint, path, clientId, usesRedirects } = configuration.api.rocrate;
    this.#apiUri = `${endpoint}${path}`;
    this.#clientId = clientId;
    this.#store = useAuthStore();
    this.#usesRedirects = usesRedirects;
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
    const crateJson = await this.#get(`/entity/${encodeURIComponent(id)}/file/ro-crate-metadata.json`);

    if (!crateJson) {
      return {};
    }
    if (crateJson.errors) {
      return { errors: crateJson.errors };
    }

    const crate = new ROCrate(crateJson, { array: false, link: true });

    return { metadata: crate.rootDataset as RoCrate };
  }

  async getEntity(id: string) {
    const [entity, crateJson] = await Promise.all([
      this.#get(`/entity/${encodeURIComponent(id)}`),
      this.getRoCrate(id),
    ]);

    if (!entity) {
      return {};
    }

    if (entity.errors) {
      return { errors: entity.errors };
    }

    if (crateJson.errors) {
      return { errors: crateJson.errors };
    }

    return { entity, metadata: crateJson.metadata };
  }

  async getFileUrl(id: string, path: string, downloadable = false) {
    const params = {
      disposition: downloadable ? 'attachment' : 'inline',
      filename: path,
    };

    if (!this.#usesRedirects) {
      const queryString = new URLSearchParams(params).toString();

      const filePath = `/entity/${encodeURIComponent(id)}/file/${encodeURIComponent(path)}?${queryString}`;

      const url = `${this.#apiUri}${filePath}`;

      return url;
    }

    const url = `/entity/${encodeURIComponent(id)}/file/${encodeURIComponent(path)}`;

    const json = await this.#get(url, { ...params, noRedirect: 'true' });

    return json.location;
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
