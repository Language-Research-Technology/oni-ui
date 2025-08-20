/** Geo format transformation utils */
import { GeoCoordinates, GeoShape } from './geo_schema';
import { Geometry } from './geo_wkt';

// biome-ignore lint/suspicious/noExplicitAny: moo
export default function (L: any, entity: { '@type': string }) {
  const Transformers = {
    GeoCoordinates: GeoCoordinates(L),
    GeoShape: GeoShape(L),
    Geometry: Geometry(L),
    'http://www.opengis.net/ont/geosparql#Geometry': Geometry(L),
  };

  const transformer = Transformers[entity['@type'] as keyof typeof Transformers];
  if (!transformer) {
    throw new Error(`Unknown shape type ${entity['@type']}`);
  }

  return {
    get shapes() {
      return transformer.shapes;
    },
    fromEntity() {
      return transformer.from(entity);
    },
    // biome-ignore lint/suspicious/noExplicitAny: moo
    toEntity(shape: any) {
      transformer.to(shape, entity);

      return entity;
    },
  };
}
