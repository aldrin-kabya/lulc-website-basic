'use client';

// block start: library imports
import { useEffect } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';
// block end: library imports

// block start: component that renders an LULC layer clipped to a user-drawn rectangle
export default function ClippedLulcOverlay({ bounds, activeLayer }) {
  const map = useMap();

  // block start: effect to create, manage, and remove the custom GridLayer
  useEffect(() => {
    // block start: exits early if there is no selected area or active layer
    if (!bounds || !activeLayer) {
      return;
    }
    // block end: exits early if there is no selected area or active layer

    // block start: data object mapping layer names to their tile URLs
    const tileUrls = {
      'all': '/dhaka_ground_truth_tiles/all_classes_tiles/{z}/{x}/{y}.png',
      'farmland': '/dhaka_ground_truth_tiles/farmland_tiles/{z}/{x}/{y}.png',
      'water': '/dhaka_ground_truth_tiles/water_tiles/{z}/{x}/{y}.png',
      'forest': '/dhaka_ground_truth_tiles/forest_tiles/{z}/{x}/{y}.png',
      'built-up': '/dhaka_ground_truth_tiles/built-up_tiles/{z}/{x}/{y}.png',
      'meadow': '/dhaka_ground_truth_tiles/meadow_tiles/{z}/{x}/{y}.png'
    };
    // block end: data object mapping layer names to their tile URLs

    const tileUrlTemplate = tileUrls[activeLayer];
    if (!tileUrlTemplate) return;

    // block start: define the new custom GridLayer class
    const ClippedGridLayer = L.GridLayer.extend({
      // block start: the core function called by Leaflet for each tile
      createTile: function (coords, done) {
        // block start: store the 'this' context to use inside async callbacks
        const self = this;
        // block end: store the 'this' context to use inside async callbacks

        // block start: create a canvas element for this specific tile
        const tile = L.DomUtil.create('canvas', 'leaflet-tile');
        const ctx = tile.getContext('2d');
        const size = self.getTileSize();
        tile.width = size.x;
        tile.height = size.y;
        // block end: create a canvas element for this specific tile

        // block start: calculate the geographic bounds of the current tile
        const nwPoint = coords.scaleBy(size);
        const tileBounds = L.latLngBounds(
          self._map.unproject(nwPoint, coords.z),
          self._map.unproject(nwPoint.add(size), coords.z)
        );
        // block end: calculate the geographic bounds of the current tile

        // block start: if tile does not intersect selection, return a blank tile
        if (!self.options.selectionBounds.intersects(tileBounds)) {
          done(null, tile);
          return tile;
        }
        // block end: if tile does not intersect selection, return a blank tile

        // block start: if it intersects, load and draw the LULC tile image
        const img = new Image();
        img.crossOrigin = "Anonymous";
        img.onload = () => {
          if (!self._map) {
            return;
          }
          // block start: PIXEL-PERFECT CLIPPING
          ctx.save();

          // block start: convert selection bounds to pixel coordinates relative to the map
          const selectionNw = self._map.project(self.options.selectionBounds.getNorthWest(), coords.z);
          const selectionSe = self._map.project(self.options.selectionBounds.getSouthEast(), coords.z);
          // block end: convert selection bounds to pixel coordinates relative to the map

          // block start: calculate the clipping rectangle's position and size relative to THIS TILE's canvas
          const clipX = selectionNw.x - nwPoint.x;
          const clipY = selectionNw.y - nwPoint.y;
          const clipWidth = selectionSe.x - selectionNw.x;
          const clipHeight = selectionSe.y - selectionNw.y;
          // block end: calculate the clipping rectangle's position and size relative to THIS TILE's canvas
          
          // block start: create and apply the clipping path
          ctx.beginPath();
          ctx.rect(clipX, clipY, clipWidth, clipHeight);
          ctx.clip();
          // block end: create and apply the clipping path

          ctx.drawImage(img, 0, 0, size.x, size.y);

          ctx.restore();
          // block end: PIXEL-PERFECT CLIPPING

          done(null, tile); // Signal that the tile is ready
        };
        img.onerror = () => {
          done(null, tile);
        };

        const tmsY = Math.pow(2, coords.z) - 1 - coords.y;
        img.src = L.Util.template(tileUrlTemplate, { ...coords, y: tmsY });
        
        return tile;
        // block end: if it intersects, load and draw the LULC tile image
      }
      // block end: the core function called by Leaflet for each tile
    });
    // block end: define the new custom GridLayer class

    // block start: create an instance of our new custom layer
    const clippedLayer = new ClippedGridLayer({
      selectionBounds: bounds,
      zIndex: 2,
      opacity: 0.7,
    });
    // block end: create an instance of our new custom layer

    // block start: add the new layer to the map
    clippedLayer.addTo(map);
    // block end: add the new layer to the map

    // block start: cleanup function to remove the layer when inputs change
    return () => {
      map.removeLayer(clippedLayer);
    };
    // block end: cleanup function to remove the layer when inputs change

  }, [bounds, activeLayer, map]);
  // block end: effect to create, manage, and remove the custom GridLayer

  return null; // block start: this component renders directly on the map, not in React's DOM
}
// block end: component that renders an LULC layer clipped to a user-drawn rectangle