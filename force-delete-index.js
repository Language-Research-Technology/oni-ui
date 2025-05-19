//const {Client} = require('@elastic/elasticsearch');
const {Client} = require('@opensearch-project/opensearch');
const configuration = require('./configuration.json');
const fetch = require("node-fetch");

(async () => {
  const host = configuration.api.host || 'localhost:8080';
  const protocol = configuration.api.protocol || 'http';
  const adminToken = configuration.api.tokens.admin;
  const options = {
    headers: {
      Authorization: `Bearer ${adminToken}`,
    },
  };
  try {
    const url = `${protocol}://${host}/api/admin/index/structural`;
    const deleteIndex = await fetch(url, {method: 'DELETE', ...options});
    console.log(`Deleting Index: ${url}`);
    if (deleteIndex.status === 404) {
      console.log('Index not found, nothing to delete');
    } else {
      const res = await deleteIndex.json();
      console.log(res);
    }
  } catch (e) {
    console.log('Index does not exist');
  }
  // Init elastic client
  const client = new Client({
    node: 'http://localhost:9200', //This is different from Oni since we are talking to it directly
  });
  // Bootstrap index
  const elastic = configuration.api.elastic;
  const index = elastic.index || 'items';
  // Delete
  try {
    const res = await client.indices.exists({
      index,
    });
    if (res.statusCode !== 404) {
      console.log('trying to delete the index');
      await client.indices.delete({
        index
      });
      console.log('Deleting elastic index');
    } else {
      console.log('index not found');
    }
  } catch (e) {
    console.log('index does not exist');
  }
})();
