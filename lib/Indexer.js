const path = require('node:path');
const fs = require('fs-extra');
const fetch = require('node-fetch');
const { first, isEmpty, remove, clone } = require('lodash');
const sanitize = require('sanitize-filename');
const turf = require('@turf/turf');
const Wkt = require('wicket');
const { ROCrate } = require('ro-crate');
const { getLogger } = require('./logger');

/**
 * Class to create an elastic Oni indexer
 */
class Indexer {
  /**
   * Oni configuration, OCFL repository, elastic client
   * @param configuration
   * @param repository
   * @param client
   */
  constructor({ configuration, repository, client }) {
    this.configuration = configuration;
    this.host = this.configuration.api.host || 'localhost:8080';
    this.protocol = this.configuration.api.protocol || 'http';
    this.token = this.configuration.api?.adminToken;
    this.logFolder = this.configuration.api?.log?.logFolder;
    this.index = this.configuration.api?.elastic?.index;
    this.defaultLicense = this.configuration.api.license?.default || null;
    this.defaultMetadataLicense = this.configuration.api?.license?.defaultMetadata;
    this.conformsToCollection = this.configuration.api.conformsTo.collection;
    this.conformsToObject = this.configuration.api.conformsTo.object;
    this.conformsToNotebook = this.configuration.api.conformsTo.notebook;
    this.repository = repository;
    this.client = client;
    this.log = getLogger();
  }

  /**
   * Writes a log file with the elastic object trying to be indexed
   * @param crateId id being identified
   * @param fileName
   * @param normalItem elastic normalised json
   * @return {Promise<void>}
   */
  async writeLogFile(crateId, fileName, normalItem) {
    this.log.error(`Verify rocrate in ${this.logFolder}`);
    const filename = sanitize(crateId);
    const normalizedPath = path.normalize(path.join(this.logFolder, filename + fileName));
    await fs.writeFile(normalizedPath, JSON.stringify(normalItem, null, 2));
  }

  /**
   * Fetches from the api the objects that conformsTo and are membersOf from the structural index
   * @param conformsTo
   * @param memberOf: can be null or an Id of an object
   * @return {Promise<*>}
   */
  async getObjects({ conformsTo, memberOf }) {
    let url = `${this.protocol}://${this.host}/api/object?memberOf=`;
    if (memberOf) {
      url += `${encodeURIComponent(memberOf)}`;
    }
    if (conformsTo) {
      url += `&conformsTo=${encodeURIComponent(conformsTo)}`;
    }
    url += '&limit=10000'; //TODO: ADD PROPER PAGINATION !!
    this.log.info(url);
    const response = await fetch(url);
    const json = await response.json();
    return json.data;
  }

  /**
   * Fetches from the api the objects that conformsTo and are membersOf from the structural index
   * @param id
   * @return {Promise<*>}
   */
  async getObjectbyId(id) {
    try {
      const url = `${this.protocol}://${this.host}/api/object?id=${encodeURIComponent(id)}`;
      this.log.info(url);
      const response = await fetch(url);
      if (response.status === 200) {
        const json = await response.json();
        return json;
      }
      return null;
    } catch (e) {
      this.log.warn(e.message);
      return null;
    }
  }

  /**
   * Get a File from the OCFL repository and return its contents
   * @param itemId
   * @param filePath
   * @return {Promise<*>}
   */
  async getFile({ itemId, filePath }) {
    try {
      const object = this.repository.object(itemId);
      await object.load();
      const file = await object.getFile({ logicalPath: filePath }).asString();
      return file;
    } catch (e) {
      this.log.error(`get File in Oni with id: ${itemId} not found in: ${filePath}`);
      this.log.error(e.message);
    }
  }

  /**
   * Get a getTextFile from Oni and return its contents
   * @TODO: add token to pass to headers. Not used!
   * @param itemId
   * @param filePath
   * @return {Promise<*>}
   */
  async getTextFile({ itemId, filePath }) {
    if (isEmpty(this.token)) {
      this.log.error('No token for Oni, insert a token in api.adminToken');
    } else {
      try {
        const url = `${this.protocol}://${this.host}/api/stream?id=${encodeURIComponent(itemId)}&path=${encodeURIComponent(filePath)}`;
        this.log.info(url);
        const response = await fetch(url, {
          method: 'post',
          headers: new Headers({
            Authorization: `Basic ${this.token}`,
            'Content-Type': 'application/json',
          }),
        });
        const text = await response.text(); //TODO: is this the response we want?
        return text;
      } catch (e) {
        this.log.error(`getTextFile in Oni with id: ${itemId} not found in: ${filePath}`);
      }
    }
  }

  /**
   * Gets an OCFL object from the apiHost
   * @param id
   * @param getUrid
   * @return {Promise<*>}
   */
  async getOcflObject({ id, getUrid }) {
    let url = `${this.protocol}://${this.host}/api/object/meta?id=${encodeURIComponent(id)}`;
    if (!getUrid) {
      url += '&noUrid';
    }
    this.log.info(url);
    const response = await fetch(url);
    const json = await response.json();
    return json.data ? json.data : json;
  }

  /**
   * Find OCFL Objects from the ReST API and indexCollection and indexObject
   * @param memberOf
   * @param conformsTo
   * @param root
   * @param skip
   * @param collectionStack
   * @return {Promise<void>}
   */
  async findOcflObjects({ memberOf, conformsTo, root, skip = [], collectionStack = [] }) {
    this.log.info(
      `Finding objects that are membersOf ${first(memberOf)?.['@id'] || memberOf} and conformsTo ${conformsTo}`,
    );

    const ocflObjects = await this.getObjects({
      conformsTo: conformsTo,
      memberOf: first(memberOf)?.['@id'] || memberOf,
    });
    let skipRegExp;
    if (skip.length > 0) {
      skipRegExp = new RegExp(skip.join('|'), 'i');
    }
    for (const obj of ocflObjects) {
      const objRoot = root || [
        {
          '@id': obj.crateId,
          '@type': obj['@type'],
          name: [{ '@value': obj.record.name }],
        },
      ];
      if (skipRegExp?.test(obj.crateId)) {
        this.log.info(`Skipping: ${obj.crateId}`);
      } else {
        const objJSON = await this.getOcflObject({
          id: obj.crateId,
          getUrid: false,
        });
        const ocflCrate = new ROCrate(objJSON, { alwaysAsArray: true, resolveLinks: true });

        if (this.validateConformsTo(ocflCrate.rootDataset, this.conformsToCollection)) {
          await this.indexCollection({
            item: ocflCrate.rootDataset,
            crate: ocflCrate,
            crateId: obj.crateId,
            id: obj.crateId,
            root: objRoot,
            collectionMemberOf: memberOf,
            collectionStack,
            isOCFL: true,
          });
        } else if (this.validateConformsTo(ocflCrate.rootDataset, this.conformsToObject)) {
          await this.indexObject({
            item: ocflCrate.rootDataset,
            crate: ocflCrate,
            crateId: obj.crateId,
            id: obj.crateId,
            root: objRoot,
            memberOf: memberOf,
            collectionStack,
            isOCFL: true,
          });
        } else {
          this.log.info('Not a collection or object, not indexing');
        }
        // Also see if this crate has any members via the API
      }
    }
  }

  /**
   * Index Collection
   * @param {Object} params - The parameters object.
   * @param params.item - Item to index
   * @param params.crate
   * @param params.crateId - Crate Id can be the same as id
   * @param params.id -
   * @param params.root -
   * @param params.collectionMemberOf -
   * @param params.collectionStack -
   * @param params.isOCFL -
   * @return {Promise<void>} -
   */
  async indexCollection({ item, crate, crateId, id, root, collectionMemberOf, collectionStack, isOCFL }) {
    this.log.debug(`Indexing collection ${id}`);
    const stack = clone(collectionStack);
    stack.push({ '@id': id, name: { '@value': item?.name } });
    let validLicense = this.validateLicense(item?.license, crate);
    if (!validLicense) {
      //put the default one.
      validLicense = this.defaultLicense;
    }
    if (!validLicense) {
      this.log.error('----------------------------------------------------------------');
      this.log.error(`Skipping indexCollections ${item._crateId}, No License Found`);
      this.log.error('----------------------------------------------------------------');
    } else {
      item.license = validLicense;
      if (!item.memberOf) {
        item._isTopLevel = 'true';
      } else {
        item.memberOf = undefined;
      }
      item.hasPart = undefined;
      item._crateId = crateId; //We need this for the file downloads!
      const normalItem = crate.getTree({ root: item, depth: 1, allowCycle: false });
      normalItem._root = root;
      normalItem._memberOf = collectionMemberOf;
      const metadataLicense = this.metadataLicense(crate);
      normalItem._metadataIsPublic = metadataLicense?.isPublic;
      normalItem._metadataLicense = metadataLicense;
      normalItem._isOCFL = isOCFL ? 'true' : 'false';
      this.indexGeoLocation({ item, crate, normalItem });
      try {
        const { body } = await this.client.index({
          index: this.index,
          id: `${root[0]['@id']}/${crateId}/${id}`,
          body: normalItem,
          refresh: true,
        });
      } catch (e) {
        this.log.error('index normalRoot');
        this.log.error(JSON.stringify(e));
        await this.writeLogFile(crateId, '_normalRoot.json', normalItem);
      }
    }
    const memberOf = [{ '@id': item['@id'], name: [{ '@value': first(item.name) }] }];
    //This next bit was commented out because in some cases the memberOf can be overwhelming with too many children.
    //Maybe it can be turned on per config or per collection?
    // if (collectionMemberOf) {
    //   memberOf = memberOf.concat(collectionMemberOf)
    // }
    // If this crate has explicit members then index them directly
    if (item.hasMember && item.hasMember.length > 0) {
      for (const member of item.hasMember) {
        //this.log.info(`Has locally specified member ${member["@id"]}`);
        // TODO Do we have a copy of this or is it a reference? (like in PARADISEC)
        // TODO is this an object or a collection?
        if (
          this.validateConformsTo(member, this.conformsToCollection) &&
          member['@type'].includes('RepositoryCollection')
        ) {
          await this.indexCollection({
            item: member,
            crate: crate,
            crateId: crateId,
            id: member['@id'],
            root,
            collectionStack: stack,
          });
        } else if (
          this.validateConformsTo(member, this.conformsToObject) &&
          member['@type'].includes('RepositoryObject')
        ) {
          await this.indexObject({
            item: member,
            crate: crate,
            crateId: crateId,
            id: member['@id'],
            root,
            memberOf,
            collectionStack: stack,
          });
        } else {
          this.log.info(`indexCollection: ${member?.['@id']} Not a collection or object, not indexing`);
        }
      }
    } else {
      // Try fetching children from API
      await this.findOcflObjects({ memberOf, conformsTo: this.conformsToCollection, root, collectionStack: stack });
      await this.findOcflObjects({ memberOf, conformsTo: this.conformsToObject, root, collectionStack: stack });
    }
  }

  /**
   * Index Object
   * Indexes valid licensed objects and then calls to license its files from has['Part']
   * @param {Object} params - The parameters object.
   * @param params.item - Item to index
   * @param params.crate
   * @param params.crateId
   * @param params.id
   * @param params.root
   * @param params.memberOf
   * @param params.collectionStack
   * @param params.isOCFL
   * @return {Promise<void>}
   */
  async indexObject({ item, crate, crateId, id, root, memberOf, collectionStack, isOCFL }) {
    this.log.debug(`Indexing Object ${id}`);
    item._crateId = crateId; //We need this for the file downloads!
    let validLicense = this.validateLicense(item?.license || crate.rootDataset?.license, crate); // TODO || member?.license || parent?.license || first(this._root)?.license);
    if (!validLicense) {
      //put the default one.
      validLicense = this.defaultLicense;
    }
    // No default license was set, so skip
    if (!validLicense) {
      this.log.info('----------------------------------------------------------------');
      this.log.info(`Skipping indexObjects ${item._crateId}, No License Found`);
      this.log.info('----------------------------------------------------------------');
    } else {
      item.license = validLicense;
      //item._crateId = crateId; //We need this for the file downloads!
      if (item.memberOf) item.memberOf = undefined;
      const normalItem = crate.getTree({ root: item, depth: 1, allowCycle: false });
      normalItem._memberOf = memberOf;
      normalItem._root = root;
      normalItem._collectionStack = collectionStack;
      normalItem._subCollection = clone(collectionStack);
      normalItem._mainCollection = clone(collectionStack);
      remove(normalItem._subCollection, (i) => first(root)?.['@id'] === i['@id']);
      remove(normalItem._mainCollection, (i) => first(root)?.['@id'] !== i['@id']);
      const metadataLicense = this.metadataLicense(crate);
      normalItem._metadataIsPublic = metadataLicense?.isPublic;
      normalItem._metadataLicense = metadataLicense;
      normalItem._isOCFL = isOCFL ? 'true' : 'false';
      //normalItem._root = {"@value": root['@id']};
      //TODO normalItem._root = this._root;
      //this.log.info(`ABout to index`)
      this.indexGeoLocation({ item, crate, normalItem });
      try {
        //this.log.info(`Indexing ${JSON.stringify(normalItem)}`)
        const { body } = await this.client.index({
          index: this.index,
          id: `${root[0]['@id']}/${crateId}/${id}`,
          body: normalItem,
          refresh: true,
        });
      } catch (e) {
        this.log.info(`Can't index normalItem ${e.toString()}`);
        this.log.error(JSON.stringify(e));
        await this.writeLogFile(crateId, '_normalItem.json', normalItem);
      }
      for (const hasPart of crate.utils.asArray(item.hasPart)) {
        await this.indexFile({
          parent: item,
          crateId: crateId,
          item,
          hasPart,
          crate,
          _memberOf: normalItem._memberOf,
          root,
          collectionStack,
        });
      }
    }
  }

  /**
   * Index File
   * Indexes a file with a valid license, will index its content if its allowed to
   * @param {Object} params - The parameters object.
   * @param params.parent -
   * @param params.crateId
   * @param params.item
   * @param params.hasPart
   * @param params.crate
   * @param params._memberOf
   * @param params.root
   * @param params.collectionStack
   * @return {Promise<void>}
   */
  async indexFile({ parent, crateId, item, hasPart, crate, _memberOf, root, collectionStack }) {
    const fileId = hasPart['@id'];
    const fileItem = crate.getItem(fileId);
    this.log.debug(`Index File: ${fileItem['@id']}`);
    const fileContent = '';
    if (fileItem) {
      fileItem._crateId = crateId;
      let validLicense = this.validateLicense(fileItem.license || item.license || crate.license, crate);
      if (!validLicense) {
        //Try again with its parent or root.
        validLicense = this.validateLicense(item.license || parent?.license, crate);
      }
      if (!validLicense) {
        //put the default one.
        validLicense = this.defaultLicense;
      }
      if (!validLicense) {
        this.log.error('----------------------------------------------------------------');
        this.log.error(`Skipping indexFiles ${fileItem._crateId}, No License Found`);
        this.log.error('----------------------------------------------------------------');
      } else {
        fileItem.license = validLicense;
        fileItem._parent = {
          name: item.name,
          '@id': item['@id'],
          '@type': item['@type'],
        };
        let normalFileItem;
        normalFileItem = crate.getTree({ root: fileItem, depth: 1, allowCycle: false });
        normalFileItem._memberOf = _memberOf;
        normalFileItem._collectionStack = collectionStack;
        normalFileItem._subCollection = clone(collectionStack);
        normalFileItem._mainCollection = clone(collectionStack);
        remove(normalFileItem._subCollection, (i) => first(root)?.['@id'] === i['@id']);
        remove(normalFileItem._mainCollection, (i) => first(root)?.['@id'] !== i['@id']);
        const metadataLicense = this.metadataLicense(crate);
        normalFileItem._metadataIsPublic = metadataLicense?.isPublic;
        normalFileItem._metadataLicense = metadataLicense;
        const reverse = fileItem['@reverse'];

        let canIndexText = true;
        const shouldIndexText = first(validLicense.allowTextIndex);
        if (shouldIndexText === false) {
          canIndexText = false;
        }
        let indexThisFile = false;
        if (reverse?.indexableText && canIndexText) {
          // Decide whether we can index this file with the reverse
          for (const rI of reverse?.indexableText || []) {
            // The reverse doesnt contain all of the properties
            const reverseItem = crate.getItem(rI['@id']);
            const reverseIndexable = reverseItem?.indexableText;
            // Compare the ids of the indexableText with this current fileItem
            indexThisFile = reverseIndexable?.find((r) => r['@id'] === fileItem['@id']);
          }
          if (indexThisFile) {
            if (fileItem.encodingFormat) {
              const encodingArray = crate.utils.asArray(fileItem.encodingFormat);
              const fileItemFormat = encodingArray.find((ef) => {
                if (typeof ef === 'string') return ef.match('text/');
              });
              if (fileItemFormat) {
                const fileContent = await this.getFile({
                  itemId: crate.getRootId(),
                  filePath: fileItem['@id'],
                });
                if (fileContent) {
                  this.log.info(`Indexing content: ${fileItem['@id']}`);
                  //addContent(item['hasFile'], fileItem['@id'], fileContent);
                  normalFileItem._text = fileContent;
                } else {
                  normalFileItem._error = 'file_not_found';
                }
              }
            }
          }
        }
        normalFileItem._root = root;
        try {
          const { body } = await this.client.index({
            index: this.index,
            body: normalFileItem,
            id: `${root[0]['@id']}/${crateId}/${fileId}`, // TODO: does everyone agree?
            refresh: true,
          });
        } catch (e) {
          this.log.debug('Index normalFileItem');
          this.log.error(JSON.stringify(e));
          await this.writeLogFile(crateId, '_normalFileItem.json', normalFileItem);
        }
      }
    } else {
      this.log.warn(`No files for ${hasPart['@id']}`);
    }
  }

  /**
   * Find the license of an item with its id if not and id or undefined return a default license from
   * config, if passed an Id and not found it will also return a default license.
   * @param itemOrId - The parent crate, crateId it should be memberOf and the _memberOf inherited
   * @param crate
   * @returns a license object
   * */
  validateLicense(itemOrId, crate) {
    itemOrId = first(itemOrId);
    let license;
    if (typeof itemOrId === 'string') {
      try {
        itemOrId = crate.getItem(itemOrId);
      } catch (e) {
        this.log.error('Licenses should be @ids of items in rocrate');
        itemOrId = null;
      }
    } else {
      //try to resolve
      try {
        itemOrId = crate.getItem(itemOrId?.['@id']);
      } catch (e) {
        this.log.error(`Licenses not resolved with @id: ${itemOrId?.['@id']}`);
        itemOrId = null;
      }
    }
    return itemOrId;
  }

  /**
   * Validate if it conforms to object/collection with configuration item
   * @param item - object item
   * @param conformsTo - string to compare it with
   * @returns true if item conformsTo, otherwise display error message
   * */
  validateConformsTo(item, conformsTo) {
    let itemConformsTo = false;
    //console.log(item['conformsTo']);
    if (item.conformsTo) {
      for (const c of item.conformsTo) {
        //for consistency all conformsTo have to be an object with an @id
        if (c['@id'] === conformsTo) {
          itemConformsTo = true;
        }
      }
    }
    if (itemConformsTo) {
      return true;
    }
    //this.log.info(`item: ${JSON.stringify(item?.['conformsTo'])} does not conformsTo: ${conformsTo}`);
    return false;
  }

  async indexNotebook({ org, repo, notebookId, crate, binderUrl, notebookRequest }) {
    const notebookItem = crate.getItem(notebookId);
    const conforms = this.validateConformsTo(notebookItem, this.conformsToNotebook);
    const encodingFormat = first(notebookItem.encodingFormat);
    if (conforms && encodingFormat === 'application/x-ipynb+json') {
      const notebookContent = await notebookRequest.get(notebookRequest.from, {
        owner: org,
        repo: repo.name,
        path: notebookId,
      });
      const notebookUrl = `${repo.html_url}/blob/${notebookItem.version || repo.default_branch}/${notebookItem['@id']}`;
      crate.pushValue(notebookItem, 'gitName', repo.name);
      crate.pushValue(notebookItem, 'gitRepo', repo.html_url);
      crate.pushValue(notebookItem, 'url', notebookUrl);
      //crate.pushValue(notebookItem, 'binderLink', `${binderUrl}/${org}/${repo.name}/${notebookItem.version || repo.default_branch}?filepath=${notebookItem['@id']}`);
      crate.pushValue(notebookItem, 'gitOrg', org);
      crate.pushValue(notebookItem, 'gitBranch', notebookItem.version || repo.default_branch);
      crate.pushValue(notebookItem, 'filepath', notebookItem);
      crate.pushValue(notebookItem, 'base64', notebookContent?.data?.content);
      const validCollections = await this.validateCollections(notebookItem);
      notebookItem.input = validCollections;
      const normalNotebook = crate.getTree({ root: crate.getItem(notebookItem['@id']), depth: 1, allowCycle: false });

      try {
        const { body } = await this.client.index({
          index: this.index,
          body: normalNotebook,
          id: notebookUrl, // Notebook URL should be unique
          refresh: true,
        });
      } catch (e) {
        this.log.error(e);
        this.log.debug('Index normalNotebook');
        await this.writeLogFile(name, '_normalNotebook.json', normalNotebook);
      }
    } else {
      this.log.warn(
        `No notebook or not encoded with: application/x-ipynb+json or does not conformsTo ${this.conformsToNotebook}`,
      );
    }
  }

  async validateCollections(notebook) {
    const notebookInputs = notebook.input;
    const inputs = [];
    for await (const i of notebookInputs) {
      const input = await this.getObjectbyId(i['@id']);
      if (input) {
        const conformsTo = input.rootConformsTos.map((c) => {
          return { '@id': c.conformsTo };
        });
        inputs.push({
          '@id': i['@id'],
          crateId: input.crateId,
          name: input.name,
          description: input.description,
          conformsTo: conformsTo,
        });
      }
    }
    return inputs;
  }

  metadataLicense(crate) {
    const metadataDescriptorLicense = crate.getItem('ro-crate-metadata.json')?.license;
    const license = first(metadataDescriptorLicense);
    if (isEmpty(license)) {
      //default to cc-by-4
      return this.defaultMetadataLicense;
    }
    let metadataIsPublic = false;
    metadataIsPublic = first(license?.metadataIsPublic);
    let name;
    if (Array.isArray(license?.name)) {
      name = first(license.name);
    } else {
      name = license?.name;
    }
    return {
      isPublic: metadataIsPublic,
      name: name,
      id: license?.['@id'],
      description: license?.description,
    };
  }

  indexGeoLocation({ item, normalItem }) {
    const loc = first(item.contentLocation);
    const geo = this.calculateCentroid(loc);
    if (geo.centroid) normalItem._centroid = geo.centroid;
    if (geo.original) normalItem._contentLocation = geo.original;
    if (!normalItem._centroid) {
      const loc = first(item.spatialCoverage);
      const geo = this.calculateCentroid(loc);
      if (geo.centroid) normalItem._centroid = geo.centroid;
      if (geo.original) normalItem._contentLocation = geo.original;
    }
  }

  calculateCentroid(loc) {
    let calculatedCentroid;
    let original;
    const geo = first(loc?.geo);
    if (geo?.asWKT) {
      original = first(geo.asWKT);
      if (original.startsWith('POLYGON')) {
        const wkt = new Wkt.Wkt(original);
        const geojson = wkt.toJson();
        const centroid = turf.centroid(geojson);
        const centroidCoords = centroid.geometry.coordinates;
        calculatedCentroid = `POINT(${centroidCoords[0]} ${centroidCoords[1]})`;
      }
      if (original.startsWith('POINT')) {
        calculatedCentroid = original;
      }
    }
    return {
      centroid: calculatedCentroid,
      original: original,
    };
  }
}

module.exports = { Indexer };
