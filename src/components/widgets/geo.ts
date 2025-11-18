import { GeoCoordinates, GeoShape } from './geo_schema';
import type { LType } from './geo_types';
import { Geometry } from './geo_wkt';

export default (
  L: LType,
  entity: { '@type': 'GeoCoordinates' | 'GeoShape' | 'Geometry' | 'http://www.opengis.net/ont/geosparql#Geometry' },
) => {
  const transformers = {
    GeoCoordinates: GeoCoordinates(L),
    GeoShape: GeoShape(L),
    Geometry: Geometry(L),
    'http://www.opengis.net/ont/geosparql#Geometry': Geometry(L),
  };

  const transformer = transformers[entity['@type']];
  if (!transformer) {
    throw new Error(`Unknown shape type ${entity['@type']}`);
  }

  return {
    fromEntity() {
      // @ts-expect-error FIXME
      return transformer.from(entity);
    },
  };
};
