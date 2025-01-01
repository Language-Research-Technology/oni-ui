// const {Client} = require('@elastic/elasticsearch');
const { Client } = require('@opensearch-project/opensearch');
const { Indexer } = require('./lib/Indexer-remote');
const configuration = require('./configuration.json');
const ocfl = require('@ocfl/ocfl-fs');
const fs = require('fs-extra');
const assert = require('node:assert');
let stop = undefined;

(async () => {
  try {
    //When debugging change stop to limit the indexing to a type integer
    const args = process.argv;
    if (args[2]) {
      stop = Number.parseInt(args[2]);
      console.log('Indexer will stop at: ', stop);
    }
  } catch (e) {
    console.log('Usage: node elastic-remote-indexer.js <STOP_AT_X>');
    console.log('Wrong arguments, indexer will not stop');
  }
  // Init elastic client
  console.log('Configuring elastic');
  const client = new Client({
    node: 'http://localhost:9200', //This is different from Oni since we are talking to it directly
  });
  // Bootstrap index
  const elastic = configuration.api.elastic;
  // Delete
  try {
    const res = await client.indices.exists({
      index: elastic?.index || 'items',
    });
    if (res.statusCode === 404) {
      console.log('Creating Index');
      await client.indices.create({
        index: elastic?.index || 'items',
        body: {
          max_result_window: elastic?.max_result_window,
          mappings: elastic?.mappings,
        },
      });
    }
  } catch (e) {
    console.log('index exist, continue');
  }
  // Do we need to skip some collections/objects?
  let skipCollections = [];
  const skipConfiguration = './index.skip.json';
  if (await fs.exists(skipConfiguration)) {
    skipCollections = await fs.readJson(skipConfiguration, 'utf-8');
    assert(Array.isArray(skipCollections), `${skipConfiguration} not an array of strings, please fix.`);
  }
  // Create an Indexer and index collections
  const indexer = new Indexer({ configuration, client, stop });
  await indexer.getOauthToken();
  await indexer.findOcflObjects({ memberOf: null, conformsTo: indexer.conformsToCollection, skip: skipCollections });
})();
