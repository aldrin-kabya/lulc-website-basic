'use client';

// block start: library imports
import { useState, useEffect } from 'react';
import { useMap, ImageOverlay } from 'react-leaflet';
// block end: library imports

// block start: component that renders an LULC layer clipped to a user-drawn rectangle
export default function ClippedLulcOverlay({ bounds, activeLayer }) {
  // block start: hooks for map access and storing the generated image URL
  const map = useMap();
  const [imageUrl, setImageUrl] = useState(null);
  // block end: hooks for map access and storing the generated image URL

  // block start: effect to generate the clipped image when inputs change
  useEffect(() => {
    // block start: exits early if there is no selected area or active layer
    if (!bounds || !activeLayer) {
      setImageUrl(null);
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

    // block start: main async function to generate the overlay image
    const generateOverlayImage = async () => {
      const zoom = map.getZoom();
      const TILE_SIZE = 256;

      // block start: calculates the pixel dimensions of the selected area
      const northWestPoint = map.project(bounds.getNorthWest(), zoom);
      const southEastPoint = map.project(bounds.getSouthEast(), zoom);
      const canvasWidth = southEastPoint.x - northWestPoint.x;
      const canvasHeight = southEastPoint.y - northWestPoint.y;
      // block end: calculates the pixel dimensions of the selected area

      // block start: determines the range of map tiles needed to cover the area
      const minTileX = Math.floor(northWestPoint.x / TILE_SIZE);
      const maxTileX = Math.floor(southEastPoint.x / TILE_SIZE);
      const minTileY = Math.floor(northWestPoint.y / TILE_SIZE);
      const maxTileY = Math.floor(southEastPoint.y / TILE_SIZE);
      // block end: determines the range of map tiles needed to cover the area

      // block start: builds a list of all required tile URLs
      const tilesToLoad = [];
      for (let x = minTileX; x <= maxTileX; x++) {
        for (let y = minTileY; y <= maxTileY; y++) {
          const tmsY = Math.pow(2, zoom) - 1 - y;
          const url = tileUrlTemplate.replace('{z}', zoom).replace('{x}', x).replace('{y}', tmsY);
          tilesToLoad.push({ url, x, y });
        }
      }
      // block end: builds a list of all required tile URLs

      // block start: fetches all tile images in parallel for efficiency
      const imagePromises = tilesToLoad.map(tile => new Promise((resolve) => {
        const img = document.createElement('img');
        img.crossOrigin = "Anonymous";
        img.onload = () => resolve({ img, tile });
        img.onerror = () => resolve(null);
        img.src = tile.url;
      }));
      const loadedImages = await Promise.all(imagePromises);
      // block end: fetches all tile images in parallel for efficiency

      // block start: creates and draws the fetched tiles onto an in-memory canvas
      const canvas = document.createElement('canvas');
      canvas.width = canvasWidth;
      canvas.height = canvasHeight;
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      
      loadedImages.forEach(loaded => {
        if (loaded) {
          const { img, tile } = loaded;
          const drawX = (tile.x * TILE_SIZE) - northWestPoint.x;
          const drawY = (tile.y * TILE_SIZE) - northWestPoint.y;
          ctx.drawImage(img, drawX, drawY, TILE_SIZE, TILE_SIZE);
        }
      });
      // block end: creates and draws the fetched tiles onto an in-memory canvas
      
      setImageUrl(canvas.toDataURL());
    };
    // block end: main async function to generate the overlay image

    generateOverlayImage();

  }, [bounds, activeLayer, map]);
  // block end: effect to generate the clipped image when inputs change

  // block start: renders nothing if the image isn't ready
  if (!imageUrl || !bounds) {
    return null;
  }
  // block end: renders nothing if the image isn't ready

  // block start: renders the generated image as an overlay on the map
  return (
    <ImageOverlay
      url={imageUrl}
      bounds={bounds}
      opacity={0.7}
      zIndex={1000}
    />
  );
  // block end: renders the generated image as an overlay on the map
}
// block end: component that renders an LULC layer clipped to a user-drawn rectangle