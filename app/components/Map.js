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
  const [showLulc, setShowLulc] = useState(false);
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

  const toggleLulcView = () => {
    setShowLulc(current => !current);
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
      
      <div className="map-controls-container">
        <button
          onClick={toggleMapView}
          className="map-control-button"
          title={mapView === 'default' ? 'Switch to Satellite View' : 'Switch to Default View'}
        >
          <div 
            className="toggle-bg"
            style={{
              backgroundImage: `url(${mapView === 'default' ? '/satellite-icon.png' : '/default-icon.png'})`
            }}
          >
            <span className={`toggle-text ${mapView === 'default' ? 'text-white' : 'text-black'}`}>
              {mapView === 'default' ? 'Satellite' : 'Default'}
            </span>
          </div>
        </button>
        
        <button
          onClick={toggleLulcView}
          className="map-control-button lulc-toggle-button"
          title={showLulc ? "Hide LULC Layer" : "Show LULC Layer"}
          style={{ backgroundColor: showLulc ? '#6aa5e4ff' : 'white' }}
        >
          <span className="toggle-text text-black">LULC</span>
        </button>
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
        {showLulc && (
          <TileLayer
            url="/dhaka_lulc_tiles/{z}/{x}/{y}.png"
            tms={true} // IMPORTANT: gdal2tiles uses the TMS scheme
            opacity={0.7}
            attribution="LULC Dhaka"
          />
        )}
        
        <FeatureGroup ref={featureGroupRef} />
        <MapEvents />
        {!bounds && <CustomDrawButton />}
      </MapContainer>
    </div>
  );
}