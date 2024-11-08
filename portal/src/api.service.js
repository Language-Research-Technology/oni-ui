import {ROCrate} from 'ro-crate';

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
    const json = await this.#get('/object/meta', {id: crateId});

    const crate = new ROCrate(json, { array: false, link: true });

    return { metadata: crate.rootDataset };
  }

  async #getHeaders() {
    const headers = {
      'Content-Type': 'application/json',
    };
    if (this.api.clientId) {
      const token = await this.#getToken();
      headers.authorization = `Bearer ${token}`;
    };

    return headers;
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

    if (response.status !== 200) {
      if (data.errors) {
        throw new Error(data.errors.join(', '));
      }

      throw new Error(response.body);
    }

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
