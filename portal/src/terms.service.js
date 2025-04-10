import HTTPService from './http.service';

export default class TermsService {
  constructor({ router }) {
    this.router = router;
  }

  async get() {
    const httpService = new HTTPService({ router: this.router, loginPath: '/login' });
    const response = await httpService.get({ route: '/user/terms' });
    if (response.status !== 200) {
      //httpService.checkAuthorised({status: response.status});
      return { error: response.statusText };
    }
    const termsStatus = await response.json();
    console.log(termsStatus);
    return termsStatus;
  }

  async accept(id) {
    const httpService = new HTTPService({ router: this.router, loginPath: '/login' });
    const response = await httpService.get({ route: `/user/terms/accept?id=${id}` });
    if (response.status !== 200) {
      //httpService.checkAuthorised({status: response.status});
      return { error: response.statusText };
    }
    const termsStatus = await response.json();
    console.log(termsStatus);
    return termsStatus;
  }

}
