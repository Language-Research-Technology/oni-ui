import { ROCrate } from 'ro-crate';

import { api } from '@/configuration';
import { forceRenewToken, getValidAccessToken } from '@/services/auth';
import { useAuthStore } from '@/stores/auth';
import { parseContentSize } from '@/tools';

// TODO: use zod to validate the response we get back

type CommonParams = {
  limit?: number;
  offset?: number;
  sort?: string;
  order?: string;
};

export type GetEntitiesParams = CommonParams & {
  entityType?: string;
  memberOf?: string;
};

export type GetFilesParams = CommonParams & {
  memberOf?: string;
};

export type SearchParams = CommonParams & {
  searchType?: 'basic' | 'advanced';
  query: string;
  filters?: Record<string, string[]>;
  boundingBox?: {
    topRight: { lat: number; lng: number };
    bottomLeft: { lat: number; lng: number };
  };
  geohashPrecision?: number;
};

// TODO: Can we get the types from the API?
export type EntityType = {
  id: string;
  name: string;
  description?: string;
  identifiers?: {
    collectionIdentifier: string;
    itemIdentifier: string;
    shortIdentifier: string;
  };
  entityType: string;
  memberOf?: {
    id: string;
    name?: string;
  } | null;
  rootCollection?: {
    id: string;
    name?: string;
  } | null;
  metadataLicenseId: string;
  contentLicenseId: string;
  access: {
    metadata: boolean;
    content: boolean;
    metadataAuthorizationUrl?: string;
    contentAuthorizationUrl?: string;
  };
  counts: {
    collections: number;
    objects: number;
    subCollections: number;
    files: number;
  };
  language: Array<string>;
  communicationMode: 'Song' | 'Spoken';
  mediaType: Array<string>;
  accessControl: 'Public' | 'Restricted';
  searchExtra?: { score: number; highlight: Record<string, string[]> };
};

type ApiErrorBody = {
  error: {
    code: string;
    message: string;
    details?: object;
    requestId?: string;
  };
};

type ErrorResponse = {
  error: string;
};

export type GetEntitiesResponse = {
  total: number;
  entities: Array<EntityType>;
};

type GetEntityResponse = EntityType;

export type GetSearchResponse = {
  total: number;
  searchTime: number;
  entities: Array<EntityType>;
  facets: Record<string, { name: string; count: number }[]>;
  geohashGrid: Record<string, number>;
};

export type FileType = {
  id: string;
  filename: string;
  mediaType: string;
  size: number;
  access: {
    content: boolean;
    contentAuthorizationUrl?: string;
  };
};

type GetFilesResponse = {
  total: number;
  files: Array<FileType>;
};

export type GetTermsResponse = {
  id: number;
  body: string;
  url: string;
  description: string;
  agreement: boolean;
};

type AcceptTermsResponse = {
  accept: boolean;
};

export type GetZipMetaResponse =
  | {
      status: 'ok';
      expandedSize: number | null;
      numberOfFiles: number;
      url: string;
    }
  | {
      status: 'noAccess';
    }
  | {
      status: 'notFound';
    };

type ROCratePerson = {
  '@type': string[];
  description?: string[];
  name: string[];
};

type RoCrateLicense = {
  '@id': string;
  '@type': string[];
  name: string[];
  description?: string[];
  'ldac:access': string[];
  metadataIsPublic?: boolean[];
  allowTextIndex?: boolean[];
};

export type AnnotationRef = { '@id': string; filename?: string[] };

export type RoCrate = {
  '@id': string;
  '@type': string[];
  name: string[];
  creditText: string[];
  identifier: { name: string[]; value: string[] }[];
  datePublished: string[];
  doi?: string[];
  'pcdm:memberOf'?: { '@id': string; name?: string[] }[];
  license?: RoCrateLicense[];
  metadataLicense?: { '@id': string; name: string[] }[];
  author?: ROCratePerson[];
  creator?: ROCratePerson[];
  hasPart: {
    '@id': string;
    filename: string[];
    encodingFormat: string[];
    contentSize: number[];
    hasAnnotation?: AnnotationRef[];
    annotationOf?: AnnotationRef[];
  }[];
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

  async getFiles(params: GetFilesParams) {
    const files = await this.#get<GetFilesResponse>('/files', params as Record<string, string>);

    return files;
  }

  async search(params: SearchParams) {
    const response = await this.#post<GetSearchResponse>('/search', params as unknown as Record<string, string>);

    return response;
  }

  async getRoCrateJSON(id: string) {
    const crateJson = await this.#get<object | ErrorResponse>(`/entity/${encodeURIComponent(id)}/rocrate`);

    return JSON.stringify(crateJson);
  }

  async getRoCrate(id: string) {
    const crateJson = await this.#get<object | ErrorResponse>(`/entity/${encodeURIComponent(id)}/rocrate`);

    if ('error' in crateJson) {
      return { error: crateJson.error };
    }

    const crate = new ROCrate(crateJson, { array: true, link: true });

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

      const filePath = `/file/${encodeURIComponent(id)}?${queryString}`;

      const url = `${this.#apiUri}${filePath}`;

      return url;
    }

    const url = `/file/${encodeURIComponent(id)}`;

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
    const terms = await this.#get<AcceptTermsResponse>('/user/terms/accept', { id: String(id) });

    return terms;
  }

  async getZipMeta(id: string): Promise<GetZipMetaResponse> {
    const response = await this.#head(`/zip/${encodeURIComponent(id)}`);

    if (response.status === 403) {
      return { status: 'noAccess' };
    }

    if (response.status === 404) {
      return { status: 'notFound' };
    }

    if (response.status !== 200) {
      throw new Error(`Error fetching zip metadata: ${response.statusText}`);
    }

    const size = response.headers.get('Content-Length-Estimate') || '0';
    const expandedSize = parseContentSize(Number.parseInt(size, 10));
    const numberOfFiles = response.headers.get('Archive-File-Count') || '0';

    return {
      status: 'ok',
      expandedSize,
      numberOfFiles: Number.parseInt(numberOfFiles, 10),
      url: response.url,
    };
  }

  async #getHeaders() {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (this.#clientId) {
      const token = await getValidAccessToken();
      if (token) {
        headers.authorization = `Bearer ${token}`;
      }
    }

    return headers;
  }

  async #fetchWithRetry(
    url: string,
    init: Omit<RequestInit, 'headers'> & { headers: Record<string, string> },
  ): Promise<Response> {
    const response = await fetch(url, init);

    if (response.status === 401 && this.#clientId) {
      // Server rejected the token — force a renewal (bypasses client-side expiry check)
      const newToken = await forceRenewToken();
      if (newToken) {
        const retryHeaders = { ...init.headers, authorization: `Bearer ${newToken}` };
        const retryResponse = await fetch(url, { ...init, headers: retryHeaders });

        if (retryResponse.status !== 401) {
          return retryResponse;
        }
      }

      this.#store.reset();
      throw new Error('Not authorised');
    }

    return response;
  }

  #throwOnApiError(data: unknown): never {
    if (data && typeof data === 'object' && 'error' in data) {
      const body = data as ApiErrorBody;
      if (typeof body.error === 'object' && body.error !== null && 'message' in body.error) {
        throw new Error(body.error.message);
      }
    }
    throw new Error('Unexpected error response');
  }

  async #get<T extends object>(path: string, params?: Record<string, string>): Promise<T | ErrorResponse> {
    const headers = await this.#getHeaders();
    const queryString = params ? new URLSearchParams(params).toString() : undefined;

    const url = `${this.#apiUri}${path}${queryString ? `?${queryString}` : ''}`;
    const response = await this.#fetchWithRetry(url, { method: 'GET', headers });

    if (response.status === 404) {
      return { error: 'Not found' };
    }

    if (response.status === 401) {
      throw new Error('Not authorised');
    }

    const data = (await response.json()) as T | ApiErrorBody;

    if (response.status !== 200) {
      this.#throwOnApiError(data);
    }

    return data as T;
  }

  async #post<T extends object>(path: string, body: object): Promise<T | ErrorResponse> {
    const headers = await this.#getHeaders();
    const response = await this.#fetchWithRetry(`${this.#apiUri}${path}`, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    });

    if (response.status === 404) {
      return { error: 'Not found' };
    }

    const data = (await response.json()) as T | ApiErrorBody;

    if (response.status !== 200) {
      this.#throwOnApiError(data);
    }

    return data as T;
  }

  // NOTE: This is a bit different, consider refactoring if anything other than zip uses it
  async #head(path: string) {
    const headers = await this.#getHeaders();

    const url = `${this.#apiUri}${path}`;
    const response = await this.#fetchWithRetry(url, { method: 'HEAD', headers });

    return response;
  }
}
