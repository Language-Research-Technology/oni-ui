// test/normalize.test.js
const assert = require('assert');
const { ROCrate } = require('ro-crate');
const { normalizeLdac, getContext } = require('../lib/normalize.js');

const ldacIri = 'https://w3id.org/ldac/terms#';

// Describe the test suite for normalize.js
describe('normalize.js',  () => {
  it('Should normalize context',  async() => {
    const crate = new ROCrate();
    // await crate.importContext('https://w3id.org/ldac/context')
    crate.addContext({"ldac": ldacIri});
    crate.addValues(crate.root, 'subjectLanguage', {"@id":"https://glottolog.org/resource/languoid/id/stan1293"});
    const context = await getContext('https://w3id.org/ldac/context');
    normalizeLdac(crate, context);
    assert.deepStrictEqual(
      crate.root['ldac:subjectLanguage'],
      { "@id": "https://glottolog.org/resource/languoid/id/stan1293" },
      'normalized subjectLanguage to ldac:subjectLanguage'
    );
  });

  it('Should not normalize context',  async() => {
    const crate = new ROCrate();
    const context = await getContext('https://w3id.org/ldac/context');
    // await crate.importContext('https://w3id.org/ldac/context')
    crate.addContext({"ldac": ldacIri});
    crate.addValues(crate.root, 'datePublished', "2025");
    normalizeLdac(crate, context);
    assert.deepStrictEqual(
      crate.root['ldac:datePublished'],
      undefined,
      'not normalizing to datePublished'
    );
  });
});
