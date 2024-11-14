//const {Client} = require("@elastic/elasticsearch");
const { Client } = require('@opensearch-project/opensearch');
const { isString, chunk, flattenDeep } = require('lodash');

class VocabsIndexer {
  constructor({ elasticUrl, chunkSize = 500, log = false }) {
    this.chunkSize = chunkSize;
    this.elasticUrl = elasticUrl;
    this.log = log;
  }

  async delete() {
    const client = new Client({
      node: this.elasticUrl,
    });
    // Delete
    try {
      const index = await client.indices.exists({
        index: 'vocabs',
      });
      if (index) {
        await client.indices.delete({
          index: 'vocabs',
        });
      }
    } catch (e) {
      console.log('Index doesnt exist');
    }
  }

  async load({ vocabs }) {
    const client = new Client({
      node: this.elasticUrl,
    });
    for (const pack of Object.keys(vocabs)) {
      if (this.log) {
        console.log(`Loading ${pack}`);
      }
      if (isString(vocabs[pack]) && vocabs[pack].match(/.*\.json(.*)$/)) {
        const data = await this.fetchDataPack({ pack: vocabs[pack] });
        let graph;
        graph = data['@graph'];
        const chunks = chunk(graph, this.chunkSize);
        for (let chunk of chunks) {
          chunk = chunk.map((c) => {
            return [{ index: { _id: c['@id'], _index: 'vocabs' } }, c];
          });
          chunk = flattenDeep(chunk);
          try {
            await client.bulk({ body: chunk });
          } catch (error) {
            console.log(error.message);
          }
        }
      }
    }
  }

  async fetchDataPack({ pack }) {
    const response = await fetch(pack);
    if (response.status === 200) {
      const data = await response.json();
      return data;
    }
    console.error(`Unable to fetch vocabs pack: '${pack}'`);
    return [];
  }
}

module.exports = {
  VocabsIndexer,
};
