import convertSize from 'convert-size';
import HTTPService from './http.service';

export default class ZipService {
  constructor({ router, apiPath }) {
    this.router = router;
    this.apiPath = apiPath;
  }

  async get(id, name) {
    const httpService = new HTTPService({ router: this.router, loginPath: '/login' });
    const route = `/object/${encodeURIComponent(id)}.zip`;
    const response = await httpService.head({ route });
    const zip = {};
    name = name || id;
    zip.name = `${name}.zip`;
    try {
      const size = response.headers.get('Content-Length-Estimate');
      zip.expandedSize = convertSize(Number.parseInt(size), { accuracy: 2 });
    } catch (e) {
      console.error(e);
    }
    zip.numberOfFiles = response.headers.get('Archive-File-Count');
    if (response.status === 200) {
      zip.url = `${this.apiPath}${route}`;
    } else if (response.status === 403) {
      zip.noAccess = true;
    }
    return zip;
  }
}
