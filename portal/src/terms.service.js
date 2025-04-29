import HTTPService from './http.service';

export default class TermsService {
  constructor({router}) {
    this.router = router;
  }

  async get() {
    try {
      const httpService = new HTTPService({router: this.router, loginPath: '/login'});
      const response = await httpService.get({route: '/user/terms'});
      if (response.status !== 200) {
        throw new Error(response.statusText);
      } else {
        const termsStatus = await response.json();
        return termsStatus;
      }
    } catch (e) {

      throw new Error(e);
    }
  }

  async accept(id) {
    try {
      const httpService = new HTTPService({router: this.router, loginPath: '/login'});
      const response = await httpService.get({route: `/user/terms/accept?id=${id}`});
      if (response.status !== 200) {
        throw new Error(response.statusText);
      } else {
        const termsStatus = await response.json();
        return termsStatus;
      }
    } catch (e) {
      throw new Error(e);
    }
  }
}

