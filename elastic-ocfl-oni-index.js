//const {Client} = require('@elastic/elasticsearch');
const {Client} = require('@opensearch-project/opensearch');
const {Indexer} = require('./lib/Indexer');
const configuration = require('./configuration.json');
const ocfl = require('@ocfl/ocfl-fs');
const fs = require('fs-extra');
const assert = require('node:assert');

(async () => {
  console.log('Configuring elastic');
  // Init elastic client
  const client = new Client({
    node: `http://${process.env.SEARCH_HOST || 'localhost'}:9200`, //This is different from Oni since we are talking to it directly
  });
  // Bootstrap index
  const elastic = configuration.api.elastic;
  // Delete
  try {
    const index = await client.indices.exists({
      index: elastic?.index || 'items',
    });
    if (index) {
      await client.indices.delete({
        index: elastic.index || 'items',
      });
    }
  } catch (e) {
    console.log('index does not exist, creating');
  }
  // Configure mappings
  await client.indices.create({
    index: elastic?.index || 'items',
    body: {
      settings: {
        max_result_window: elastic?.max_result_window || 100000,
        index: {
          mapping: {
            total_fields: elastic.total_fields,
          }
        },
      },
      mappings: elastic.mappings
    }
  });
  const indexConfig = await client.indices.getSettings();
  console.log('Index Settings:');
  console.log(JSON.stringify(indexConfig, null, 2));

  await client.cluster.putSettings({
    body: {
      persistent: {
        'search.max_open_scroll_context': elastic?.maxScroll || 5000,
        // "xpack.monitoring.collection.enabled": false
      },
      transient: {
        'search.max_open_scroll_context': elastic?.maxScroll || 5000,
      },
    },
  });
  const config = await client.cluster.getSettings();
  console.log('Cluster Settings:');
  console.log(JSON.stringify(config, null, 2));
  // Connect to an ocfl-repo

  const ocflConf = configuration.api.ocfl;
  const repository = ocfl.storage({
    root: ocflConf.ocflPath,
    workspace: ocflConf.ocflScratch,
    ocflVersion: '1.1',
    layout: {
      extensionName: '000N-path-direct-storage-layout',
    },
  });
  console.log(repository.root);
  await repository.load();
  // Do we need to skip some collections/objects?
  let skipCollections = [];
  const skipConfiguration = './index.skip.json';
  if (await fs.exists(skipConfiguration)) {
    skipCollections = await fs.readJson(skipConfiguration, 'utf-8');
    assert(Array.isArray(skipCollections), `${skipConfiguration} not an array of strings, please fix.`);
  }
  // Create an Indexer and index collections
  const indexer = new Indexer({configuration, repository, client});
  await indexer.findOcflObjects({memberOf: null, conformsTo: indexer.conformsToCollection, skip: skipCollections});
})
();
