import HTTPService from './http.service';

export default class TermsService {
  constructor({ router }) {
    this.router = router;
  }

  async get() {
    const httpService = new HTTPService({router: this.router, loginPath: '/login'});
    const response = await httpService.get({route: '/user/terms'});
    if (response.status === 200) {
      const termsStatus = await response.json();
      return termsStatus;
    } else {
      return {error: response.statusText};
    }
  }

  async accept(id) {
    const httpService = new HTTPService({router: this.router, loginPath: '/login'});
    const response = await httpService.get({route: `/user/terms/accept?id=${id}`});
    if (response.status === 200) {
      const termsStatus = await response.json();
      return termsStatus;
    } else {
      return {error: response.statusText};
    }
  }
}

