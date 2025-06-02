
const ldacIri = 'https://w3id.org/ldac/terms#';
const prefix = 'ldac:';

function normalizeLdac(ocflCrate, context) {

  for(let entity of ocflCrate.entities()) {
    if(entity['@id'] === 'ro-crate-metadata.json') continue;
    for(let prop in entity) {
      if(prop.startsWith(prefix)) continue;
      if(prop.startsWith('@')) continue;
      const url = findPropertyByKey(context, prop);
      if(url && url[prop]?.startsWith(ldacIri)) {
        const newProp = `${prefix}${prop}`;
        ocflCrate.setProperty(entity, newProp, entity[prop]);
        //ocflCrate.deleteValues(entity, prop, entity[prop] ); // This does not behave the same as deleteProperty (new)
        ocflCrate.deleteProperty(entity, prop);
        // console.log(entity?.communicationMode);
        // console.log(entity?.['ldac:communicationMode']);
      }
    }
  }
}

async function getContext(url) {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch context: ${response.statusText}`);
    }
    const context = await response.json(); // Parse the JSON content
    return context['@context'];
  } catch (error) {
    console.error('Error fetching context:', error.message);
    throw error;
  }
}

function findPropertyByKey(obj, keyToFind) {
  // Loop through the entries of the object
  for (const [key, value] of Object.entries(obj)) {
    if (key === keyToFind) {
      return { [key]: value }; // Return the matching key-value pair as an object
    }
  }
  return null; // Return null if no match is found
}
module.exports = { normalizeLdac, getContext };
