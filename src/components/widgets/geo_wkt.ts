// @ts-nocheck
// FIXME: fix types

const reRoot = /^(<.+>\s+)?(\w+)\s*(\(.+\))$/s;

/**
 * Read a WKT formatted string and return a leaflet layer object
 */
function read(L: Object, wkt: string, number: number) {
  const m = wkt.trim().match(reRoot);
  const [, _srs, type = '', data] = m ?? [];
  if (!type || !data) return;
  const points = parsePoints(data);
  switch (type.toUpperCase()) {
    case 'POINT':
      if (number > 1) {
        return L.marker(points[0], {
          icon: new L.NumberedDivIcon({ number }),
        });
      }

      return L.marker(points[0], {
        icon: new L.LocationDivIcon(),
      });
    case 'LINESTRING':
      return L.polyline(points, { kind: 'line' });
    case 'POLYGON': {
      const box = polygonToBox(points);
      if (box) {
        return L.rectangle(box, { kind: 'box' });
      }
      return L.polygon(points, { kind: 'polygon' });
    }
    case 'CIRCLE': {
      let [[latlng], radius] = points;
      if (!radius) radius = 2;
      if (radius) radius = radius / 2.5; //half it for now
      if (number > 1) {
        return L.circle(latlng, { kind: 'circle', radius, weight: 1 });
      }
      return L.circle(latlng, { kind: 'circle', radius, weight: 1 });
    }
    default:
      break;
  }
}

/**
 * Parse points to a nested arrays of [latitude,longitude]
 * Default order of the input coordinates follows WGS 84 which is longitude-latitude.
 */
function parsePoints(text: string, latlng) {
  const parents = [];
  let current;
  let prev;
  let ptext = '';
  for (const c of text) {
    switch (c) {
      case '(':
        ptext = '';
        if (current) parents.push(current);
        current = [];
        break;
      case ')':
      case ',':
        if (ptext) {
          const point = ptext.trim().split(/\s+/);
          if (point.length > 1) {
            let lat;
            let lng;
            if (latlng) [lat, lng] = point;
            else [lng, lat] = point;
            if (lng && lat) current.push([+lat, +lng]);
          } else {
            current.push(+point[0]);
          }
          ptext = '';
        } else if (prev) {
          current.push(prev);
          prev = null;
        }
        if (c === ')') {
          prev = current;
          if (parents.length) current = parents.pop();
        }
        break;
      default:
        ptext += c;
        break;
    }
  }
  return current;
}

/**
 * Check if a polygon is a rectangle and return the bottom left and top right corner coordinates
 */
function polygonToBox(polygons: Array): L.LatLngTuple[] {
  if (polygons.length !== 1) return;
  const polygon = polygons[0];
  if (polygon.length === 5) {
    const lats = [];
    const lngs = [];
    for (let i = 0; i < 4; ++i) {
      if (polygon[i][0] === polygon[i + 1][0]) lats.push(polygon[i][0]);
      else if (polygon[i][1] === polygon[i + 1][1]) lngs.push(polygon[i][1]);
    }
    if (lats.length === 2 && lngs.length === 2) {
      const [bottom, top] = lats.sort();
      const [left, right] = lngs.sort();
      return [
        [+bottom, +left],
        [+top, +right],
      ];
    }
  }
}

/**
 * Build WKT string with WGS 84 longitude-latitude as default SRS
 */
function writer(L) {
  const writers = [
    [
      L.Marker,
      (l) => {
        const p = l.getLatLng();
        return `POINT (${p.lng} ${p.lat})`;
      },
    ],
    [
      L.Rectangle,
      (l) => {
        const bounds = l.getBounds();
        if (bounds.isValid()) {
          const n = bounds.getNorth();
          const e = bounds.getEast();
          const s = bounds.getSouth();
          const w = bounds.getWest();
          const points = [
            [w, s],
            [w, n],
            [e, n],
            [e, s],
            [w, s],
          ]
            .map((p) => p.join(' '))
            .join(', ');
          return `POLYGON ((${points}))`;
        }
      },
    ],
    [
      L.Polygon,
      (l) => {
        const points = l
          .getLatLngs()
          .map((p) => {
            p.push(p[0]);
            return p;
          })
          .map((p) => `(${p.map((c) => `${c.lng} ${c.lat}`).join(', ')})`)
          .join(', ');
        return `POLYGON (${points})`;
      },
    ],
    [
      L.Polyline,
      (l) => {
        const points = l
          .getLatLngs()
          .map((c) => `${c.lng} ${c.lat}`)
          .join(', ');
        return `LINESTRING (${points})`;
      },
    ],
    [
      L.Circle,
      (l) => {
        const p = l.getLatLng();
        const r = l.getRadius();
        return `CIRCLE ((${p.lng} ${p.lat}), ${r})`;
      },
    ],
  ];
  return (layer) => {
    for (const [c, fn] of writers) {
      if (layer instanceof c) {
        return fn(layer);
      }
    }
  };
}

export function Geometry(L) {
  /**
   * Build WKT string with WGS 84 longitude-latitude as default SRS
   */
  const write = writer(L);

  return {
    //shapes: ['point', 'line', 'box', 'circle', 'polygon'],
    shapes: ['point', 'box', 'polygon'],
    from(entity) {
      const wkt = entity['http://www.opengis.net/ont/geosparql#asWKT'] || entity.asWKT || entity['geo:asWKT'] || [];
      return read(L, wkt);
    },
    to(shape, entity = {}) {
      entity.asWKT = write(shape);
      return entity;
    },
  };
}
