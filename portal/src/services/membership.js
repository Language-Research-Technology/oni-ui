import HTTPService from './http.service';

export default class MembershipService {
  constructor({ router }) {
    this.router = router;
  }

  async get() {
    const httpService = new HTTPService({ router: this.router, loginPath: '/login' });
    const response = await httpService.get({ route: '/user/memberships' });
    if (response.status !== 200) {
      //httpService.checkAuthorised({status: response.status});
      return { error: response.statusText };
    }
    const membershipsStatus = await response.json();
    console.log(membershipsStatus);
    return membershipsStatus;
  }

  async set() {
    const httpService = new HTTPService({ router: this.router, loginPath: '/login' });
    const response = await httpService.get({ route: '/auth/memberships' });
    if (response.status !== 200) {
      //httpService.checkAuthorised({status: response.status});
      return { error: response.statusText };
    }
    const membershipsStatus = await response.json();
    console.log(membershipsStatus);
    return membershipsStatus;
  }
}
