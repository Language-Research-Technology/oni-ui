import { ROCrate } from 'ro-crate';

import { api } from '@/configuration';
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
  recordType: 'RepositoryCollection' | 'RepositoryObject';
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

type ErrorResponse = {
  error: string;
};

export type GetEntitiesResponse = {
  total: number;
  entities: Array<EntityType>;
};

export type GetEntityResponse = EntityType;

export type GetSearchResponse = {
  total: number;
  searchTime: number;
  entities: Array<EntityType>;
  facets: Record<string, { name: string; count: number }[]>;
  geohashGrid: Record<string, number>;
};

export type GetTermsResponse = {
  id: number;
  body: string;
  url: string;
  description: string;
  agreement: boolean;
};

export type AcceptTermsResponse = {
  accept: boolean;
};

type ROCratePerson = {
  '@type': 'Person';
  description?: string;
  name: string;
};

type RoCrateLicense = {
  '@id': string;
  '@type': string;
  name: string;
  description?: string;
  'ldac:access': string;
  metadataIsPublic?: boolean;
  allowTextIndex?: boolean;
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
  license?: RoCrateLicense | RoCrateLicense[];
  metadataLicense?: {
    id: string;
    name: string;
  };
  author?: ROCratePerson | ROCratePerson[];
  creator?: ROCratePerson | ROCratePerson[];
  hasPart: { '@id': string; filename: string; encodingFormat: string | string[]; contentSize: number }[];
};

export class ApiService {
  #apiUri: string;
  #clientId: string | undefined;
  #usesRedirects: boolean | undefined;
  #store: ReturnType<typeof useAuthStore>;

  constructor() {
    const { endpoint, path, clientId, usesRedirects } = api.rocrate;
    this.#apiUri = `${endpoint}${path}`;
    this.#clientId = clientId;
    this.#store = useAuthStore();
    this.#usesRedirects = usesRedirects;
  }

  async getEntities(params: GetEntitiesParams) {
    const entities = await this.#get<GetEntitiesResponse>('/entities', params as Record<string, string>);

    return entities;
  }

  async search(params: SearchParams) {
    const response = await this.#post<GetSearchResponse>('/search', params as unknown as Record<string, string>);

    return response;
  }

  async getRoCrate(id: string) {
    const crateJson = await this.#get<object | ErrorResponse>(
      `/entity/${encodeURIComponent(id)}/file/ro-crate-metadata.json`,
    );

    if ('error' in crateJson) {
      return { error: crateJson.error };
    }

    const crate = new ROCrate(crateJson, { array: false, link: true });

    return { metadata: crate.rootDataset as RoCrate };
  }

  async getEntity(id: string) {
    const [entity, crateJson] = await Promise.all([
      this.#get<GetEntityResponse>(`/entity/${encodeURIComponent(id)}`),
      this.getRoCrate(id),
    ]);

    if ('error' in entity) {
      return { error: entity.error };
    }

    if ('error' in crateJson) {
      return { error: crateJson.error };
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

    const json = await this.#get<{ location: string } | ErrorResponse>(url, { ...params, noRedirect: 'true' });
    if ('error' in json) {
      return;
    }

    return json.location;
  }

  async getTerms() {
    const terms = await this.#get<GetTermsResponse>('/user/terms');

    return terms;
  }

  async acceptTerms(id: number) {
    const terms = await this.#get<AcceptTermsResponse>(`/user/terms/accept?id=${id}`);

    return terms;
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

  async #get<T extends object>(route: string, params?: Record<string, string>) {
    const headers = await this.#getHeaders();
    const queryString = params ? new URLSearchParams(params).toString() : undefined;

    const url = `${this.#apiUri}${route}${queryString ? `?${queryString}` : ''}`;
    const response = await fetch(url, {
      method: 'GET',
      headers,
    });

    if (response.status === 404) {
      return { error: 'Not found' };
    }

    if (response.status === 401) {
      throw new Error('Not authorised');
    }

    const data = (await response.json()) as T | ErrorResponse;

    if (response.status !== 200) {
      if ('error' in data) {
        throw new Error(data.error);
      }

      throw new Error((await response.text()) || 'No body present in response');
    }

    return data;
  }

  async #post<T extends object>(route: string, body: object) {
    const headers = await this.#getHeaders();
    const response = await fetch(`${this.#apiUri}${route}`, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    });

    if (response.status === 404) {
      return null;
    }

    const data = (await response.json()) as T | ErrorResponse;

    if (response.status !== 200) {
      if ('error' in data) {
        throw new Error(data.error);
      }

      throw new Error((await response.text()) || 'No body present in response');
    }

    return data;
  }
}
