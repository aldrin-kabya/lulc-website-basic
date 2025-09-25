// block start: defines LULC class names and colors for the legend
export const LULC_CLASSES = [
  { name: 'Farmland', color: 'rgb(0, 255, 0)' },
  { name: 'Water', color: 'rgb(0, 0, 255)' },
  { name: 'Forest', color: 'rgb(0, 255, 255)' },
  { name: 'Built-Up', color: 'rgb(255, 0, 0)' },
  { name: 'Meadow', color: 'rgb(255, 255, 0)' }
];
// block end: defines LULC class names and colors for the legend

// block start: defines the default base map tile layer
export const tileLayers = {
  default: {
    url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
  }
};
// block end: defines the default base map tile layer

// block start: defines the historical satellite imagery tile layers
export const satelliteLayers = {
  '2025': {
    url: 'https://wayback.maptiles.arcgis.com/arcgis/rest/services/World_Imagery/WMTS/1.0.0/default/MapServer/tile/49999/{z}/{y}/{x}',
    attribution: '&copy; Esri, Maxar, Earthstar Geographics, and the GIS User Community (July 2025)'
  },
  '2024': {
    url: 'https://wayback.maptiles.arcgis.com/arcgis/rest/services/World_Imagery/WMTS/1.0.0/default/MapServer/tile/20337/{z}/{y}/{x}',
    attribution: '&copy; Esri, Wayback (September 2024)'
  },
  '2023': {
    url: 'https://wayback.maptiles.arcgis.com/arcgis/rest/services/World_Imagery/WMTS/1.0.0/default/MapServer/tile/64776/{z}/{y}/{x}',
    attribution: '&copy; Esri, Wayback (August 2023)'
  },
  '2022': {
    url: 'https://wayback.maptiles.arcgis.com/arcgis/rest/services/World_Imagery/WMTS/1.0.0/default/MapServer/tile/45441/{z}/{y}/{x}',
    attribution: '&copy; Esri, Wayback (August 2022)'
  },
  '2021': {
    url: 'https://wayback.maptiles.arcgis.com/arcgis/rest/services/World_Imagery/WMTS/1.0.0/default/MapServer/tile/16749/{z}/{y}/{x}',
    attribution: '&copy; Esri, Wayback (October 2021)'
  },
  '2020': {
    url: 'https://wayback.maptiles.arcgis.com/arcgis/rest/services/World_Imagery/WMTS/1.0.0/default/MapServer/tile/20753/{z}/{y}/{x}',
    attribution: '&copy; Esri, Wayback (November 2020)'
  },
  '2019': {
    url: 'https://wayback.maptiles.arcgis.com/arcgis/rest/services/World_Imagery/WMTS/1.0.0/default/MapServer/tile/11351/{z}/{y}/{x}',
    attribution: '&copy; Esri, Wayback (October 2019)'
  },
  '2018': {
    url: 'https://wayback.maptiles.arcgis.com/arcgis/rest/services/World_Imagery/WMTS/1.0.0/default/MapServer/tile/2168/{z}/{y}/{x}',
    attribution: '&copy; Esri, Wayback (September 2018)'
  },
  '2017': {
    url: 'https://wayback.maptiles.arcgis.com/arcgis/rest/services/World_Imagery/WMTS/1.0.0/default/MapServer/tile/1052/{z}/{y}/{x}',
    attribution: '&copy; Esri, Wayback (April 2017)'
  },
  '2015': {
    url: 'https://wayback.maptiles.arcgis.com/arcgis/rest/services/World_Imagery/WMTS/1.0.0/default/MapServer/tile/15084/{z}/{y}/{x}',
    attribution: '&copy; Esri, Wayback (March 2015)'
  }
};
// block end: defines the historical satellite imagery tile layers