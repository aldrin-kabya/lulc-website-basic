'use client';

// block start: library imports
import { useEffect } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet-side-by-side';
import 'leaflet-side-by-side/layout.css';
import 'leaflet-side-by-side/range.css';
import { satelliteLayers } from './constants';
// block end: library imports

// block start: component to manage the side-by-side comparison slider
export default function CompareLayers({ yearA, yearB }) {
  const map = useMap();

  // block start: effect to create, update, and remove the comparison control
  useEffect(() => {
    // block start: exits early if either year is not defined
    if (!yearA || !yearB) return;
    // block end: exits early if either year is not defined

    const attributionText = `&copy; Esri, Wayback (${yearA} vs ${yearB})`;

    // block start: creates two new Leaflet tile layers for the comparison
    const layerA = L.tileLayer(satelliteLayers[yearA].url, { attribution: attributionText }).addTo(map);
    const layerB = L.tileLayer(satelliteLayers[yearB].url, { attribution: attributionText }).addTo(map);
    // block end: creates two new Leaflet tile layers for the comparison

    // block start: creates the side-by-side control and adds it to the map
    const sideBySideControl = L.control.sideBySide(layerA, layerB).addTo(map);
    // block end: creates the side-by-side control and adds it to the map

    // block start: cleanup function to remove layers and control when component unmounts
    return () => {
      map.removeControl(sideBySideControl);
      if (map.hasLayer(layerA)) map.removeLayer(layerA);
      if (map.hasLayer(layerB)) map.removeLayer(layerB);
    };
    // block end: cleanup function to remove layers and control when component unmounts
  }, [map, yearA, yearB]);

  return null;
}
// block end: component to manage the side-by-side comparison slider