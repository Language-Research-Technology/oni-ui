import type { GeoCoordinates as GeoCoordinatesType, GeoShape as GeoShapeType } from 'schema-dts';
import type { L, LType, Transformer } from './geo_types';

const spaceDelimitedToLatLng = (text: string): L.LatLngTuple[] => {
  const vals = text.split(/\s+/);

  const result: L.LatLngTuple[] = [];
  for (let i = 0; i < vals.length; i += 2) {
    const first = vals[i];
    const second = vals[i + 1];
    if (!first || !second) {
      continue;
    }

    result.push([+first, +second]);
  }

  return result;
};

export const GeoCoordinates: Transformer<GeoCoordinatesType> = (L) => ({
  from(entity) {
    if (!entity.latitude || !entity.longitude) {
      return;
    }

    return L.marker([+entity.latitude, +entity.longitude]);
  },
});

export const GeoShape: Transformer<GeoShapeType> = (L: LType) => ({
  from: (entity) => {
    if (entity.box) {
      return L.rectangle(spaceDelimitedToLatLng(entity.box as string));
    }

    if (entity.circle) {
      const vals = (entity.circle as string).split(' ');
      if (!vals[0] || !vals[1] || !vals[2]) {
        throw new Error(`Invalid circle definition: ${entity.circle}`);
      }

      return L.circle([+vals[0], +vals[1]], { radius: +vals[2] });
    }

    if (entity.polygon || entity.line) {
      return L.polyline(spaceDelimitedToLatLng((entity.polygon as string) || (entity.line as string)));
    }
  },
});
