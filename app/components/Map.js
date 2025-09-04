'use client';

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
    attribution: 'Source: Esri, Maxar, Earthstar Geographics, and the GIS User Community'
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
  const [mapView, setMapView] = useState('default'); // State for map view
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

  // Function to toggle the map view
  const toggleMapView = () => {
    setMapView(currentView => currentView === 'default' ? 'satellite' : 'default');
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
      {/* Conditionally rendered info box */}
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

      {/* Map View Toggle Button */}
      <button
        onClick={toggleMapView}
        className="map-view-toggle"
        title={mapView === 'default' ? 'Switch to Satellite View' : 'Switch to Default View'}
      >
        <div 
          className="toggle-bg"
          style={{
            backgroundImage: `url(${mapView === 'default' ? '/satellite-icon.png' : '/default-icon.png'})`
          }}
        >
          <span className={
            `toggle-text ${mapView === 'default' ? 'text-white' : 'text-black'}`
          }>
            {mapView === 'default' ? 'Satellite' : 'Default'}
          </span>
        </div>
      </button>

      <MapContainer 
        center={[23.6850, 90.3563]}
        zoom={7}
        style={{ height: '100vh', width: '100%' }}
      >
        {/*Conditionally render the TileLayer based on state */}
        {mapView === 'default' ? (
          <TileLayer
            url={tileLayers.default.url}
            attribution={tileLayers.default.attribution}
          />
        ) : (
          <TileLayer
            url={tileLayers.satellite.url}
            attribution={tileLayers.satellite.attribution}
          />
        )}
        
        <FeatureGroup ref={featureGroupRef} />
        <MapEvents />
        {!bounds && <CustomDrawButton />}
      </MapContainer>
    </div>
  );
}