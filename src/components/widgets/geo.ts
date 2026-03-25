import { first } from '@/tools';
import { GeoCoordinates, GeoShape } from './geo_schema';
import type { LType } from './geo_types';
import { Geometry } from './geo_wkt';

export default (L: LType, entity: { '@type': string[] }) => {
  const transformers = {
    GeoCoordinates: GeoCoordinates(L),
    GeoShape: GeoShape(L),
    Geometry: Geometry(L),
    'http://www.opengis.net/ont/geosparql#Geometry': Geometry(L),
  };

  const entityType = first(entity['@type']) as keyof typeof transformers;
  const transformer = transformers[entityType];
  if (!transformer) {
    throw new Error(`Unknown shape type ${entityType}`);
  }

  return {
    fromEntity() {
      // @ts-expect-error FIXME
      return transformer.from(entity);
    },
  };
};
