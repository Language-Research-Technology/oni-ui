#!/usr/bin/env -S node --experimental-strip-types

import { existsSync } from 'node:fs';

import { VocabsIndexer } from './lib/VocabsIndexer.ts';

const vocabs = {
  austalk:
    'https://raw.githubusercontent.com/Language-Research-Technology/language-data-commons-vocabs/master/vocabs/austalk/ro-crate-metadata.json',
  ldacOntology:
    'https://raw.githubusercontent.com/Language-Research-Technology/language-data-commons-vocabs/master/ontology/ro-crate-metadata.json',
  schemaDotOrg: 'https://schema.org/version/latest/schemaorg-current-https.jsonld',
};

const path = process.argv[2];
if (!path) {
  console.error('Output path not provided');
  process.exit(1);
}

const index = new VocabsIndexer();
await index.load(vocabs);
await index.save(path);
