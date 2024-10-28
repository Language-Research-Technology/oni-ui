const configuration = require('./configuration.json');
const fetch = require('node-fetch');

(async () => {
  const apiHost = configuration.api.host;
  const adminToken = configuration.api.tokens.admin;
  const options = {
    headers: {
      Authorization: `Bearer ${adminToken}`,
    },
  };
  const url = `${apiHost}/admin/index/structural`;
  const structuralIndex = await fetch(url, { method: 'GET', ...options });
  console.log(`Fetch: ${structuralIndex.status}`);
  const res = await structuralIndex.json();
  console.log(JSON.stringify(res));
})();
