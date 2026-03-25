import type { GeoCoordinates as GeoCoordinatesType, GeoShape as GeoShapeType } from 'schema-dts';
import { first } from '@/tools';
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

// biome-ignore lint/suspicious/noExplicitAny: schema-dts SchemaValue types are incompatible with first()
const firstVal = (val: any): string | undefined => first(val);

export const GeoCoordinates: Transformer<GeoCoordinatesType> = (L) => ({
  from(entity) {
    const lat = firstVal(entity.latitude);
    const lng = firstVal(entity.longitude);
    if (!lat || !lng) {
      return;
    }

    return L.marker([+lat, +lng]);
  },
});

export const GeoShape: Transformer<GeoShapeType> = (L: LType) => ({
  from: (entity) => {
    const box = firstVal(entity.box);
    const circle = firstVal(entity.circle);
    const polygon = firstVal(entity.polygon);
    const line = firstVal(entity.line);

    if (box) {
      return L.rectangle(spaceDelimitedToLatLng(box));
    }

    if (circle) {
      const vals = circle.split(' ');
      if (!vals[0] || !vals[1] || !vals[2]) {
        throw new Error(`Invalid circle definition: ${circle}`);
      }

      return L.circle([+vals[0], +vals[1]], { radius: +vals[2] });
    }

    if (polygon || line) {
      return L.polyline(spaceDelimitedToLatLng(polygon || line || ''));
    }
  },
});
