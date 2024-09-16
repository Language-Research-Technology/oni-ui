import {
  tokenSessionKey,
  removeLocalStorage,
  getLocalStorage
} from "@/storage";

export default class HTTPService {
  constructor({ router, loginPath = "/login" }) {
    this.router = router;
    this.loginPath = loginPath;
  }

  getHeaders() {
    try {
      let { token } = getLocalStorage({ key: tokenSessionKey });
      return {
        authorization: `Bearer ${ token }`,
        "Content-Type": "application/json",
      };
    } catch (error) {
      return {
        "Content-Type": "application/json",
      };
    }
  }

  getToken() {
    try {
      let { token } = getLocalStorage({ key: tokenSessionKey });
      return token;
    } catch (error) {
    }
  }
  async head({ route }) {
    let headers = this.getHeaders();
    let response = await fetch(`/api${ route }`, {
      method: "HEAD",
      headers,
      credentials: "include"
    });
    //this.checkAuthorised({ status: response.status });
    return response;
  }

  async get({ route }) {
    let headers = this.getHeaders();
    let response = await fetch(`/api${ route }`, {
      method: "GET",
      headers,
      credentials: "include"
    });
    //this.checkAuthorised({ status: response.status });
    return response;
  }

  async post({ route, body }) {
    let headers = this.getHeaders();
    let response = await fetch(`/api${ route }`, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
      credentials: "include"
    });

    //this.checkAuthorised({ status: response.status });
    return response;
  }

  async put({ route, body }) {
    let response = await fetch(`/api${ route }`, {
      method: "PUT",
      headers: this.getHeaders(),
      body: JSON.stringify(body),
    });
    //this.checkAuthorised({ status: response.status });
    return response;
  }

  async delete({ route }) {
    let response = await fetch(`/api${ route }`, {
      method: "delete",
      headers: this.getHeaders(),
    });
    //this.checkAuthorised({ status: response.status });
    return response;
  }

  checkAuthorised({ status }) {
    if (status === 401) {
      removeLocalStorage({key: tokenSessionKey});
      removeLocalStorage({key: 'isLoggedIn'});
      this.router.push(this.loginPath);
    }
  }
}
