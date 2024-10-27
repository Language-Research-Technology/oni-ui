import {isEqual, isString} from 'lodash';

import {apiTokenAccessKey, putLocalStorage, getLocalStorage} from '@/storage';

// FIXME: This cirrent implemenation means the client and secret are client side
// so we need to ensure the scope is public only
export default class HTTPService {
  constructor({router, configuration}) {
    this.router = router;
    this.api = configuration.api.structural;
    this.apiUri = `${this.api.endpoint}${this.api.path}`;
  }

  async getObjects(params) {
    const objects = await this.#get('/objects', params);

    return objects;
  }

  async getCrate(crateId) {
    const crate = await this.#get('/object/meta', {id: crateId});
    const graph = crate['@graph'];
    if (!graph) {
      return {error: 'Invalid RO-Crate: Graph not found'};
    }

    const work = graph.find((item) => item['@id'] === 'ro-crate-metadata.json');
    if (!work) {
      return {error: 'Invalid RO-Crate: CreativeWork not found'};
    }

    if (work.about?.['@id'] !== crateId) {
      return {error: 'Invalid RO-Crate: CreativeWork about does not match'};
    }

    const metadata = graph.find((item) => item['@id'] === crateId);
    if (!metadata) {
      return {error: 'Invalid RO-Crate: Metadata not found'};
    }

    // Flatten the graph
    Object.entries(metadata).forEach(([key, value]) => {
      if (Array.isArray(value)) {
        metadata[key] = value.map((v) => this.#resolveObject(graph, v));
      } else {
        metadata[key] = this.#resolveObject(graph, value);
      }
    });

    return {metadata};
  }

  #resolveObject(graph, value) {
    if (Array.isArray(value)) {
      return value.map((v) => this.#resolveObject(graph, v));
    }

    // NOTE: Assume we need to look it up in the graph if only has an ID
    if (isEqual(Object.keys(value), ['@id'])) {
      const id = value['@id'];
      if (isString(id) && id?.startsWith('http')) {
        // TODO: Is it possible to have an http id and still be in the graph?
        return value;
      }

      const newValue = graph.find((m) => m['@id'] === id);
      if (!newValue) {
        newValue.description = 'This value only has an Id';

        return newValue;
      }

      if (newValue['@type'] === 'Place') {
        newValue.geo = this.#resolveObject(graph, newValue.geo);
      }
      // FIXME: thy are the location field names different i.e, geo vs location
      if (newValue['@type'] === 'Language') {
        newValue.location = this.#resolveObject(graph, newValue.location);
      }

      return newValue;
    }

    return value;
  }

  async #getHeaders() {
    const token = await this.#getToken();

    return {
      authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    };
  }

  #notExpired(expiry) {
    return expiry > Date.now();
  }

  async #getToken() {
    // FIXME: Deal with expired tokens
    if (this.token && this.#notExpired(this.expiry)) {
      return this.token;
    }

    const {token, expiry} = getLocalStorage({key: apiTokenAccessKey}) || {};
    if (token && this.#notExpired(expiry)) {
      this.token = token;
      this.expiry = expiry;

      return token;
    }

    try {
      const url = `${this.api.endpoint}/oauth/token`;
      const response = await fetch(url, {
        method: 'POST',
        body: JSON.stringify({
          grant_type: 'client_credentials',
          client_id: this.api.clientId,
          client_secret: this.api.clientSecret,
          scope: 'read',
        }),
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.status === 200) {
        const json = await response.json();
        this.token = json.access_token;
        this.expiry = json.expires_in * 1000 + Date.now();

        putLocalStorage({key: apiTokenAccessKey, data: {token: this.token, expiry: this.expiry}});

        return this.token;
      }

      console.error(response);
      throw new Error(`Wasn't able to get ONI access token: ${response}`);
    } catch (e) {
      console.error(e);
      throw new Error(`Wasn't able to get ONI access token: ${e.message}`);
    }
  }

  async #get(route, params) {
    const headers = await this.#getHeaders();
    const queryString = new URLSearchParams(params).toString();

    const response = await fetch(`${this.apiUri}${route}${queryString ? `?${queryString}` : ''}`, {
      method: 'GET',
      headers,
    });

    if (response.status === 404) {
      return null;
    }

    const data = await response.json();

    return data;
  }

  // async #post(route, body) {
  //   const headers = await this.#getHeaders();
  //   const response = await fetch(`${this.apiUri}${route}`, {
  //     method: 'POST',
  //     headers,
  //     body: JSON.stringify(body),
  //   });
  //
  //   const data = response.json();
  //
  //   return data;
  // }
  //
  // async #put(route, body) {
  //   const headers = await this.#getHeaders();
  //   const response = await fetch(`${this.apiUri}${route}`, {
  //     method: 'PUT',
  //     headers,
  //     body: JSON.stringify(body),
  //   });
  //
  //   const data = response.json();
  //
  //   return data;
  // }
  //
  // async #delete(route) {
  //   const headers = await this.#getHeaders();
  //   const response = await fetch(`${this.apiUri}${route}`, {
  //     method: 'DELETE',
  //     headers,
  //   });
  //
  //   const data = response.json();
  //
  //   return data;
  // }
}
