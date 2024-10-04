import HTTPService from "./http.service";
import convertSize from "convert-size";

export default class ZipService {
  constructor({router, apiPath}) {
    this.router = router;
    this.apiPath = apiPath
  }

  async get(id) {
    const httpService = new HTTPService({router: this.router, loginPath: '/login'});
    const route = `/object/${encodeURIComponent(id)}.zip`
    let response = await httpService.head({route});
    if (response.status === 200) {
      const zip = {
        url: `${this.apiPath}${route}`,
      }
      try {
        const size = response.headers.get('Content-Length-Estimate')
        zip['expandedSize'] = convertSize(parseInt(size), {accuracy: 2});
      } catch (e) {
        console.error(e);
      }
      zip['numberOfFiles'] = response.headers.get('Archive-File-Count');
      return zip;
    }
  }
}
