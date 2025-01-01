const configuration = require('./configuration.json');

(async () => {
  const host = configuration.api.host || 'localhost:8080';
  const protocol = configuration.api.protocol || 'http';
  const adminToken = configuration.api.tokens.admin;
  const options = {
    headers: {
      Authorization: `Bearer ${adminToken}`,
    },
  };
  const url = `${protocol}://${host}/api/admin/index/structural`;
  const structuralIndex = await fetch(url, { method: 'POST', ...options });
  if (structuralIndex.status === 404) {
    console.log(`Cannot index into ${url}`);
  } else {
    console.log(`Indexing into ${url}`);
    const res = await structuralIndex.json();
    console.log(res);
  }
})();
