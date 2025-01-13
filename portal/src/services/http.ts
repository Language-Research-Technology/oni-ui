import { useAuthStore } from '@/stores/auth';

export class HTTPService {
  #store: ReturnType<typeof useAuthStore>;

  constructor() {
    this.#store = useAuthStore();
  }

  #getHeaders() {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${this.#store.token}`,
    };

    return headers;
  }

  async head(route: string) {
    const headers = this.#getHeaders();
    const response = await fetch(`/api${route}`, {
      method: 'HEAD',
      headers,
      credentials: 'include',
    });

    return response;
  }

  async get(route: string) {
    const headers = this.#getHeaders();
    const response = await fetch(`/api${route}`, {
      method: 'GET',
      headers,
      credentials: 'include',
    });

    return response;
  }

  async post(route: string, body: object) {
    const headers = this.#getHeaders();
    const response = await fetch(`/api${route}`, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
      credentials: 'include',
    });

    return response;
  }

  async put(route: string, body: object) {
    const response = await fetch(`/api${route}`, {
      method: 'PUT',
      headers: this.#getHeaders(),
      body: JSON.stringify(body),
    });

    return response;
  }

  async delete(route: string) {
    const response = await fetch(`/api${route}`, {
      method: 'delete',
      headers: this.#getHeaders(),
    });

    return response;
  }
}
