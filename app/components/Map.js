'use client';

import { useState, useRef, useEffect } from 'react';
import { MapContainer, TileLayer, FeatureGroup, useMap, ImageOverlay } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet-draw/dist/leaflet.draw.css';
import 'leaflet-draw';

/**
 * Fix for a known issue with Leaflet icons in React frameworks.
 * This re-associates the default icon URLs for markers.
 */
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
});

/**
 * Data store for Land Use Land Cover (LULC) class definitions.
 * Used to dynamically generate the map legend.
 * @type {Array<Object>}
 */
const LULC_CLASSES = [
  { name: 'Farmland', color: 'rgb(0, 255, 0)' },
  { name: 'Water', color: 'rgb(0, 0, 255)' },
  { name: 'Forest', color: 'rgb(0, 255, 255)' },
  { name: 'Built-Up', color: 'rgb(255, 0, 0)' },
  { name: 'Meadow', color: 'rgb(255, 255, 0)' }
];

/**
 * A stateful component to manage the display of the LULC legend.
 * It encapsulates its own visibility logic, appearing only when a specific
 * LULC layer is active and allowing the user to toggle its visibility.
 * @param {{ showControl: boolean }} props - Controls whether the component should be rendered.
 */
const LegendControl = ({ showControl }) => {
  const [isLegendVisible, setIsLegendVisible] = useState(false);

  /**
   * Effect to synchronize the legend's visibility with the parent component's state.
   * If the parent hides the control, the legend resets to its default hidden state.
   */
  useEffect(() => {
    if (!showControl) {
      setIsLegendVisible(false);
    }
  }, [showControl]);

  // Render nothing if the control is not meant to be shown.
  if (!showControl) {
    return null;
  }

  // If toggled, display the full legend.
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

  // By default, show the button that reveals the legend.
  return (
    <button className="show-legend-button" onClick={() => setIsLegendVisible(true)}>
      Show legend
    </button>
  );
};

/**
 * A highly specialized component that renders an LULC tile layer clipped to
 * a user-drawn rectangular boundary. It fetches the required tiles, stitches them
 * together on an in-memory canvas, and displays the result as a single ImageOverlay.
 * @param {{ bounds: L.LatLngBounds | null, activeLayer: string | null }} props
 */
const ClippedLulcOverlay = ({ bounds, activeLayer }) => {
  const map = useMap();
  const [imageUrl, setImageUrl] = useState(null);

  useEffect(() => {
    // Abort if there's no selected area or active LULC layer.
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

    /**
     * Asynchronously generates a clipped image overlay.
     */
    const generateOverlayImage = async () => {
      const zoom = map.getZoom();
      const TILE_SIZE = 256;
      
      // Project geographic bounds to pixel coordinates for the current zoom level.
      const northWestPoint = map.project(bounds.getNorthWest(), zoom);
      const southEastPoint = map.project(bounds.getSouthEast(), zoom);

      const canvasWidth = southEastPoint.x - northWestPoint.x;
      const canvasHeight = southEastPoint.y - northWestPoint.y;

      // Determine the grid of tiles required to cover the selected area.
      const minTileX = Math.floor(northWestPoint.x / TILE_SIZE);
      const maxTileX = Math.floor(southEastPoint.x / TILE_SIZE);
      const minTileY = Math.floor(northWestPoint.y / TILE_SIZE);
      const maxTileY = Math.floor(southEastPoint.y / TILE_SIZE);
      
      // Construct a list of tile URLs to fetch.
      const tilesToLoad = [];
      for (let x = minTileX; x <= maxTileX; x++) {
        for (let y = minTileY; y <= maxTileY; y++) {
          // Convert Leaflet's XYZ y-coordinate to the TMS y-coordinate used by gdal2tiles.
          const tmsY = Math.pow(2, zoom) - 1 - y;
          const url = tileUrlTemplate.replace('{z}', zoom).replace('{x}', x).replace('{y}', tmsY);
          tilesToLoad.push({ url, x, y });
        }
      }

      // Fetch all required tile images in parallel.
      const imagePromises = tilesToLoad.map(tile => new Promise((resolve) => {
        const img = new Image();
        img.crossOrigin = "Anonymous";
        img.onload = () => resolve({ img, tile });
        img.onerror = () => resolve(null); // Gracefully handle missing tiles.
        img.src = tile.url;
      }));
      const loadedImages = await Promise.all(imagePromises);

      // Create an in-memory canvas to stitch the tiles together.
      const canvas = document.createElement('canvas');
      canvas.width = canvasWidth;
      canvas.height = canvasHeight;
      const ctx = canvas.getContext('2d');
      
      loadedImages.forEach(loaded => {
        if (loaded) {
          const { img, tile } = loaded;
          // Calculate the precise drawing position for each tile on the canvas.
          const drawX = (tile.x * TILE_SIZE) - northWestPoint.x;
          const drawY = (tile.y * TILE_SIZE) - northWestPoint.y;
          ctx.drawImage(img, drawX, drawY, TILE_SIZE, TILE_SIZE);
        }
      });
      
      // Convert the canvas content to a Data URL to be used by ImageOverlay.
      setImageUrl(canvas.toDataURL());
    };

    generateOverlayImage();

  }, [bounds, activeLayer, map]);

  // Render the overlay only when the image has been generated and bounds are set.
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

/**
 * Data store for base map tile layers.
 * @type {Object}
 */
const tileLayers = {
  default: {
    url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
  }
};

/**
 * Data store for historical satellite imagery from the ArcGIS Wayback service.
 * @type {Object}
 */
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

/**
 * A simple UI component that allows the user to initiate a drawing action.
 */
const CustomDrawButton = () => {
  const map = useMap();
  const startDrawing = () => new L.Draw.Rectangle(map).enable();
  return (
    <button onClick={startDrawing} className="custom-draw-button">
      Select Area
    </button>
  );
};

/**
 * The main Map component, serving as the primary entry point for all map-related functionality.
 */
export default function Map() {
  /** State to hold the user-drawn rectangular bounds. */
  const [bounds, setBounds] = useState(null);
  /** State to manage the active base map ('default' or 'satellite'). */
  const [mapView, setMapView] = useState('default');
  /** State to manage the active LULC overlay layer. Null means no layer is active. */
  const [activeLulcLayer, setActiveLulcLayer] = useState(null);
  /** State for the selected year of satellite imagery. */
  const [selectedYear, setSelectedYear] = useState('2025');
  /** A ref to the FeatureGroup that holds drawn layers. */
  const featureGroupRef = useRef(null);

  /**
   * Callback executed when a user finishes drawing a rectangle on the map.
   * @param {L.DrawEvents.Created} e - The Leaflet Draw event.
   */
  const handleDrawCreated = (e) => {
    const layer = e.layer;
    if (featureGroupRef.current) {
      featureGroupRef.current.clearLayers();
    }
    featureGroupRef.current.addLayer(layer);
    setBounds(layer.getBounds());
  };

  /**
   * Resets all user selections, clearing the drawn area and any active LULC overlays.
   */
  const clearSelection = () => {
    if (featureGroupRef.current) featureGroupRef.current.clearLayers();
    setBounds(null);
    setActiveLulcLayer(null); 
  };

  /**
   * Toggles between the 'default' and 'satellite' base map views.
   */
  const toggleMapView = () => {
    setMapView(currentView => currentView === 'default' ? 'satellite' : 'default');
  };

  /**
   * Handles toggling of all LULC layers.
   * If the clicked layer is already active, it's deactivated. Otherwise, it becomes the active layer.
   * @param {string} layerName - The identifier for the LULC layer.
   */
  const handleLayerToggle = (layerName) => {
    setActiveLulcLayer(currentLayer => (currentLayer === layerName ? null : layerName));
  };

  /**
   * A utility component to register Leaflet event listeners within the React ecosystem.
   */
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
      {/* Conditionally render the LULC legend control. */}
      <LegendControl showControl={activeLulcLayer === 'all'} />

      {/* Conditionally render the info box when an area is selected. */}
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

      {/* The dropdown menu for selecting satellite imagery year. */}
      <div className="year-selector-container">
        <span className="year-selector-label">Year</span>
        <select 
          className="year-selector"
          value={selectedYear}
          onChange={(e) => setSelectedYear(e.target.value)}
        >
          {Object.keys(satelliteLayers)
            .sort((a, b) => b - a) 
            .map(year => (
              <option key={year} value={year}>
                {year}
              </option>
          ))}
        </select>
      </div>
      
      {/* The main map layer control panel with hover-reveal functionality. */}
      <div className="map-layer-controls">
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
            key={selectedYear}
            url={satelliteLayers[selectedYear].url}
            attribution={satelliteLayers[selectedYear].attribution}
          />
        )}

        {/* Render full-screen LULC layers only when no area is selected. */}
        {activeLulcLayer === 'all' && !bounds && <TileLayer key="lulc-all" url="/dhaka_lulc_tiles/{z}/{x}/{y}.png" tms={true} opacity={0.7} zIndex={2} attribution="LULC All Classes" />}
        {activeLulcLayer === 'farmland' && !bounds && <TileLayer key="lulc-farmland" url="/farmland_tiles/{z}/{x}/{y}.png" tms={true} opacity={0.7} zIndex={2} attribution="LULC Farmland" />}
        {activeLulcLayer === 'water' && !bounds && <TileLayer key="lulc-water" url="/water_tiles/{z}/{x}/{y}.png" tms={true} opacity={0.7} zIndex={2} attribution="LULC Water" />}
        {activeLulcLayer === 'forest' && !bounds && <TileLayer key="lulc-forest" url="/forest_tiles/{z}/{x}/{y}.png" tms={true} opacity={0.7} zIndex={2} attribution="LULC Forest" />}
        {activeLulcLayer === 'built-up' && !bounds && <TileLayer key="lulc-built-up" url="/built-up_tiles/{z}/{x}/{y}.png" tms={true} opacity={0.7} zIndex={2} attribution="LULC Built-Up" />}
        {activeLulcLayer === 'meadow' && !bounds && <TileLayer key="lulc-meadow" url="/meadow_tiles/{z}/{x}/{y}.png" tms={true} opacity={0.7} zIndex={2} attribution="LULC Meadow" />}

        {/* The clipped overlay is driven by the 'bounds' and 'activeLulcLayer' states. */}
        <ClippedLulcOverlay bounds={bounds} activeLayer={activeLulcLayer} />
        
        <FeatureGroup ref={featureGroupRef} />
        <MapEvents />
        {/* The draw button is only shown when no area is selected. */}
        {!bounds && <CustomDrawButton />}
      </MapContainer>
    </div>
  );
}