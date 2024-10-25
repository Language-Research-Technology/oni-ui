// TODO: Store the access token and the expiry in local storage
// import {
//   tokenSessionKey,
//   removeLocalStorage,
//   getLocalStorage
// } from "@/storage";

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

  async getCrate(id) {
    const crate = await this.#get('/object/meta', {id});

    return crate;
  }

  async #getHeaders() {
    const token = await this.#getToken();

    return {
      authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    };
  }

  async #getToken() {
    // FIXME: Deal with expired tokens
    if (this.token) {
      return this.token;
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

        return this.token;
      }

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

  async #post(route, body) {
    const headers = await this.#getHeaders();
    const response = await fetch(`${this.apiUri}${route}`, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    });

    const data = response.json();

    return data;
  }

  async #put(route, body) {
    const headers = await this.#getHeaders();
    const response = await fetch(`${this.apiUri}${route}`, {
      method: 'PUT',
      headers,
      body: JSON.stringify(body),
    });

    const data = response.json();

    return data;
  }

  async #delete(route) {
    const headers = await this.#getHeaders();
    const response = await fetch(`${this.apiUri}${route}`, {
      method: 'DELETE',
      headers,
    });

    const data = response.json();

    return data;
  }
}
