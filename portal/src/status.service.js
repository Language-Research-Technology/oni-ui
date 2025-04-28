import HTTPService from './http.service';

export default class StatusService {
  constructor({ router }) {
    this.router = router;
  }

  async get() {
    const httpService = new HTTPService({router: this.router, loginPath: '/login'});
    const response = await httpService.get({route: '/status'});
    if (response.status === 200) {
      const status = await response.json();
      return status;
    } else {
      return {error: response.statusText};
    }
  }
}

