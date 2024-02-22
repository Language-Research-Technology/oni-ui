// const {Client} = require('@elastic/elasticsearch');
const { Client } = require('@opensearch-project/opensearch');
const {Indexer} = require('./lib/Indexer-remote');
const configuration = require('./lib/config');
const ocfl = require("@ocfl/ocfl-fs");
const fs = require("fs-extra");
const assert = require("assert");
const fetch = require("node-fetch");

(async () => {
  console.log('Configuring elastic');
  // Init elastic client
  const client = new Client({
    node: 'http://localhost:9200', //This is different from Oni since we are talking to it directly
  });
  // Bootstrap index
  const elastic = configuration['api']['elastic'];
  // Delete
  try {
    const res = await client.indices.exists({
      index: elastic['index'] || 'items'
    });
    if (res['statusCode'] === 404) {
      console.log('Creating Index')
      await client.indices.create({
        index: elastic['index'],
        body: {
          max_result_window: elastic['max_result_window'],
          mappings: elastic['mappings']
        }
      });
    }
  } catch (e) {
    console.log('index exist, continue');
  }
  // Configure mappings
  // Put Settings
  // elastic.indexConfiguration.highlight = {};
  // await client.indices.putSettings({
  //   index: elastic['index'],
  //   body: elastic['indexConfiguration']
  // });
  //Cluster settings
  const settings = {
    "persistent": {
      "search.max_open_scroll_context": elastic?.maxScroll || 5000,
      // "xpack.monitoring.collection.enabled": false
    },
    "transient": {
      "search.max_open_scroll_context": elastic?.maxScroll || 5000
    }
  }
  await client.cluster.putSettings({body: settings});
  const config = await client.cluster.getSettings();
  // Do we need to skip some collections/objects?
  let skipCollections = [];
  const skipConfiguration = "./index.skip.json"
  if (await fs.exists(skipConfiguration)) {
    skipCollections = await fs.readJson(skipConfiguration, "utf-8");
    assert(Array.isArray(skipCollections), `${skipConfiguration} not an array of strings, please fix.`);
  }
  // Create an Indexer and index collections

  const indexer = new Indexer({configuration, client});
  await indexer.getOauthToken();
  await indexer.findOcflObjects({memberOf: null, conformsTo: indexer.conformsToCollection, skip: skipCollections});
})();

