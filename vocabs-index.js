const { VocabsIndexer } = require('./lib/VocabsIndexer.js');
const host = 'http://localhost:9200';

const vocabs = {
  austalk:
    'https://raw.githubusercontent.com/Language-Research-Technology/language-data-commons-vocabs/master/vocabs/austalk/ro-crate-metadata.json',
  ldacOntology:
    'https://raw.githubusercontent.com/Language-Research-Technology/language-data-commons-vocabs/master/ontology/ro-crate-metadata.json',
  schemaDotOrg: 'https://schema.org/version/latest/schemaorg-current-https.jsonld',
};

(async () => {
  const index = new VocabsIndexer({ elasticUrl: host, log: true });
  await index.delete();
  await index.load({ vocabs });
})();
