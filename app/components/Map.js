'use client';

// block start: library imports
import { useState, useRef, useEffect } from 'react';
import { MapContainer, TileLayer, FeatureGroup, useMap, ZoomControl } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet-draw/dist/leaflet.draw.css';
import 'leaflet-draw';
// block end: library imports

// block start: import modularized components and constants
import LegendControl from './LegendControl';
import BarChart from './BarChart';
import LayerControls from './LayerControls';
import CompareLayers from './CompareLayers';
import ClippedLulcOverlay from './ClippedLulcOverlay';
import LulcStatsCalculator from './LulcStatsCalculator';
import FullScreenStatsCalculator from './FullScreenStatsCalculator';
import SearchBox from './SearchBox';
import SidePanel from './SidePanel';
import { tileLayers, satelliteLayers } from './constants';
// block end: import modularized components and constants

// block start: import modularized css
import '../css/LegendControl.css';
import '../css/BarChart.css';
import '../css/LayerControls.css';
import '../css/SearchBox.css';
import '../css/SidePanel.css';
// block end: import modularized css

// block start: register Chart.js components
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip } from 'chart.js';
import ChartDataLabels from 'chartjs-plugin-datalabels';
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, ChartDataLabels);
// block end: register Chart.js components

// block start: fixes a known issue with Leaflet icons in React
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
});
// block end: fixes a known issue with Leaflet icons in React

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

  const [lulcStats, setLulcStats] = useState(null);

  const featureGroupRef = useRef(null);
  const [triggerDraw, setTriggerDraw] = useState(false);
  // block end: state management for map interactivity

  // block start: handles the creation of a user-drawn rectangle
  const handleDrawCreated = (e) => {
    const layer = e.layer;

    // block start: Make the rectangle's fill transparent
    layer.setStyle({
      fillOpacity: 0 
    });
    // block end: Make the rectangle's fill transparent

    if (featureGroupRef.current) {
      featureGroupRef.current.clearLayers();
    }
    featureGroupRef.current.addLayer(layer);
    setBounds(layer.getBounds());
    setActiveLulcLayer('all'); // Automatically activate 'all' LULC layer on selection
  };
  // block end: handles the creation of a user-drawn rectangle

  // block start: clears the drawn rectangle and any active LULC layers
  const clearSelection = () => {
    if (featureGroupRef.current) featureGroupRef.current.clearLayers();
    setBounds(null);
    setActiveLulcLayer(null); 
    setLulcStats(null);
  };
  // block end: clears the drawn rectangle and any active LULC layers

  // block start: toggles the base map between default and satellite views
  const toggleMapView = () => {
    setMapView(currentView => currentView === 'default' ? 'satellite' : 'default');
  };
  // block end: toggles the base map between default and satellite views

  // block start: sets the currently active LULC layer or deactivates it
  const handleLayerToggle = (layerName) => {
    setActiveLulcLayer(currentLayer => {
      // block start: if toggling off the current layer, clear stats
      if (currentLayer === layerName) {
        setLulcStats(null);
        return null;
      }
      // block end: if toggling off the current layer, clear stats
      return layerName;
    });
  };
  // block end: sets the currently active LULC layer or deactivates it

  // block start: handler to toggle comparison mode
  const toggleCompareMode = () => {
    setIsComparing(current => !current);
  };
  // block end: handler to toggle comparison mode


  // block start: utility component to connect Leaflet draw events to React state
  const MapEvents = () => {
    const map = useMap();
    useEffect(() => {
      map.on(L.Draw.Event.CREATED, handleDrawCreated);
      return () => { map.off(L.Draw.Event.CREATED); };
    }, [map]);

    useEffect(() => {
      if (triggerDraw) {
        new L.Draw.Rectangle(map).enable();
        setTriggerDraw(false);
      }
    }, [triggerDraw, map]);

    return null;
  };
  // block end: utility component to connect Leaflet draw events to React state

  // block start: main render method for the map and all UI components
  return (
    <div>
      {/* block start: side panel component */}
      <SidePanel
        bounds={bounds}
        clearSelection={clearSelection}
        isComparing={isComparing}
        toggleCompareMode={toggleCompareMode}
        compareYearA={compareYearA}
        setCompareYearA={setCompareYearA}
        compareYearB={compareYearB}
        setCompareYearB={setCompareYearB}
        selectedYear={selectedYear}
        setSelectedYear={setSelectedYear}
        satelliteLayers={satelliteLayers}
        onSelectArea={() => setTriggerDraw(true)}
      />
      {/* block end: side panel component */}

      {/* block start: renders the LULC legend control when appropriate */}
      {/* <LegendControl showControl={activeLulcLayer === 'all'} /> */}
      {/* block end: renders the LULC legend control when appropriate */}
      
      {/* block start: renders the LULC statistics chart when data is available */}
      {lulcStats && activeLulcLayer && <BarChart chartData={lulcStats} activeLayer={activeLulcLayer} />}
      {/* block end: renders the LULC statistics chart when data is available */}

      {/* block start: renders the main layer control panel */}
      <LayerControls
        mapView={mapView}
        toggleMapView={toggleMapView}
        activeLulcLayer={activeLulcLayer}
        handleLayerToggle={handleLayerToggle}
      />
      {/* block end: renders the main layer control panel */}

      {/* block start: main Leaflet map container and layers */}
      <MapContainer
        center={[23.7808405, 90.419689]}
        zoom={12}
        style={{ height: '100vh', width: '100%' }}
        zoomControl={false}
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
        
        {/* block start: renders the invisible LULC stats calculator for a selected area */}
        <LulcStatsCalculator bounds={bounds} onStatsCalculated={setLulcStats} />
        {/* block end: renders the invisible LULC stats calculator for a selected area */}

        {/* block start: renders the invisible LULC stats calculator for the full-screen view */}
        {!bounds && <FullScreenStatsCalculator activeLayer={activeLulcLayer} onStatsCalculated={setLulcStats} />}
        {/* block end: renders the invisible LULC stats calculator for the full-screen view */}

        {/* block start: custom position for the zoom control button */}
        <ZoomControl position="bottomright" />
        {/* block end: custom position for the zoom control button */}
        
        {/* block start: utility components for map functionality */}
        <FeatureGroup ref={featureGroupRef} />
        <MapEvents />

        {/* block start: shows the search option */}
        <SearchBox />
        {/* block end: shows the search option */}
        
        {/* block end: utility components for map functionality */}
      </MapContainer>
      {/* block end: main Leaflet map container and layers */}
    </div>
  );
  // block end: main render method for the map and all UI components
}
// block end: main Map component and application logic