'use client';

// block start: library imports
import { useEffect, useRef } from 'react';
import { useMap } from 'react-leaflet';
import { LULC_CLASSES } from './constants';
// block end: library imports

// block start: "worker" component to calculate LULC stats for the full-screen visible map area
export default function FullScreenStatsCalculator({ activeLayer, onStatsCalculated }) {
  const map = useMap();
  const debounceTimeout = useRef(null);

  // block start: effect to set up and tear down map event listeners
  useEffect(() => {
    // block start: exits if no LULC layer is active
    if (!activeLayer) {
      onStatsCalculated(null); // Clear stats if layer is turned off
      return;
    }
    // block end: exits if no LULC layer is active

    // block start: the core calculation logic, moved into a reusable function
    const calculateStats = async () => {
      const bounds = map.getBounds();
      const tileUrlTemplate = `/dhaka_ground_truth_tiles/all_classes_tiles/{z}/{x}/{y}.png`;
      // block start: this section is identical to the other calculators
      const zoom = map.getZoom();
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
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
      const colorCounts = {}; 
      let totalPixels = 0;
      for (let i = 0; i < imageData.length; i += 4) {
        const r = imageData[i]; const g = imageData[i+1]; const b = imageData[i+2]; const a = imageData[i+3];
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
      // block end: this section is identical to the other calculators
      onStatsCalculated(stats);
    };
    // block end: the core calculation logic, moved into a reusable function

    // block start: debounced handler to prevent excessive calculations during map movement
    const debouncedCalculate = () => {
      clearTimeout(debounceTimeout.current);
      debounceTimeout.current = setTimeout(calculateStats, 500); // 500ms delay
    };
    // block end: debounced handler to prevent excessive calculations during map movement

    // block start: attach event listeners and perform initial calculation
    map.on('moveend zoomend', debouncedCalculate);
    calculateStats(); // Calculate stats for the initial view
    // block end: attach event listeners and perform initial calculation

    // block start: cleanup function to remove listeners when component unmounts
    return () => {
      map.off('moveend zoomend', debouncedCalculate);
      clearTimeout(debounceTimeout.current);
    };
    // block end: cleanup function to remove listeners when component unmounts
  }, [map, activeLayer, onStatsCalculated]); // re-runs when the active layer changes

  return null; // this component is invisible
}
// block end: "worker" component to calculate LULC stats for the full-screen visible map area