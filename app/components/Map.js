'use client';

import { useState, useRef, useEffect } from 'react';
import { MapContainer, TileLayer, FeatureGroup, useMap } from 'react-leaflet';
import L from 'leaflet';

// We need to import the leaflet-draw CSS
import 'leaflet-draw/dist/leaflet.draw.css';
import 'leaflet-draw'; 

// Icon workaround from before, still needed
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
});

// A custom component for the "Select Area" button
const CustomDrawButton = () => {
  const map = useMap();

  const startDrawing = () => {
    // Programmatically start the rectangle drawing tool
    new L.Draw.Rectangle(map).enable();
  };

  return (
    <button onClick={startDrawing} className="custom-draw-button">
      Select Area
    </button>
  );
};

// Main Map Component
export default function Map() {
  const [bounds, setBounds] = useState(null);
  const featureGroupRef = useRef(null);

  const handleDrawCreated = (e) => {
    const layer = e.layer;

    // Clear previous layers
    if (featureGroupRef.current) {
      featureGroupRef.current.clearLayers();
    }

    // Add the new layer
    featureGroupRef.current.addLayer(layer);

    // Get bounds and update state
    const drawnBounds = layer.getBounds();
    const newBounds = {
      topLeft: {
        lat: drawnBounds.getNorthWest().lat,
        lng: drawnBounds.getNorthWest().lng,
      },
      bottomRight: {
        lat: drawnBounds.getSouthEast().lat,
        lng: drawnBounds.getSouthEast().lng,
      },
    };
    setBounds(newBounds);
  };

  // Function to reset the state and clear the map
  const clearSelection = () => {
    if (featureGroupRef.current) {
      featureGroupRef.current.clearLayers();
    }
    setBounds(null);
  };

  // Component to handle map events
  const MapEvents = () => {
    const map = useMap();
    useEffect(() => {
      map.on(L.Draw.Event.CREATED, handleDrawCreated);

      // Cleanup function to remove the event listener
      return () => {
        map.off(L.Draw.Event.CREATED);
      };
    }, [map]); // Rerun if map instance changes

    return null; // This component does not render anything
  };

  return (
    <div>
      {/* Conditionally render the info box ONLY when bounds exist */}
      {bounds && (
        <div className="info-box">
          <h3>Selected Area Coordinates</h3>
          <div>
            <p><strong>Top Left:</strong> {bounds.topLeft.lat.toFixed(4)}, {bounds.topLeft.lng.toFixed(4)}</p>
            <p><strong>Bottom Right:</strong> {bounds.bottomRight.lat.toFixed(4)}, {bounds.bottomRight.lng.toFixed(4)}</p>
          </div>
          <button onClick={clearSelection} className="reset-button">
            Draw New Area
          </button>
        </div>
      )}

      <MapContainer 
        center={[23.6850, 90.3563]}
        zoom={7}
        style={{ height: '100vh', width: '100%' }}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />
        
        {/* We now use a ref on FeatureGroup to manage layers */}
        <FeatureGroup ref={featureGroupRef} />

        {/* This component handles the 'draw:created' event */}
        <MapEvents />

        {/* Conditionally render our custom draw button ONLY when no bounds are set */}
        {!bounds && <CustomDrawButton />}
      </MapContainer>
    </div>
  );
}