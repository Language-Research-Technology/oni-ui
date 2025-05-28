// test/normalize.test.js
const assert = require('assert');
const { ROCrate } = require('ro-crate');
const { normalizeLdac } = require('../lib/normalize.js');

const ldacIri = 'https://w3id.org/ldac/terms#';

// Describe the test suite for normalize.js
describe('normalize.js',  () => {
  it('Should normalize context',  async() => {
    const crate = new ROCrate();
    await crate.importContext('https://w3id.org/ldac/context')
    crate.addContext({"ldac": ldacIri});
    crate.addValues(crate.root, 'subjectLanguage', {"@id":"https://glottolog.org/resource/languoid/id/stan1293"});
    normalizeLdac(crate);
    assert.deepStrictEqual(
      crate.root['ldac:subjectLanguage'],
      { "@id": "https://glottolog.org/resource/languoid/id/stan1293" },
      'normalized subjectLanguage to ldac:subjectLanguage'
    );
  });
});
