import { wktToGeoJSON } from '@terraformer/wkt';
import type { Position } from 'geojson';
import { type GeoEntity, LocationDivIcon, type LType, type Transformer } from './geo_types';

// biome-ignore lint/style/noNonNullAssertion: we don't care if they are defined here we just need to swap them
const convertCoords = ([lng, lat]: Position): L.LatLngTuple => [lat!, lng!];

/**
 * Read a WKT formatted string and return a leaflet layer object
 */
const read = (L: LType, wkt: string): L.Path | L.Layer | undefined => {
  const geo = wktToGeoJSON(wkt);

  const type = geo.type;

  switch (type) {
    case 'Point': {
      const point = convertCoords(geo.coordinates);

      return L.marker(point, {
        icon: new LocationDivIcon(),
      });
    }
    case 'LineString': {
      const points = geo.coordinates.map(convertCoords);

      return L.polyline(points);
    }
    case 'Polygon': {
      const points = geo.coordinates.map((ring) => ring.map(convertCoords));

      return L.polygon(points);
    }
    default:
      console.warn(`WKT type ${type} not supported`);
      break;
  }
};

export const Geometry: Transformer<GeoEntity> = (L) => {
  /**
   * Build WKT string with WGS 84 longitude-latitude as default SRS
   */
  return {
    from(entity) {
      const wkt = entity['http://www.opengis.net/ont/geosparql#asWKT'] || entity.asWKT || entity['geo:asWKT'] || '';
      return read(L, wkt);
    },
  };
};
