//const {Client} = require('@elastic/elasticsearch');
const { Client } = require('@opensearch-project/opensearch');
const configuration = require('./configuration.json');
const readline = require('node:readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function askForConfirmation() {
  return new Promise((resolve) => {
    rl.question('Are you sure you want to proceed? (yes/no) ', (answer) => {
      resolve(answer.trim().toLowerCase() === 'yes');
    });
  });
}

(async () => {
  console.log('Deleting elastic index');
  // Init elastic client
  const client = new Client({
    node: `http://${process.env.SEARCH_HOST || 'localhost'}:9200`, //This is different from Oni since we are talking to it directly
  });
  // Bootstrap index
  const elastic = configuration.api.elastic;
  const index = elastic.index || 'items';
  // Delete
  try {
    const confirmed = await askForConfirmation();
    if (confirmed) {
      const res = await client.indices.exists({
        index,
      });
      if (res.statusCode !== 404) {
        console.log('trying to delete the index');
        await client.indices.delete({
          index
        });
      }
    }
  } catch (e) {
    console.log('index does not exist');
  } finally {
    rl.close();
  }
})();