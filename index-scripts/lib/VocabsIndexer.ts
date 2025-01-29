import { writeFileSync } from 'node:fs';

type VocabType = {
  '@graph': { '@id': string; 'rdfs:comment'?: string }[];
};

export class VocabsIndexer {
  private output: Record<string, string>;

  constructor() {
    this.output = {};
  }

  async load(vocabs: Record<string, string>) {
    for (const [name, url] of Object.entries(vocabs)) {
      console.log(`Loading ${name}`);

      const data = (await this.fetchDataPack(url)) as VocabType;

      for (const vocab of data['@graph']) {
        const key = vocab['@id'];
        if (['ro-crate-metadata.json', './'].includes(key)) {
          continue;
        }

        const def = vocab['rdfs:comment'];

        if (def) {
          this.output[key] = def;
        }
      }
    }
  }

  async save(outputPath: string) {
    return writeFileSync(outputPath, JSON.stringify(this.output, null, 2));
  }

  async fetchDataPack(url: string) {
    console.log('🪚 string:', JSON.stringify(url, null, 2));
    const response = await fetch(url);

    if (response.status !== 200) {
      console.error(`Unable to fetch vocabs pack: '${url}'`);

      return {};
    }

    const data = await response.json();
    return data;
  }
}
