const configuration = require('./configuration.json');
const fetch = require('node-fetch');
const readline = require('node:readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

const host = configuration.api.host || 'localhost:8080';
const protocol = configuration.api.protocol || 'http';
const adminToken = configuration.api.tokens.admin;
const options = {
  headers: {
    Authorization: `Bearer ${adminToken}`,
  },
};

function askForConfirmation() {
  return new Promise((resolve) => {
    rl.question('Are you sure you want to proceed? (yes/no) ', (answer) => {
      resolve(answer.trim().toLowerCase() === 'yes');
    });
  });
}

(async () => {
  const confirmed = await askForConfirmation();
  rl.close();
  if (confirmed) {
    const objects = process.argv.slice(2);
    if (objects.length > 0) {
      for (const object of objects) {
        await index(object);
      }
    } else {
      await index();
    }
  }
})();

async function index(object) {
  let url = `${protocol}://${host}/api/admin/index/structural`;
  if (object) {
    url += '/' + encodeURIComponent(object);
  }
  const deleteIndex = await fetch(url, { method: 'DELETE', ...options });
  console.log(`Deleting Index: ${url}`);
  if (deleteIndex.status === 404) {
    console.log('Index not found, nothing to delete');
  } else {
    const res = await deleteIndex.json();
    console.log(res);
  }
}
