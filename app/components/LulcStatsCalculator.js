'use client';

// block start: library imports
import { useState, useEffect } from 'react';
import { useMap } from 'react-leaflet';
import { LULC_CLASSES } from './constants';
// block end: library imports

// block start: "worker" component to calculate LULC stats for the selected area in the background
export default function LulcStatsCalculator({ bounds, onStatsCalculated }) {
  const map = useMap();

  // block start: effect to run the calculation when bounds change
  useEffect(() => {
    // block start: exits and clears stats if no area is selected
    if (!bounds) {
      onStatsCalculated(null);
      return;
    }
    // block end: exits and clears stats if no area is selected

    // block start: defines the URL for the 'all classes' data source
    const tileUrlTemplate = '/dhaka_ground_truth_tiles/all_classes_tiles/{z}/{x}/{y}.png';
    // block end: defines the URL for the 'all classes' data source

    // block start: main async function to generate stats
    const generateStats = async () => {
      // block start: this part is identical to what is in ClippedLulcOverlay component
      const zoom = map.getZoom(); // Get the zoom level at the moment of calculation
      const TILE_SIZE = 256;
      
      const northWestPoint = map.project(bounds.getNorthWest(), zoom);
      const southEastPoint = map.project(bounds.getSouthEast(), zoom);
      const canvasWidth = southEastPoint.x - northWestPoint.x;
      const canvasHeight = southEastPoint.y - northWestPoint.y;

      const minTileX = Math.floor(northWestPoint.x / TILE_SIZE);
      const maxTileX = Math.floor(southEastPoint.x / TILE_SIZE);
      const minTileY = Math.floor(northWestPoint.y / TILE_SIZE);
      const maxTileY = Math.floor(southEastPoint.y / TILE_SIZE);
      
      const tilesToLoad = [];
      for (let x = minTileX; x <= maxTileX; x++) {
        for (let y = minTileY; y <= maxTileY; y++) {
          const tmsY = Math.pow(2, zoom) - 1 - y;
          const url = tileUrlTemplate.replace('{z}', zoom).replace('{x}', x).replace('{y}', tmsY);
          tilesToLoad.push({ url, x, y });
        }
      }

      const imagePromises = tilesToLoad.map(tile => new Promise((resolve) => {
        const img = document.createElement('img');
        img.crossOrigin = "Anonymous";
        img.onload = () => resolve({ img, tile });
        img.onerror = () => resolve(null);
        img.src = tile.url;
      }));
      const loadedImages = await Promise.all(imagePromises);

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
      // block end: this part is identical to what is in ClippedLulcOverlay component
      
      // block start: pixel analysis logic
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
      const colorCounts = {}; 
      let totalPixels = 0;

      for (let i = 0; i < imageData.length; i += 4) {
        const r = imageData[i];
        const g = imageData[i+1];
        const b = imageData[i+2];
        const a = imageData[i+3];
        if (a === 255) {
          const colorString = `rgb(${r}, ${g}, ${b})`;
          colorCounts[colorString] = (colorCounts[colorString] || 0) + 1;
          totalPixels++;
        }
      }

      const stats = LULC_CLASSES.map(cls => {
        const count = colorCounts[cls.color] || 0;
        const percentage = totalPixels > 0 ? (count / totalPixels) * 100 : 0;
        return { name: cls.name, color: cls.color, percentage: percentage };
      }).filter(cls => cls.percentage > 0.1);
      // block end: pixel analysis logic
      
      // block start: sends the calculated stats up to the parent component
      onStatsCalculated(stats);
      // block end: sends the calculated stats up to the parent component
    };
    // block end: main async function to generate stats
    
    generateStats();
  }, [bounds, map, onStatsCalculated]); // block end: re-runs calculation when bounds change

  return null; // this component is invisible
}
// block end: "worker" component to calculate LULC stats for the selected area in the background