'use client';

// block start: library imports
import { useState } from 'react';
import '../css/LayerControls.css';
// block end: library imports

// block start: main layer control panel component
export default function LayerControls({ mapView, toggleMapView, activeLulcLayer, handleLayerToggle }) {

  // block start: state to track hover status of the main button
  const [isHovering, setIsHovering] = useState(false);
  // block end: state to track hover status of the main button

  // block start: main render method for the layer control panel
  return (
    <div className="map-layer-controls">
      {/* block start: renders the primary base map toggle button (Satellite/Default) */}
      <button
        onClick={toggleMapView}
        className="map-type-button"
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={() => setIsHovering(false)}
      >
        <div
          className="toggle-bg"
          style={{ backgroundImage: `url(${mapView === 'default' ? '/satellite-icon.png' : '/default-icon.png'})` }}
        >
          {/* block start: new container for icon and dynamic text */}
          <div className="map-type-content">
            {!isHovering && (
              <svg className="map-type-icon-svg" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 16L2 11L12 6L22 11L12 16Z" stroke="white" strokeWidth="2" strokeLinejoin="round"/>
                <path d="M2 15L12 20L22 15" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            )}
            <span className="toggle-text">
              {isHovering ? (mapView === 'default' ? 'Satellite' : 'Map') : 'Layers'}
            </span>
          </div>
          {/* block end: new container for icon and dynamic text */}
        </div>
      </button>
      {/* block end: renders the primary base map toggle button (Satellite/Default) */}

      {/* block start: renders the hover-reveal panel with LULC class options */}
      <div className="layer-panel">
        <button
          onClick={() => handleLayerToggle('all')}
          className={`layer-option-button ${activeLulcLayer === 'all' ? 'active' : ''}`}
        >
          <img src="/all-classes-icon-2.png" alt="All Classes Layer" />
          <span className="layer-option-text">All classes</span>
        </button>
        <button
          onClick={() => handleLayerToggle('farmland')}
          className={`layer-option-button ${activeLulcLayer === 'farmland' ? 'active' : ''}`}
        >
          <img src="/farmland-icon.png" alt="Farmland Layer" />
          <span className="layer-option-text">Farmland</span>
        </button>
        <button
          onClick={() => handleLayerToggle('water')}
          className={`layer-option-button ${activeLulcLayer === 'water' ? 'active' : ''}`}
        >
          <img src="/water-icon.png" alt="Water Layer" />
          <span className="layer-option-text">Water</span>
        </button>
        <button
          onClick={() => handleLayerToggle('forest')}
          className={`layer-option-button ${activeLulcLayer === 'forest' ? 'active' : ''}`}
        >
          <img src="/forest-icon.png" alt="Forest Layer" />
          <span className="layer-option-text">Forest</span>
        </button>
        <button
          onClick={() => handleLayerToggle('built-up')}
          className={`layer-option-button ${activeLulcLayer === 'built-up' ? 'active' : ''}`}
        >
          <img src="/built-up-icon.png" alt="Built-Up Layer" />
          <span className="layer-option-text">Built-Up</span>
        </button>
        <button
          onClick={() => handleLayerToggle('meadow')}
          className={`layer-option-button ${activeLulcLayer === 'meadow' ? 'active' : ''}`}
        >
          <img src="/meadow-icon.png" alt="Meadow Layer" />
          <span className="layer-option-text">Meadow</span>
        </button>
      </div>
      {/* block end: renders the hover-reveal panel with LULC class options */}
    </div>
  );
  // block end: main render method for the layer control panel
}
// block end: main layer control panel component