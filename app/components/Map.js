'use client';

// 1. IMPORT useRef ALONG WITH THE OTHERS
import { useState, useRef, useEffect} from 'react';
import { MapContainer, TileLayer, FeatureGroup, useMap, ImageOverlay } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet-draw/dist/leaflet.draw.css';
import 'leaflet-draw';


// Icon workaround
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
});

// --- NEW DATA SOURCE FOR THE LEGEND ---
const LULC_CLASSES = [
  { name: 'Farmland', color: 'rgb(0, 255, 0)' },
  { name: 'Water', color: 'rgb(0, 0, 255)' },
  { name: 'Forest', color: 'rgb(0, 255, 255)' },
  { name: 'Built-Up', color: 'rgb(255, 0, 0)' },
  { name: 'Meadow', color: 'rgb(255, 255, 0)' }
];

// --- NEW, MORE ADVANCED LEGEND CONTROL COMPONENT ---
const LegendControl = ({ showControl }) => {
  // This component manages its own visibility state
  const [isLegendVisible, setIsLegendVisible] = useState(false);

  // This effect ensures that if the LULC layer is turned off globally,
  // the legend resets to its hidden state.
  useEffect(() => {
    if (!showControl) {
      setIsLegendVisible(false);
    }
  }, [showControl]);

  // Don't render anything if no LULC layer is active
  if (!showControl) {
    return null;
  }

  // If the legend is visible, show it.
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

  // Otherwise, show the button to reveal the legend.
  return (
    <button className="show-legend-button" onClick={() => setIsLegendVisible(true)}>
      Show legend
    </button>
  );
};


// --- UPDATED COMPONENT: ClippedLulcOverlay ---
// This component handles the complex logic of creating a clipped overlay.
const ClippedLulcOverlay = ({ bounds, activeLayer }) => {
  const map = useMap();
  const [imageUrl, setImageUrl] = useState(null);

  useEffect(() => {
    if (!bounds || !activeLayer) {
      setImageUrl(null);
      return;
    }

    const tileUrls = {
      'all': '/dhaka_lulc_tiles/{z}/{x}/{y}.png',
      'farmland': '/farmland_tiles/{z}/{x}/{y}.png',
      'water': '/water_tiles/{z}/{x}/{y}.png',
      'forest': '/forest_tiles/{z}/{x}/{y}.png',
      'built-up': '/built-up_tiles/{z}/{x}/{y}.png',
      'meadow': '/meadow_tiles/{z}/{x}/{y}.png'
    };
    
    const tileUrlTemplate = tileUrls[activeLayer];
    if (!tileUrlTemplate) return;

    const generateOverlayImage = async () => {
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
          // Convert the Leaflet (XYZ) y-coordinate to the TMS y-coordinate
          const tmsY = Math.pow(2, zoom) - 1 - y;
          
          // Use the corrected tmsY in the URL
          const url = tileUrlTemplate.replace('{z}', zoom).replace('{x}', x).replace('{y}', tmsY);
          
          tilesToLoad.push({ url, x, y });
        }
      }

      const imagePromises = tilesToLoad.map(tile => new Promise((resolve) => {
        const img = new Image();
        img.crossOrigin = "Anonymous";
        img.onload = () => resolve({ img, tile });
        img.onerror = () => resolve(null);
        img.src = tile.url;
      }));

      const loadedImages = await Promise.all(imagePromises);

      const canvas = document.createElement('canvas');
      canvas.width = canvasWidth;
      canvas.height = canvasHeight;
      const ctx = canvas.getContext('2d');
      
      loadedImages.forEach(loaded => {
        if (loaded) {
          const { img, tile } = loaded;
          const drawX = (tile.x * TILE_SIZE) - northWestPoint.x;
          const drawY = (tile.y * TILE_SIZE) - northWestPoint.y;
          ctx.drawImage(img, drawX, drawY, TILE_SIZE, TILE_SIZE);
        }
      });
      
      setImageUrl(canvas.toDataURL());
    };

    generateOverlayImage();

  }, [bounds, activeLayer, map]);

  if (!imageUrl || !bounds) {
    return null;
  }
  
  return (
    <ImageOverlay
      url={imageUrl}
      bounds={bounds}
      opacity={0.7}
      zIndex={1000}
    />
  );
};

// Tile Layer URLs and Attributions
const tileLayers = {
  default: {
    url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
  }
};
const satelliteLayers = {
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

const CustomDrawButton = () => {
  const map = useMap();
  const startDrawing = () => new L.Draw.Rectangle(map).enable();
  return (
    <button onClick={startDrawing} className="custom-draw-button">
      Select Area
    </button>
  );
};

export default function Map() {
  const [bounds, setBounds] = useState(null);
  const [mapView, setMapView] = useState('default');
  const [activeLulcLayer, setActiveLulcLayer] = useState(null);
  const [selectedYear, setSelectedYear] = useState('2025');
  const featureGroupRef = useRef(null);

  const handleDrawCreated = (e) => {
    const layer = e.layer;
    if (featureGroupRef.current) {
      featureGroupRef.current.clearLayers();
    }
    featureGroupRef.current.addLayer(layer);
    setBounds(layer.getBounds()); // Set the bounds state, which will trigger the ClippedLulcOverlay
  };

  const clearSelection = () => {
    if (featureGroupRef.current) featureGroupRef.current.clearLayers();
    setBounds(null);
    setActiveLulcLayer(null); 
  };

  const toggleMapView = () => {
    setMapView(currentView => currentView === 'default' ? 'satellite' : 'default');
  };

  const handleLayerToggle = (layerName) => {
    setActiveLulcLayer(currentLayer => (currentLayer === layerName ? null : layerName));
  };

  const MapEvents = () => {
    const map = useMap();
    useEffect(() => {
      map.on(L.Draw.Event.CREATED, handleDrawCreated);
      return () => { map.off(L.Draw.Event.CREATED); };
    }, [map]);
    return null;
  };

  return (
    <div>
      {/* It will appear if the "Show legend" button is clicked */}
      <LegendControl showControl={activeLulcLayer === 'all'} />

      {bounds && (
        <div className="info-box">
          <h3>Selected Area Coordinates</h3>
          <div>
            {/* --- THIS IS THE FIX --- */}
            {/* Use Leaflet's methods to get the corner coordinates */}
            <p><strong>Top Left:</strong> {bounds.getNorthWest().lat.toFixed(4)}, {bounds.getNorthWest().lng.toFixed(4)}</p>
            <p><strong>Bottom Right:</strong> {bounds.getSouthEast().lat.toFixed(4)}, {bounds.getSouthEast().lng.toFixed(4)}</p>
          </div>
          <button onClick={clearSelection} className="reset-button">
            Clear Selection
          </button>
        </div>
      )}

      {/* --- UPDATED DROPDOWN MENU UI --- */}
      <div className="year-selector-container">
        {/* 1. Add the new "Year" label */}
        <span className="year-selector-label">Year</span>
        
        <select 
          className="year-selector"
          value={selectedYear}
          onChange={(e) => setSelectedYear(e.target.value)}
        >
          {/* 2. Sort the years in descending order before mapping */}
          {Object.keys(satelliteLayers)
            .sort((a, b) => b - a) 
            .map(year => (
              <option key={year} value={year}>
                {/* 3. Remove "Satellite" text, leaving only the year */}
                {year}
              </option>
          ))}
        </select>
      </div>
      
      {/* --- NEW, RESTRUCTURED CONTROLS --- */}
      <div className="map-layer-controls">
        {/* The main button that is always visible */}
        <button
          onClick={toggleMapView}
          className="map-type-button"
          // title={mapView === 'default' ? 'Switch to Satellite View' : 'Switch to Default View'}
        >
          <div 
            className="toggle-bg"
            style={{ backgroundImage: `url(${mapView === 'default' ? '/satellite-icon.png' : '/default-icon.png'})` }}
          >
            <span className={`toggle-text ${mapView === 'default' ? 'text-white' : 'text-black'}`}>
              {mapView === 'default' ? 'Satellite' : 'Default'}
            </span>
          </div>
        </button>
        
        {/* The panel that appears on hover */}
        <div className="layer-panel">
          <button
            onClick={() => handleLayerToggle('all')}
            className={`layer-option-button ${activeLulcLayer === 'all' ? 'active' : ''}`}
            // title="Toggle All Classes Layer"
          >
            <img src="/all-classes-icon-2.png" alt="All Classes Layer"/>
            <span className="layer-option-text">All classes</span>
          </button>
          <button
            onClick={() => handleLayerToggle('farmland')}
            className={`layer-option-button ${activeLulcLayer === 'farmland' ? 'active' : ''}`}
            // title="Toggle Farmland Layer"
          >
            <img src="/farmland-icon.png" alt="Farmland Layer"/>
            <span className="layer-option-text">Farmland</span>
          </button>
          <button
            onClick={() => handleLayerToggle('water')}
            className={`layer-option-button ${activeLulcLayer === 'water' ? 'active' : ''}`}
            // title="Toggle Water Layer"
          >
            <img src="/water-icon.png" alt="Water Layer"/>
            <span className="layer-option-text">Water</span>
          </button>
          <button
            onClick={() => handleLayerToggle('forest')}
            className={`layer-option-button ${activeLulcLayer === 'forest' ? 'active' : ''}`}
            // title="Toggle Forest Layer"
          >
            <img src="/forest-icon.png" alt="Forest Layer"/>
            <span className="layer-option-text">Forest</span>
          </button>
          <button
            onClick={() => handleLayerToggle('built-up')}
            className={`layer-option-button ${activeLulcLayer === 'built-up' ? 'active' : ''}`}
            // title="Toggle Built-Up Layer"
          >
            <img src="/built-up-icon.png" alt="Built-Up Layer"/>
            <span className="layer-option-text">Built-Up</span>
          </button>
          <button
            onClick={() => handleLayerToggle('meadow')}
            className={`layer-option-button ${activeLulcLayer === 'meadow' ? 'active' : ''}`}
            // title="Toggle Meadow Layer"
          >
            <img src="/meadow-icon.png" alt="Meadow Layer"/>
            <span className="layer-option-text">Meadow</span>
          </button>
        </div>
      </div>

      <MapContainer 
        center={[23.7808405, 90.419689]}
        zoom={12}
        style={{ height: '100vh', width: '100%' }}
      >
        {mapView === 'default' ? (
          <TileLayer url={tileLayers.default.url} attribution={tileLayers.default.attribution} />
        ) : (
          <TileLayer
            key={selectedYear} // Add a key to force React to re-render the layer
            url={satelliteLayers[selectedYear].url}
            attribution={satelliteLayers[selectedYear].attribution}
          />
        )}

        {/* Add '&& !bounds' to each line to hide the full layer when a selection is active */}
        {activeLulcLayer === 'all' && !bounds && <TileLayer key="lulc-all" url="/dhaka_lulc_tiles/{z}/{x}/{y}.png" tms={true} opacity={0.7} zIndex={2} attribution="LULC All Classes" />}
        {activeLulcLayer === 'farmland' && !bounds && <TileLayer key="lulc-farmland" url="/farmland_tiles/{z}/{x}/{y}.png" tms={true} opacity={0.7} zIndex={2} attribution="LULC Farmland" />}
        {activeLulcLayer === 'water' && !bounds && <TileLayer key="lulc-water" url="/water_tiles/{z}/{x}/{y}.png" tms={true} opacity={0.7} zIndex={2} attribution="LULC Water" />}
        {activeLulcLayer === 'forest' && !bounds && <TileLayer key="lulc-forest" url="/forest_tiles/{z}/{x}/{y}.png" tms={true} opacity={0.7} zIndex={2} attribution="LULC Forest" />}
        {activeLulcLayer === 'built-up' && !bounds && <TileLayer key="lulc-built-up" url="/built-up_tiles/{z}/{x}/{y}.png" tms={true} opacity={0.7} zIndex={2} attribution="LULC Built-Up" />}
        {activeLulcLayer === 'meadow' && !bounds && <TileLayer key="lulc-meadow" url="/meadow_tiles/{z}/{x}/{y}.png" tms={true} opacity={0.7} zIndex={2} attribution="LULC Meadow" />}

        <ClippedLulcOverlay bounds={bounds} activeLayer={activeLulcLayer} />
        
        <FeatureGroup ref={featureGroupRef} />
        <MapEvents />
        {!bounds && <CustomDrawButton />}
      </MapContainer>
    </div>
  );
}