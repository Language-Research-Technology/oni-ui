import { first } from '@/tools';
import { GeoCoordinates, GeoShape } from './geo_schema';
import type { GeoEntity, LType } from './geo_types';
import { Geometry } from './geo_wkt';

export default (L: LType, entity: GeoEntity) => {
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
      // @ts-expect-error GeoEntity is not assignable to schema-dts transformer types
      return transformer.from(entity);
    },
  };
};
