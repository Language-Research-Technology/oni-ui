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
  const confirmed = await askForConfirmation();
  try {
    if (confirmed) {
      const host = configuration.api.host || 'localhost:8080';
      const protocol = configuration.api.protocol || 'http';
      const adminToken = configuration.api.tokens.admin;
      const options = {
        headers: {
          Authorization: `Bearer ${adminToken}`,
        },
      };
      const url = `${protocol}://${host}/api/admin/index/structural`;
      const deleteIndex = await fetch(url, { method: 'DELETE', ...options });
      console.log(`Deleting Index: ${url}`);
      if (deleteIndex.status === 404) {
        console.log('Index not found, nothing to delete');
      } else {
        const res = await deleteIndex.json();
        console.log(res);
      }
    }
  } catch (e) {
    console.log('Index does not exist');
  } finally {
    rl.close();
  }
})();
