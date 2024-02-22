const {Client} = require('@elastic/elasticsearch');
const configuration = require('./lib/config.js');
const notebooksConfig = require('./notebooks.configuration.json');
const {Octokit} = require("octokit")
const {Indexer} = require("./lib/Indexer");
const {ROCrate} = require('ro-crate');

(async () => {
    const client = await initElasticClient();
    const repository = {}
    const indexer = new Indexer({configuration, repository, client});

    const octokit = new Octokit({auth: notebooksConfig.key});
    const {data: {login}} = await octokit.rest.users.getAuthenticated();
    console.log("Hello, %s", login);

    const org = await octokit.request('GET /orgs/{org}/repos', {
      org: notebooksConfig.org,
    });
    for (let repo of org?.data) {
      // const repoData = await octokit.request('GET /repos/{owner}/{repo}', {
      //   owner: notebooksConfig.org,
      //   repo: repo.name
      // });
      let roCrateFile;
      try {
        //This request only supports 1MB with no limits and 1-100MB with some limits, check doco
        roCrateFile = await octokit.request('GET /repos/{owner}/{repo}/contents/{path}', {
          owner: notebooksConfig.org,
          repo: repo.name,
          path: 'ro-crate-metadata.json', // Where are the ro-crates-metadata.json's?
        });
      } catch (e) {
        console.log(`${repo.name} : ro-crate-metadata.json ${e.message}`);
      }
      if (roCrateFile && roCrateFile.data.encoding === 'base64') {
        let buff = Buffer.from(roCrateFile.data.content, 'base64');
        let base64data = buff.toString('utf-8');
        //let jsonCrate;
        try {
          console.log(`Trying: ${repo.name} : ro-crate-metadata.json`);
          const jsonCrate = JSON.parse(base64data);
          const crate = new ROCrate(jsonCrate, {alwaysAsArray: true, resolveLinks: true});
          for (let notebook of crate.utils.asArray(crate.rootDataset.hasPart)) {
            await indexer.indexNotebook({
              org: notebooksConfig.org,
              repo,
              notebookId: notebook['@id'],
              crate,
              binderUrl: notebooksConfig.binderUrl,
              notebookRequest: {get: octokit.request, from: 'GET /repos/{owner}/{repo}/contents/{path}'}
            });
          }
        } catch (e) {
          console.log(e.message);
        }
      }
    }
  }
)();

async function initElasticClient() {
  // Init elastic client
  const client = new Client({
    node: 'http://localhost:9200', //This is different from Oni since we are talking to it directly
  });
  return client;
}
