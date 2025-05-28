
const ldacIri = 'https://w3id.org/ldac/terms#';
const prefix = 'ldac:';

export function normalizeLdac(ocflCrate) {

  for(let entity of ocflCrate.entities()) {
    for(let prop in entity) {
      //console.log(prop);
      if(prop.startsWith(prefix)) continue;
      if(prop.startsWith('@')) continue;
      const url = ocflCrate.resolveTerm(prop);
      if(url && url.startsWith(ldacIri)) {
        const newProp = url.replace(ldacIri, prefix);
        ocflCrate.addValues(entity, newProp, entity[prop]);
        delete entity[prop];
      }
    }
  }
}
