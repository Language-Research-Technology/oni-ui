#!/usr/bin/env -S node --experimental-strip-types

import { writeFileSync } from 'node:fs';

const vocabs = {
  austalk:
    'https://raw.githubusercontent.com/Language-Research-Technology/language-data-commons-vocabs/master/vocabs/austalk/ro-crate-metadata.json',
  ldacOntology:
    'https://raw.githubusercontent.com/Language-Research-Technology/language-data-commons-vocabs/master/ontology/ro-crate-metadata.json',
  schemaDotOrg: 'https://schema.org/version/latest/schemaorg-current-https.jsonld',
} as const;

type VocabType = {
  '@graph': { '@id': string; 'rdfs:comment'?: string }[];
};

const output: Record<string, string> = {};

const fetchDataPack = async (url: string) => {
  const response = await fetch(url);

  if (response.status !== 200) {
    console.error(`Unable to fetch vocabs pack: '${url}'`);

    return {};
  }

  const data = await response.json();
  return data;
};

const outputPath = process.argv[2];
if (!outputPath) {
  console.error('Output path not provided');
  process.exit(1);
}

for (const [name, url] of Object.entries(vocabs)) {
  console.log(`Loading ${name}`);

  const data = (await fetchDataPack(url)) as VocabType;

  for (const vocab of data['@graph']) {
    const key = vocab['@id'];
    if (['ro-crate-metadata.json', './'].includes(key)) {
      continue;
    }

    const def = vocab['rdfs:comment'];

    if (def) {
      output[key] = def;
    }
  }
}

writeFileSync(outputPath, JSON.stringify(output));
