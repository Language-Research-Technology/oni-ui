export * as L from 'leaflet';

import * as L from 'leaflet';

export type LType = typeof L;
type Transformers = 'GeoCoordinates' | 'GeoShape' | 'Geometry' | 'http://www.opengis.net/ont/geosparql#Geometry';
export type GeoEntity = {
  '@id': string;
  '@type': Transformers;
  asWKT?: string;
  'http://www.opengis.net/ont/geosparql#asWKT'?: string;
  'geo:asWKT'?: string;
};

export type Transformer<T> = (L: LType) => {
  from: (entity: T) => L.Path | L.Layer | undefined;
};

type NumberedIconOptions = {
  number: number | string;
};

export const NumberedDivIcon = L.Icon.extend({
  options: {
    iconRetinaUrl: new URL('@/assets/marker-empty-icon.png', import.meta.url).href,
    iconUrl: new URL('@/assets/marker-empty-icon.png', import.meta.url).href,
    shadowUrl: new URL('@/assets/marker-empty-icon.png', import.meta.url).href,
    number: '',
    iconSize: new L.Point(25, 40),
    iconAnchor: new L.Point(12, 16),
    popupAnchor: new L.Point(0, -13),
    className: 'leaflet-div-icon',
  },
  createIcon: function () {
    const div = document.createElement('div');
    const img = this._createImg(this.options.iconUrl);
    const numdiv = document.createElement('div');

    numdiv.setAttribute('class', 'number');
    numdiv.innerHTML = this.options.number || '';
    div.appendChild(img);
    div.appendChild(numdiv);
    this._setIconStyles(div, 'icon');

    return div;
  },
  //you could change this to add a shadow like in the normal marker if you really wanted
  createShadow: () => null,
}) as new (
  options: NumberedIconOptions,
) => L.Icon;

export const LocationDivIcon = L.Icon.extend({
  options: {
    ref: '<a href="https://www.flaticon.com/free-icons/red" title="red icons">Red icons created by hqrloveq - Flaticon</a>',
    iconSize: [24, 26], // size of the icon
    shadowSize: null, // size of the shadow
    iconAnchor: [0, 0], // point of the icon which will correspond to marker's location
    shadowAnchor: null, // the same for the shadow
    popupAnchor: [0, 0], // point from which the popup should open relative to the iconAnchor
  },
});
