import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { MapContainer, TileLayer, GeoJSON, Tooltip } from 'react-leaflet';
import { motion } from 'framer-motion';
import Header from '../components/Header';
import { getAllCountries } from '../services/api';
import 'leaflet/dist/leaflet.css';
import { FaGlobeAmericas, FaInfoCircle, FaArrowLeft } from 'react-icons/fa';

function WorldMap() {
  const [countries, setCountries] = useState([]);
  const [worldGeoJSON, setWorldGeoJSON] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showFavorites, setShowFavorites] = useState(false);
  const navigate = useNavigate();

  // Fetch countries data and GeoJSON data
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        // Fetch countries from the REST API
        const countriesData = await getAllCountries();
        setCountries(countriesData);
        
        // Fetch world GeoJSON data
        const geoResponse = await fetch('https://raw.githubusercontent.com/johan/world.geo.json/master/countries.geo.json');
        if (!geoResponse.ok) {
          throw new Error('Failed to load world map data');
        }
        const geoData = await geoResponse.json();
        setWorldGeoJSON(geoData);
      } catch (err) {
        console.error('Error loading map data:', err);
        setError('Failed to load world map. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, []);

  // Set map style for each country
  const countryStyle = {
    fillColor: '#4f46e5',
    weight: 1,
    opacity: 1,
    color: '#6366f1',
    fillOpacity: 0.5
  };

  // Set highlighted style when hovering over a country
  const highlightStyle = {
    weight: 2,
    color: '#fff',
    fillColor: '#3b82f6',
    fillOpacity: 0.7
  };

  // Handle country feature events
  const onEachCountry = (feature, layer) => {
    // Find matching country from REST API data
    const countryMatch = countries.find(country => 
      country.cca3 === feature.properties.ISO_A3 || 
      country.name.common.toLowerCase() === feature.properties.name.toLowerCase()
    );
    
    if (countryMatch) {
      // Add tooltip with country name
      layer.bindTooltip(countryMatch.name.common, { 
        permanent: false,
        direction: 'top',
        className: 'country-tooltip'
      });
      
      // Add click handler to navigate to country detail
      layer.on({
        click: () => {
          navigate(`/country/${countryMatch.cca3}`);
        },
        mouseover: () => {
          layer.setStyle(highlightStyle);
        },
        mouseout: () => {
          layer.setStyle(countryStyle);
        }
      });
    }
  };

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      <Header showFavoritesButton={false} />
      
      <div className="flex-1 p-4 md:p-6 overflow-hidden flex flex-col">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="bg-white p-4 rounded-xl shadow-md mb-4"
        >
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                <FaGlobeAmericas className="text-blue-600 text-xl" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-800">Interactive World Map</h1>
                <p className="text-sm text-gray-600">Click on any country to view detailed information</p>
              </div>
            </div>
            
            <Link to="/">
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                className="flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-indigo-500 to-blue-600 hover:from-indigo-600 hover:to-blue-700 text-white shadow-md transition-all duration-300 border border-blue-400/30"
              >
                <FaArrowLeft className="text-blue-200" />
                <span className="hidden md:inline text-sm md:text-base font-medium">Back to Home</span>
                <span className="md:hidden text-sm font-medium">Back</span>
              </motion.button>
            </Link>
          </div>
        </motion.div>
        
        <div className="flex-1 rounded-xl overflow-hidden shadow-md relative">
          {isLoading && (
            <div className="absolute inset-0 bg-gray-100 flex items-center justify-center z-10">
              <div className="flex flex-col items-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mb-3"></div>
                <p className="text-gray-600">Loading world map...</p>
              </div>
            </div>
          )}
          
          {error && (
            <div className="absolute inset-0 bg-gray-100 flex items-center justify-center z-10">
              <div className="bg-white p-6 rounded-lg shadow-md max-w-md text-center">
                <FaInfoCircle className="text-red-500 text-4xl mx-auto mb-3" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Error Loading Map</h3>
                <p className="text-gray-600 mb-4">{error}</p>
                <button 
                  onClick={() => window.location.reload()}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Try Again
                </button>
              </div>
            </div>
          )}
          
          {!isLoading && !error && worldGeoJSON && (
            <MapContainer 
              center={[20, 0]} 
              zoom={2} 
              style={{ height: "100%", width: "100%" }}
              minZoom={2}
              maxBounds={[[-90, -180], [90, 180]]}
            >
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              />
              <GeoJSON 
                data={worldGeoJSON} 
                style={countryStyle} 
                onEachFeature={onEachCountry}
              />
            </MapContainer>
          )}
          
          <div className="absolute bottom-4 right-4 z-10">
            <div className="bg-white/90 backdrop-blur-sm px-4 py-2 rounded-lg shadow text-sm text-gray-700">
              <p className="font-medium">Total Countries: {countries.length}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default WorldMap;
