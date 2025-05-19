const { Client } = require('@opensearch-project/opensearch');
const configuration = require('./configuration.json');

(async () => {
  console.log('Configuring elastic');
  // Init elastic client
  const elastic = configuration?.api?.elastic;
  const client = new Client({
    node: 'http://localhost:9200', //This is different from Oni since we are talking to it directly
  });

  // Put Settings
  const result = await client.indices.put_settings({
    index: elastic?.index || 'items',
    body: {
      index: {
        max_result_window: elastic.max_result_window,
      },
    },
  });
  console.log(JSON.stringify(result, null, 2));
  console.log('Index Settings:');
  const indexSettings = await client.indices.getSettings();
  console.log(JSON.stringify(settings, null, 2));

  //Cluster settings
  await client.cluster.put_settings({
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
  const cluster = await client.cluster.getSettings();
})();
