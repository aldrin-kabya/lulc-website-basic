'use client';

// 1. IMPORT useRef ALONG WITH THE OTHERS
import { useState, useRef, useEffect } from 'react';
import { MapContainer, TileLayer, FeatureGroup, useMap } from 'react-leaflet';
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

// Tile Layer URLs and Attributions
const tileLayers = {
  default: {
    url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
  },
  satellite: {
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution: '&copy; Esri, Maxar, Earthstar Geographics, and the GIS User Community'
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
  const featureGroupRef = useRef(null);

  const handleDrawCreated = (e) => {
    const layer = e.layer;
    if (featureGroupRef.current) featureGroupRef.current.clearLayers();
    featureGroupRef.current.addLayer(layer);
    const drawnBounds = layer.getBounds();
    const newBounds = {
      topLeft: { lat: drawnBounds.getNorthWest().lat, lng: drawnBounds.getNorthWest().lng },
      bottomRight: { lat: drawnBounds.getSouthEast().lat, lng: drawnBounds.getSouthEast().lng },
    };
    setBounds(newBounds);
  };

  const clearSelection = () => {
    if (featureGroupRef.current) featureGroupRef.current.clearLayers();
    setBounds(null);
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
      {bounds && (
        <div className="info-box">
          <h3>Selected Area Coordinates</h3>
          <div>
            <p><strong>Top Left:</strong> {bounds.topLeft.lat.toFixed(4)}, {bounds.topLeft.lng.toFixed(4)}</p>
            <p><strong>Bottom Right:</strong> {bounds.bottomRight.lat.toFixed(4)}, {bounds.bottomRight.lng.toFixed(4)}</p>
          </div>
          <button onClick={clearSelection} className="reset-button">
            Select New Area
          </button>
        </div>
      )}
      
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
            <img src="/all-classes-icon.png" alt="All Classes Layer"/>
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
          <TileLayer url={tileLayers.satellite.url} attribution={tileLayers.satellite.attribution} />
        )}

        {/* --- CONDITIONAL RENDERING BASED ON THE SINGLE STATE --- */}
        {activeLulcLayer === 'all' && <TileLayer url="/dhaka_lulc_tiles/{z}/{x}/{y}.png" tms={true} opacity={0.7} attribution="LULC All Classes" />}
        {activeLulcLayer === 'farmland' && <TileLayer url="/farmland_tiles/{z}/{x}/{y}.png" tms={true} opacity={0.7} attribution="LULC Farmland" />}
        {activeLulcLayer === 'water' && <TileLayer url="/water_tiles/{z}/{x}/{y}.png" tms={true} opacity={0.7} attribution="LULC Water" />}
        {activeLulcLayer === 'forest' && <TileLayer url="/forest_tiles/{z}/{x}/{y}.png" tms={true} opacity={0.7} attribution="LULC Forest" />}
        {/* {activeLulcLayer === 'built-up' && <TileLayer url="/built-up_tiles/{z}/{x}/{y}.png" tms={true} opacity={0.7} attribution="LULC Built-Up" />}
        {activeLulcLayer === 'meadow' && <TileLayer url="/meadow_tiles/{z}/{x}/{y}.png" tms={true} opacity={0.7} attribution="LULC Meadow" />} */}
        
        <FeatureGroup ref={featureGroupRef} />
        <MapEvents />
        {!bounds && <CustomDrawButton />}
      </MapContainer>
    </div>
  );
}