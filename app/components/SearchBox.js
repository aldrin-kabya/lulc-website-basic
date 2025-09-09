'use client';

// block start: library imports
import { useState, useEffect, useRef } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';
// block end: library imports

// block start: search component with Google Maps-style functionality
const SearchBox = () => {
  // block start: state management for search functionality
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const searchRef = useRef(null);
  const map = useMap();
  const currentMarkerRef = useRef(null);
  // block end: state management for search functionality

  // block start: effect to debounce search and close suggestions when clicking outside
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (query.length > 2) {
        searchLocations(query);
      } else {
        setSuggestions([]);
        setShowSuggestions(false);
      }
    }, 300);
    return () => clearTimeout(timeoutId);
  }, [query]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
  // block end: effect to debounce search and close suggestions when clicking outside

  // block start: search function using Nominatim API
  const searchLocations = async (searchQuery) => {
    setIsLoading(true);
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&limit=5&countrycodes=bd&bounded=1&viewbox=88.0,26.0,92.0,20.0&addressdetails=1`
      );
      const data = await response.json();
      setSuggestions(data);
      setShowSuggestions(data.length > 0);
    } catch (error) {
      console.error('Search error:', error);
      setSuggestions([]);
      setShowSuggestions(false);
    } finally {
      setIsLoading(false);
    }
  };
  // block end: search function using Nominatim API

  // block start: handles location selection and marker placement
  const selectLocation = (location) => {
    const lat = parseFloat(location.lat);
    const lon = parseFloat(location.lon);
    
    if (currentMarkerRef.current) map.removeLayer(currentMarkerRef.current);

    currentMarkerRef.current = L.marker([lat, lon], {
      icon: L.divIcon({
        className: 'search-marker',
        html: `<div class="search-marker-icon">📍</div>`,
        iconSize: [30, 30],
        iconAnchor: [15, 30]
      })
    }).addTo(map);

    map.setView([lat, lon], 15);
    setQuery(location.display_name);
    setShowSuggestions(false);
  };
  // block end: handles location selection and marker placement

  // block start: utility functions for search management
  const clearSearch = () => {
    setQuery('');
    setSuggestions([]);
    setShowSuggestions(false);
    if (currentMarkerRef.current) {
      map.removeLayer(currentMarkerRef.current);
      currentMarkerRef.current = null;
    }
  };

  const formatDisplayName = (displayName) => displayName.split(', ').slice(0, 3).join(', ');
  // block end: utility functions for search management

  // block start: main render method for search component
  return (
    <div className="search-container" ref={searchRef}>
      <div className="search-input-wrapper">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
          placeholder="Search for places in Bangladesh..."
          className="search-input"
        />
        {query && (
          <button onClick={clearSearch} className="search-clear-button" type="button">✕</button>
        )}
        {isLoading && (
          <div className="search-loading">
            <div className="search-spinner"></div>
          </div>
        )}
      </div>

      {showSuggestions && suggestions.length > 0 && (
        <div className="search-suggestions">
          {suggestions.map((suggestion, index) => (
            <div
              key={`${suggestion.place_id}-${index}`}
              className="search-suggestion-item"
              onClick={() => selectLocation(suggestion)}
            >
              <div className="suggestion-icon">📍</div>
              <div className="suggestion-content">
                <div className="suggestion-name">
                  {suggestion.name || suggestion.display_name.split(',')[0]}
                </div>
                <div className="suggestion-address">
                  {formatDisplayName(suggestion.display_name)}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
  // block end: main render method for search component
};
// block end: search component with Google Maps-style functionality

export default SearchBox;