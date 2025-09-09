'use client';  
  
// block start: library imports  
import { useState } from 'react';  
import '../css/SidePanel.css';  
// block end: library imports  
  
// block start: main SidePanel component  
export default function SidePanel({  
  bounds,  
  clearSelection,  
  isComparing,  
  toggleCompareMode,  
  compareYearA,  
  setCompareYearA,  
  compareYearB,  
  setCompareYearB,  
  selectedYear,  
  setSelectedYear,  
  satelliteLayers,  
  onSelectArea  
}) {  
  // block start: state for panel visibility  
  const [isPanelOpen, setIsPanelOpen] = useState(true);  
  // block end: state for panel visibility  
  
  // block start: toggle panel visibility  
  const togglePanel = () => {  
    setIsPanelOpen(!isPanelOpen);  
  };  
  // block end: toggle panel visibility  
  
  // block start: main render method  
  return (  
    <>  
      {/* block start: hamburger menu button */}  
      <button   
        className={`hamburger-button ${isPanelOpen ? 'panel-open' : ''}`}  
        onClick={togglePanel}  
      >  
        <div className="hamburger-line"></div>  
        <div className="hamburger-line"></div>  
        <div className="hamburger-line"></div>  
      </button>  
      {/* block end: hamburger menu button */}  
  
      {/* block start: side panel container */}  
      <div className={`side-panel ${isPanelOpen ? 'open' : 'closed'}`}>  
        {/* block start: panel header */}  
        <div className="panel-header">  
          <h3>Map Controls</h3>  
        </div>  
        {/* block end: panel header */}  
  
        {/* block start: year selection and comparison controls */}  
        <div className="panel-section">  
          <h4>Time Controls</h4>  
            
          {/* block start: conditional rendering based on comparison mode */}  
          {isComparing ? (  
            // block start: comparison mode controls  
            <div className="compare-section">  
              <button  
                onClick={toggleCompareMode}  
                className="exit-compare-button"  
              >  
                Exit Comparison  
              </button>  
                
              <div className="compare-years">  
                <div className="year-group">  
                  <label>Left Side</label>  
                  <select   
                    className="panel-year-selector"  
                    value={compareYearA}  
                    onChange={(e) => setCompareYearA(e.target.value)}  
                  >  
                    {Object.keys(satelliteLayers).sort((a, b) => b - a).map(year => (  
                      <option key={`a-${year}`} value={year}>{year}</option>  
                    ))}  
                  </select>  
                </div>  
                  
                <div className="year-group">  
                  <label>Right Side</label>  
                  <select   
                    className="panel-year-selector"  
                    value={compareYearB}  
                    onChange={(e) => setCompareYearB(e.target.value)}  
                  >  
                    {Object.keys(satelliteLayers).sort((a, b) => b - a).map(year => (  
                      <option key={`b-${year}`} value={year}>{year}</option>  
                    ))}  
                  </select>  
                </div>  
              </div>  
            </div>  
            // block end: comparison mode controls  
          ) : (  
            // block start: single view controls  
            <div className="single-view-section">  
              <div className="year-group">  
                <label>Year</label>  
                <select   
                  className="panel-year-selector"  
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
                className="start-compare-button"  
              >  
                Compare Years  
              </button>  
            </div>  
            // block end: single view controls  
          )}  
          {/* block end: conditional rendering based on comparison mode */}  
        </div>  
        {/* block end: year selection and comparison controls */}  
  
        {/* block start: area selection controls */}  
        <div className="panel-section">  
          <h4>Area Selection</h4>  
            
          {/* block start: select area button */}  
          {!bounds && (  
            <button onClick={onSelectArea} className="panel-select-area-button">  
              Select Area  
            </button>  
          )}  
          {/* block end: select area button */}  
  
          {/* block start: selected area info and clear button */}  
          {bounds && (  
            <div className="selected-area-info">  
              <div className="coordinates-info">  
                <p><strong>Top Left:</strong></p>  
                <p>{bounds.getNorthWest().lat.toFixed(4)}, {bounds.getNorthWest().lng.toFixed(4)}</p>  
                <p><strong>Bottom Right:</strong></p>  
                <p>{bounds.getSouthEast().lat.toFixed(4)}, {bounds.getSouthEast().lng.toFixed(4)}</p>  
              </div>  
              <button onClick={clearSelection} className="panel-clear-button">  
                Clear Selection  
              </button>  
            </div>  
          )}  
          {/* block end: selected area info and clear button */}  
        </div>  
        {/* block end: area selection controls */}  
      </div>  
      {/* block end: side panel container */}  
    </>  
  );  
  // block end: main render method  
}  
// block end: main SidePanel component  