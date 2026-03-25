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

export const GeoCoordinates: Transformer<GeoCoordinatesType> = (L) => ({
  from(entity) {
    const lat = first(entity.latitude);
    const lng = first(entity.longitude);
    if (!lat || !lng) {
      return;
    }

    return L.marker([+lat, +lng]);
  },
});

export const GeoShape: Transformer<GeoShapeType> = (L: LType) => ({
  from: (entity) => {
    const box = first(entity.box) as string | undefined;
    const circle = first(entity.circle) as string | undefined;
    const polygon = first(entity.polygon) as string | undefined;
    const line = first(entity.line) as string | undefined;

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
