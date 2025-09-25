'use client';

// block start: library imports
import { useState, useEffect } from 'react';
import { LULC_CLASSES } from './constants';
import '../css/LegendControl.css';
// block end: library imports

// block start: component to manage the LULC legend's visibility and behavior
export default function LegendControl({ showControl }) {
  const [isLegendVisible, setIsLegendVisible] = useState(false);

  // block start: effect to hide the legend if the LULC layer is turned off
  useEffect(() => {
    if (!showControl) {
      setIsLegendVisible(false);
    }
  }, [showControl]);
  // block end: effect to hide the legend if the LULC layer is turned off

  // block start: renders nothing if the control is globally hidden
  if (!showControl) {
    return null;
  }
  // block end: renders nothing if the control is globally hidden

  // block start: renders the legend panel if it is set to be visible
  if (isLegendVisible) {
    return (
      <div className="lulc-legend" onClick={() => setIsLegendVisible(false)}>
        {LULC_CLASSES.map(item => (
          <div key={item.name} className="legend-item">
            <span className="legend-color-box" style={{ backgroundColor: item.color }}></span>
            <span className="legend-label">{item.name}</span>
          </div>
        ))}
      </div>
    );
  }
  // block end: renders the legend panel if it is set to be visible

  // block start: renders the "Show legend" button by default
  return (
    <button className="show-legend-button" onClick={() => setIsLegendVisible(true)}>
      Show legend
    </button>
  );
  // block end: renders the "Show legend" button by default
};
// block end: component to manage the LULC legend's visibility and behavior