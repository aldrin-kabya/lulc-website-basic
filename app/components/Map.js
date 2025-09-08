'use client';

// block start: library imports
import { useState, useRef, useEffect } from 'react';
import { MapContainer, TileLayer, FeatureGroup, useMap, ImageOverlay } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet-draw/dist/leaflet.draw.css';
import 'leaflet-draw';
import 'leaflet-side-by-side';
// block end: library imports

// block start: fixes a known issue with Leaflet icons in React
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
});
// block end: fixes a known issue with Leaflet icons in React

// block start: defines LULC class names and colors for the legend
const LULC_CLASSES = [
  { name: 'Farmland', color: 'rgb(0, 255, 0)' },
  { name: 'Water', color: 'rgb(0, 0, 255)' },
  { name: 'Forest', color: 'rgb(0, 255, 255)' },
  { name: 'Built-Up', color: 'rgb(255, 0, 0)' },
  { name: 'Meadow', color: 'rgb(255, 255, 0)' }
];
// block end: defines LULC class names and colors for the legend

// block start: component to manage the LULC legend's visibility and behavior
const LegendControl = ({ showControl }) => {
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

// block start: component that renders an LULC layer clipped to a user-drawn rectangle
const ClippedLulcOverlay = ({ bounds, activeLayer }) => {
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
        const img = new Image();
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
      const ctx = canvas.getContext('2d');
      
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
};
// block end: component that renders an LULC layer clipped to a user-drawn rectangle


// block start: component to manage the side-by-side comparison slider
const CompareLayers = ({ yearA, yearB }) => {
  const map = useMap();

  // block start: effect to create, update, and remove the comparison control
  useEffect(() => {
    // block start: exits early if either year is not defined
    if (!yearA || !yearB) return;
    // block end: exits early if either year is not defined

    const attributionText = `&copy; Esri, Wayback (${yearA} vs ${yearB})`;

    // block start: creates two new Leaflet tile layers for the comparison
    const layerA = L.tileLayer(satelliteLayers[yearA].url, {attribution: attributionText}).addTo(map);
    const layerB = L.tileLayer(satelliteLayers[yearB].url, {attribution: attributionText}).addTo(map);
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
};
// block end: component to manage the side-by-side comparison slider


// block start: defines the default base map tile layer
const tileLayers = {
  default: {
    url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
  }
};
// block end: defines the default base map tile layer

// block start: defines the historical satellite imagery tile layers
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
// block end: defines the historical satellite imagery tile layers

// block start: component for the custom "Select Area" button
const CustomDrawButton = () => {
  const map = useMap();
  const startDrawing = () => new L.Draw.Rectangle(map).enable();
  return (
    <button onClick={startDrawing} className="custom-draw-button">
      Select Area
    </button>
  );
};
// block end: component for the custom "Select Area" button

// block start: main Map component and application logic
export default function Map() {
  // block start: state management for map interactivity
  const [bounds, setBounds] = useState(null);
  const [mapView, setMapView] = useState('default');
  const [activeLulcLayer, setActiveLulcLayer] = useState(null);
  const [selectedYear, setSelectedYear] = useState('2025');

  // states for comparison mode
  const [isComparing, setIsComparing] = useState(false);
  const [compareYearA, setCompareYearA] = useState('2020'); // Left side year
  const [compareYearB, setCompareYearB] = useState('2025'); // Right side year

  const featureGroupRef = useRef(null);
  // block end: state management for map interactivity

  // block start: handles the creation of a user-drawn rectangle
  const handleDrawCreated = (e) => {
    const layer = e.layer;
    if (featureGroupRef.current) {
      featureGroupRef.current.clearLayers();
    }
    featureGroupRef.current.addLayer(layer);
    setBounds(layer.getBounds());
  };
  // block end: handles the creation of a user-drawn rectangle

  // block start: clears the drawn rectangle and any active LULC layers
  const clearSelection = () => {
    if (featureGroupRef.current) featureGroupRef.current.clearLayers();
    setBounds(null);
    setActiveLulcLayer(null); 
  };
  // block end: clears the drawn rectangle and any active LULC layers

  // block start: toggles the base map between default and satellite views
  const toggleMapView = () => {
    setMapView(currentView => currentView === 'default' ? 'satellite' : 'default');
  };
  // block end: toggles the base map between default and satellite views

  // block start: sets the currently active LULC layer or deactivates it
  const handleLayerToggle = (layerName) => {
    setActiveLulcLayer(currentLayer => (currentLayer === layerName ? null : layerName));
  };
  // block end: sets the currently active LULC layer or deactivates it

  // block start: new handler to toggle comparison mode
  const toggleCompareMode = () => {
    setIsComparing(current => !current);
  };
  // block end: new handler to toggle comparison mode


  // block start: utility component to connect Leaflet draw events to React state
  const MapEvents = () => {
    const map = useMap();
    useEffect(() => {
      map.on(L.Draw.Event.CREATED, handleDrawCreated);
      return () => { map.off(L.Draw.Event.CREATED); };
    }, [map]);
    return null;
  };
  // block end: utility component to connect Leaflet draw events to React state

// block start: main render method for the map and all UI components
return (
    <div>
      {/* block start: renders the LULC legend control when appropriate */}
      <LegendControl showControl={activeLulcLayer === 'all'} />
      {/* block end: renders the LULC legend control when appropriate */}

      {/* block start: renders the coordinate info box for a selected area */}
      {bounds && (
        <div className="info-box">
          <h3>Selected Area Coordinates</h3>
          <div>
            <p><strong>Top Left:</strong> {bounds.getNorthWest().lat.toFixed(4)}, {bounds.getNorthWest().lng.toFixed(4)}</p>
            <p><strong>Bottom Right:</strong> {bounds.getSouthEast().lat.toFixed(4)}, {bounds.getSouthEast().lng.toFixed(4)}</p>
          </div>
          <button onClick={clearSelection} className="reset-button">
            Clear Selection
          </button>
        </div>
      )}
      {/* block end: renders the coordinate info box for a selected area */}

      {/* block start: conditional rendering of top-left date controls (year select, compare) */}
      {isComparing ? (
        // block start: renders the comparison mode controls when active
        <div className="compare-controls-container">
          <button
            onClick={toggleCompareMode}
            className={`compare-toggle-button ${isComparing ? 'exit-mode' : ''}`}
          >
            Exit
          </button>
          <select 
            className="year-selector"
            value={compareYearA}
            onChange={(e) => setCompareYearA(e.target.value)}
          >
            {Object.keys(satelliteLayers).sort((a, b) => b - a).map(year => (
              <option key={`a-${year}`} value={year}>{year}</option>
            ))}
          </select>
          <select 
            className="year-selector"
            value={compareYearB}
            onChange={(e) => setCompareYearB(e.target.value)}
          >
            {Object.keys(satelliteLayers).sort((a, b) => b - a).map(year => (
              <option key={`b-${year}`} value={year}>{year}</option>
            ))}
          </select>
        </div>
        // block end: renders the comparison mode controls when active
      ) : (
        // block start: renders the single-view controls by default
        <>
          <div className="year-selector-container">
            <span className="year-selector-label">Year</span>
            <select 
              className="year-selector"
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
            >
              {Object.keys(satelliteLayers).sort((a, b) => b - a).map(year => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
          </div>
          <button
            onClick={toggleCompareMode}
            className="initial-compare-button"
          >
            Compare
          </button>
        </>
        // block end: renders the single-view controls by default
      )}
      {/* block end: conditional rendering of top-left date controls (year select, compare)*/}
      
      {/* block start: renders the main layer control panel */}
      <div className="map-layer-controls">
        {/* block start: renders the primary base map toggle button (Satellite/Default) */}
        <button
          onClick={toggleMapView}
          className="map-type-button"
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
        {/* block end: renders the primary base map toggle button (Satellite/Default) */}
        
        {/* block start: renders the hover-reveal panel with LULC class options */}
        <div className="layer-panel">
          <button
            onClick={() => handleLayerToggle('all')}
            className={`layer-option-button ${activeLulcLayer === 'all' ? 'active' : ''}`}
          >
            <img src="/all-classes-icon-2.png" alt="All Classes Layer"/>
            <span className="layer-option-text">All classes</span>
          </button>
          <button
            onClick={() => handleLayerToggle('farmland')}
            className={`layer-option-button ${activeLulcLayer === 'farmland' ? 'active' : ''}`}
          >
            <img src="/farmland-icon.png" alt="Farmland Layer"/>
            <span className="layer-option-text">Farmland</span>
          </button>
          <button
            onClick={() => handleLayerToggle('water')}
            className={`layer-option-button ${activeLulcLayer === 'water' ? 'active' : ''}`}
          >
            <img src="/water-icon.png" alt="Water Layer"/>
            <span className="layer-option-text">Water</span>
          </button>
          <button
            onClick={() => handleLayerToggle('forest')}
            className={`layer-option-button ${activeLulcLayer === 'forest' ? 'active' : ''}`}
          >
            <img src="/forest-icon.png" alt="Forest Layer"/>
            <span className="layer-option-text">Forest</span>
          </button>
          <button
            onClick={() => handleLayerToggle('built-up')}
            className={`layer-option-button ${activeLulcLayer === 'built-up' ? 'active' : ''}`}
          >
            <img src="/built-up-icon.png" alt="Built-Up Layer"/>
            <span className="layer-option-text">Built-Up</span>
          </button>
          <button
            onClick={() => handleLayerToggle('meadow')}
            className={`layer-option-button ${activeLulcLayer === 'meadow' ? 'active' : ''}`}
          >
            <img src="/meadow-icon.png" alt="Meadow Layer"/>
            <span className="layer-option-text">Meadow</span>
          </button>
        </div>
        {/* block end: renders the hover-reveal panel with LULC class options */}
      </div>
      {/* block end: renders the main layer control panel */}

      {/* block start: main Leaflet map container and layers */}
      <MapContainer 
        center={[23.7808405, 90.419689]}
        zoom={12}
        style={{ height: '100vh', width: '100%' }}
      >
        {/* block start: hide all base maps when comparing */}
        {!isComparing && (
          // block start: renders the active base map tile layer
          mapView === 'default' ? (
            <TileLayer
              key="default-basemap"
              url={tileLayers.default.url}
              attribution={tileLayers.default.attribution}
              zIndex={1}
            />
          ) : (
            <TileLayer
              key={selectedYear}
              url={satelliteLayers[selectedYear].url}
              attribution={satelliteLayers[selectedYear].attribution}
              zIndex={1}
            />
          )
          // block end: renders the active base map tile layer
        )}
        {/* block end: hide all base maps when comparing */}

        {/* block start: renders the comparison slider component when active */}
        {isComparing && <CompareLayers yearA={compareYearA} yearB={compareYearB} />}
        {/* block end: renders the comparison slider component when active */}

        {/* block start: renders full-screen LULC overlays when no area is selected */}
        {activeLulcLayer === 'all' && !bounds && <TileLayer key="lulc-all" url="/dhaka_ground_truth_tiles/all_classes_tiles/{z}/{x}/{y}.png" tms={true} opacity={0.7} zIndex={2} attribution="LULC All Classes" />}
        {activeLulcLayer === 'farmland' && !bounds && <TileLayer key="lulc-farmland" url="/dhaka_ground_truth_tiles/farmland_tiles/{z}/{x}/{y}.png" tms={true} opacity={0.7} zIndex={2} attribution="LULC Farmland" />}
        {activeLulcLayer === 'water' && !bounds && <TileLayer key="lulc-water" url="/dhaka_ground_truth_tiles/water_tiles/{z}/{x}/{y}.png" tms={true} opacity={0.7} zIndex={2} attribution="LULC Water" />}
        {activeLulcLayer === 'forest' && !bounds && <TileLayer key="lulc-forest" url="/dhaka_ground_truth_tiles/forest_tiles/{z}/{x}/{y}.png" tms={true} opacity={0.7} zIndex={2} attribution="LULC Forest" />}
        {activeLulcLayer === 'built-up' && !bounds && <TileLayer key="lulc-built-up" url="/dhaka_ground_truth_tiles/built-up_tiles/{z}/{x}/{y}.png" tms={true} opacity={0.7} zIndex={2} attribution="LULC Built-Up" />}
        {activeLulcLayer === 'meadow' && !bounds && <TileLayer key="lulc-meadow" url="/dhaka_ground_truth_tiles/meadow_tiles/{z}/{x}/{y}.png" tms={true} opacity={0.7} zIndex={2} attribution="LULC Meadow" />}
        {/* block end: renders full-screen LULC overlays when no area is selected */}

        {/* block start: renders the clipped LULC overlay for a selected area */}
        <ClippedLulcOverlay bounds={bounds} activeLayer={activeLulcLayer} />
        {/* block end: renders the clipped LULC overlay for a selected area */}
        
        {/* block start: utility components for map functionality */}
        <FeatureGroup ref={featureGroupRef} />
        <MapEvents />
        {!bounds && <CustomDrawButton />}
        {/* block end: utility components for map functionality */}
      </MapContainer>
      {/* block end: main Leaflet map container and layers */}
    </div>
  );
  // block end: main render method for the map and all UI components
}
// block end: main Map component and application logic