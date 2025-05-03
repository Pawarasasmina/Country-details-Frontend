import { useParams, Link } from 'react-router-dom';
import { useEffect, useState, useCallback } from 'react';
import { getCountryByCode } from '../services/api';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { motion } from 'framer-motion';
import Clock from 'react-clock';
import 'react-clock/dist/Clock.css';
import 'leaflet/dist/leaflet.css';
import React from 'react';
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';
import { FaArrowLeft, FaGlobe, FaMapMarkerAlt, FaClock, FaLanguage, FaMoneyBillWave, FaRulerCombined, FaStar, FaRegStar } from 'react-icons/fa';
import Header, { notifyFavoritesChanged } from '../components/Header';

// Register Chart.js components
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

function CountryDetail() {
  const { code } = useParams();
  // Group related state variables
  const [country, setCountry] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // User related state
  const [user, setUser] = useState(null);
  const [isFavorite, setIsFavorite] = useState(false);
  const [showFavorites, setShowFavorites] = useState(false);
  
  // Time related state
  const [localTime, setLocalTime] = useState(new Date());
  const [countryTime, setCountryTime] = useState(new Date());
  
  // Currency related state
  const [exchangeRates, setExchangeRates] = useState({});
  const [loadingRates, setLoadingRates] = useState(false);

  // Improved timezone offset calculation with better error handling
  const getTimezoneOffset = useCallback((timezoneStr) => {
    if (!timezoneStr) return 0;
    
    try {
      // Handle common formats: UTC+XX:XX, UTC-XX:XX, etc.
      const match = timezoneStr.match(/UTC([+-])(\d{1,2}):?(\d{0,2})/);
      if (match) {
        const sign = match[1] === '+' ? 1 : -1;
        const hours = parseInt(match[2], 10) || 0;
        const minutes = parseInt(match[3], 10) || 0;
        return sign * (hours * 60 + minutes);
      }
      
      // Handle simple hour offsets: UTC+X, UTC-X
      const simpleMatch = timezoneStr.match(/UTC([+-])(\d{1,2})/);
      if (simpleMatch) {
        const sign = simpleMatch[1] === '+' ? 1 : -1;
        const hours = parseInt(simpleMatch[2], 10) || 0;
        return sign * (hours * 60);
      }
      
      return 0;
    } catch (error) {
      console.error('Error parsing timezone:', error, timezoneStr);
      return 0;
    }
  }, []);

  // Format time with consistent formatting
  const formatTime = useCallback((date) => {
    if (!date || !(date instanceof Date) || isNaN(date.getTime())) {
      return 'Invalid time';
    }
    
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true
    });
  }, []);

  const formatDate = useCallback((date) => {
    if (!date || !(date instanceof Date) || isNaN(date.getTime())) {
      return 'Invalid date';
    }
    
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }, []);

  // Fetch country data
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const res = await getCountryByCode(code);
        if (res && res.length > 0) {
          setCountry(res[0]);
        } else {
          setError('Country not found');
        }
      } catch (err) {
        console.error('Error loading country:', err);
        setError('Failed to load country information. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [code]);

  // Load user data and check if country is in favorites
  useEffect(() => {
    const username = localStorage.getItem('user');
    if (username) {
      const allUsers = JSON.parse(localStorage.getItem('users')) || {};
      const userData = allUsers[username];
      setUser(userData);
      
      if (userData && userData.favorites && country) {
        setIsFavorite(userData.favorites.includes(country.cca3));
      }
    }
  }, [country]);

  // Update clock times
  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      setLocalTime(new Date(now));

      if (country?.timezones?.[0]) {
        try {
          const timezoneOffset = getTimezoneOffset(country.timezones[0]);
          const utcTime = now.getTime() + (now.getTimezoneOffset() * 60000);
          const countryTimeMs = utcTime + (timezoneOffset * 60000);
          setCountryTime(new Date(countryTimeMs));
        } catch (error) {
          console.error('Error calculating country time:', error);
          setCountryTime(new Date(now));
        }
      }
    }, 1000);
    
    return () => clearInterval(interval);
  }, [country, getTimezoneOffset]);

  // Fetch exchange rates
  useEffect(() => {
    if (country && country.currencies) {
      const fetchExchangeRates = async () => {
        setLoadingRates(true);
        try {
          const currencyCodes = Object.keys(country.currencies);
          const rates = {};
          
          for (const currencyCode of currencyCodes) {
            try {
              const response = await fetch(`https://api.exchangerate-api.com/v4/latest/USD`);
              if (!response.ok) throw new Error(`HTTP error: ${response.status}`);
              
              const data = await response.json();
              if (data.rates && data.rates[currencyCode]) {
                rates[currencyCode] = {
                  rate: (1 / data.rates[currencyCode]).toFixed(2),
                  lastUpdated: new Date(data.time_last_updated * 1000).toLocaleDateString()
                };
              } else {
                rates[currencyCode] = { rate: "N/A", lastUpdated: "N/A" };
              }
            } catch (error) {
              console.error(`Failed to fetch rate for ${currencyCode}:`, error);
              rates[currencyCode] = { rate: "N/A", lastUpdated: "N/A" };
            }
          }
          
          setExchangeRates(rates);
        } catch (error) {
          console.error("Error fetching exchange rates:", error);
        } finally {
          setLoadingRates(false);
        }
      };
      
      fetchExchangeRates();
    }
  }, [country]);

  // Handle adding/removing from favorites
  const handleFavoriteToggle = useCallback(() => {
    const username = localStorage.getItem('user');
    if (!username || !country) return;

    const allUsers = JSON.parse(localStorage.getItem('users')) || {};
    const userData = allUsers[username];

    if (!userData) return;

    if (userData.favorites.includes(country.cca3)) {
      userData.favorites = userData.favorites.filter((code) => code !== country.cca3);
      setIsFavorite(false);
    } else {
      userData.favorites.push(country.cca3);
      setIsFavorite(true);
    }

    allUsers[username] = userData;
    localStorage.setItem('users', JSON.stringify(allUsers));
    setUser(userData);
    
    // Notify other components that favorites have changed
    notifyFavoritesChanged();
  }, [country]);

  // Get population comparison data
  const getPopulationData = useCallback((countryPopulation) => {
    if (!country) return null;
    
    const worldAvgPopulation = 8220345569;
    let regionalAvg = 0;
    
    switch (country.region) {
      case 'Africa':
        regionalAvg = 1549867579;
        break;
      case 'Europe':
        regionalAvg = 744398832;
        break;
      case 'Asia':
        regionalAvg = 4835320060;
        break;
      case 'Americas':
        regionalAvg = 387528403;
        break;
      case 'Oceania':
        regionalAvg = 46609644;
        break;
      default:
        regionalAvg = worldAvgPopulation / 5; // Rough estimate if region unknown
    }

    return {
      labels: [`${country.name.common}`, `${country.region} Average`, 'World Average'],
      datasets: [
        {
          label: 'Population (millions)',
          data: [
            countryPopulation / 1000000, 
            regionalAvg / 1000000,
            worldAvgPopulation / 1000000
          ],
          backgroundColor: [
            'rgba(54, 162, 235, 0.8)',
            'rgba(75, 192, 192, 0.8)',
            'rgba(153, 102, 255, 0.8)',
          ],
          borderColor: [
            'rgb(54, 162, 235)',
            'rgb(75, 192, 192)',
            'rgb(153, 102, 255)',
          ],
          borderWidth: 1,
        },
      ],
    };
  }, [country]);
  
  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        display: false,
      },
      title: {
        display: true,
        text: 'Population Comparison (in millions)',
        font: {
          size: 16,
          weight: 'bold',
        },
        color: '#374151',
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            return context.formattedValue + ' million people';
          }
        },
        backgroundColor: 'rgba(53, 162, 235, 0.9)',
        titleFont: {
          size: 14,
          weight: 'bold'
        },
        bodyFont: {
          size: 13
        },
        padding: 12,
        cornerRadius: 6,
        displayColors: false
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: function(value) {
            return value + 'M';
          },
          color: '#6B7280',
          font: {
            weight: 'medium'
          }
        },
        grid: {
          color: 'rgba(209, 213, 219, 0.3)',
        },
        border: {
          dash: [4, 4]
        }
      },
      x: {
        ticks: {
          color: '#4B5563',
          font: {
            weight: 'medium'
          }
        },
        grid: {
          display: false,
        }
      }
    },
    maintainAspectRatio: false,
    animation: {
      duration: 2000,
      easing: 'easeOutQuart'
    },
    elements: {
      bar: {
        borderRadius: 6
      }
    }
  };

  // Additional information rendering helpers
  const renderBorderCountries = useCallback(() => {
    if (!country?.borders?.length) return <span className="text-gray-500 italic">No bordering countries</span>;
    
    return (
      <div className="flex flex-wrap gap-2">
        {country.borders.map(border => (
          <span key={border} className="px-3 py-1 bg-indigo-100 text-indigo-800 rounded-full text-sm font-medium">
            {border}
          </span>
        ))}
      </div>
    );
  }, [country]);

  const renderInternationalCodes = useCallback(() => {
    if (!country) return null;
    
    return (
      <div className="flex flex-wrap gap-3">
        {country.cca2 && (
          <div className="flex flex-col items-center p-2 bg-blue-50 rounded-lg min-w-[70px]">
            <span className="text-xs text-gray-500">ISO 2</span>
            <span className="font-bold text-blue-700">{country.cca2}</span>
          </div>
        )}
        {country.cca3 && (
          <div className="flex flex-col items-center p-2 bg-green-50 rounded-lg min-w-[70px]">
            <span className="text-xs text-gray-500">ISO 3</span>
            <span className="font-bold text-green-700">{country.cca3}</span>
          </div>
        )}
        {country.ccn3 && (
          <div className="flex flex-col items-center p-2 bg-purple-50 rounded-lg min-w-[70px]">
            <span className="text-xs text-gray-500">Numeric</span>
            <span className="font-bold text-purple-700">{country.ccn3}</span>
          </div>
        )}
        {country.cioc && (
          <div className="flex flex-col items-center p-2 bg-yellow-50 rounded-lg min-w-[70px]">
            <span className="text-xs text-gray-500">Olympic</span>
            <span className="font-bold text-yellow-700">{country.cioc}</span>
          </div>
        )}
      </div>
    );
  }, [country]);

  const renderTransportInfo = useCallback(() => {
    if (!country?.car) return null;
    
    return (
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
          <span className="text-xs text-gray-500 block mb-1">Driving Side</span>
          <div className="flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 9l3 3m0 0l-3 3m3-3H8m13 0a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="font-semibold capitalize">{country.car.side}</span>
          </div>
        </div>
        {country.car.signs && country.car.signs.length > 0 && (
          <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
            <span className="text-xs text-gray-500 block mb-1">Vehicle Sign</span>
            <div className="flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="font-semibold">{country.car.signs.join(', ')}</span>
            </div>
          </div>
        )}
      </div>
    );
  }, [country]);

  const renderAdditionalInfo = useCallback(() => {
    if (!country) return null;
    
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {country.startOfWeek && (
          <div className="bg-gray-50 p-3 rounded-lg">
            <span className="text-xs text-gray-500 block mb-1">Week Starts On</span>
            <span className="font-medium capitalize">{country.startOfWeek}</span>
          </div>
        )}
        {country.independent !== undefined && (
          <div className="bg-gray-50 p-3 rounded-lg">
            <span className="text-xs text-gray-500 block mb-1">Independence Status</span>
            <span className="font-medium">{country.independent ? 'Independent' : 'Dependent'}</span>
          </div>
        )}
        {country.unMember !== undefined && (
          <div className="bg-gray-50 p-3 rounded-lg">
            <span className="text-xs text-gray-500 block mb-1">UN Membership</span>
            <span className="font-medium">{country.unMember ? 'UN Member' : 'Not a UN Member'}</span>
          </div>
        )}
        {country.landlocked !== undefined && (
          <div className="bg-gray-50 p-3 rounded-lg">
            <span className="text-xs text-gray-500 block mb-1">Geography</span>
            <span className="font-medium">{country.landlocked ? 'Landlocked' : 'Has Coastline'}</span>
          </div>
        )}
      </div>
    );
  }, [country]);

  // Tab state for better organization
  const [activeTab, setActiveTab] = useState('general');

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-gray-50">
        <Header onToggleFavorites={setShowFavorites} showFavoritesButton={false} />
        <div className="flex-1 flex items-center justify-center">
          <motion.div
            className="bg-white p-8 rounded-xl shadow-lg w-full max-w-md"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
          >
            <div className="animate-pulse flex flex-col items-center">
              <div className="h-16 w-16 bg-blue-200 rounded-full mb-6"></div>
              <div className="h-8 w-48 bg-gray-200 rounded mb-6"></div>
              <div className="h-4 w-32 bg-gray-100 rounded mb-3"></div>
              <div className="h-4 w-36 bg-gray-100 rounded mb-3"></div>
              <div className="mt-4 flex items-center justify-center space-x-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
              </div>
              <p className="text-gray-500 mt-4">Loading country information...</p>
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen flex flex-col bg-gray-50">
        <Header onToggleFavorites={setShowFavorites} showFavoritesButton={false} />
        <div className="flex-1 flex items-center justify-center">
          <motion.div
            className="bg-white p-8 rounded-xl shadow-lg text-center max-w-md"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
          >
            <div className="text-red-500 mb-4 text-5xl">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-3">Something went wrong</h2>
            <p className="text-gray-600 mb-6">{error}</p>
            <Link
              to="/"
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <FaArrowLeft className="mr-2" />
              Return to Countries
            </Link>
          </motion.div>
        </div>
      </div>
    );
  }

  // Main content when country is loaded
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header onToggleFavorites={setShowFavorites} showFavoritesButton={false} />
      <div className="flex-1 py-6 px-4 sm:px-6 overflow-auto">
        <motion.div
          className="max-w-7xl mx-auto"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6 }}
        >
          <div className="relative mb-10 flex justify-between items-center">
            <Link
              to="/"
              className="flex items-center gap-2 text-blue-600 hover:text-blue-800 transition-colors z-10"
            >
              <FaArrowLeft />
              <span className="font-medium">Back to Countries</span>
            </Link>
            
            <motion.h1 
              className="text-4xl md:text-5xl font-bold text-center mx-auto py-3 text-gray-800 max-w-3xl"
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3, duration: 0.7 }}
            >
              <span className="relative inline-block">
                {country.name.common}
              </span>
            </motion.h1>
            
            {user && (
              <button 
                onClick={handleFavoriteToggle}
                className="p-2 rounded-full hover:bg-gray-100 transition-colors"
                aria-label={isFavorite ? "Remove from favorites" : "Add to favorites"}
              >
                {isFavorite ? (
                  <FaStar className="text-yellow-400 text-xl" />
                ) : (
                  <FaRegStar className="text-gray-400 hover:text-yellow-400 text-xl" />
                )}
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Flag and Key Facts */}
            <motion.div
              className="lg:col-span-1"
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              <div className="bg-white rounded-2xl shadow-md overflow-hidden">
                <div className="p-4 bg-gray-50 border-b border-gray-200">
                  <h2 className="text-xl font-semibold text-center text-gray-800">
                    National Flag
                  </h2>
                </div>
                <div className="relative overflow-hidden group p-5">
                  <img
                    src={country.flags.svg}
                    alt={`Flag of ${country.name.common}`}
                    className="w-full h-auto object-cover transition-transform duration-500 group-hover:scale-105 border border-gray-200 rounded-lg shadow-sm"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                </div>
                
                <div className="p-6">
                  <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
                    <FaGlobe className="mr-2 text-blue-500" />
                    Key Facts
                  </h2>
                  <div className="space-y-4 text-gray-700">
                    <div className="bg-gray-50 p-3 rounded-lg border-l-4 border-blue-500">
                      <span className="font-medium block text-sm text-gray-500">Official Name</span>
                      <span className="font-semibold">{country.name.official}</span>
                    </div>
                    
                    <div className="bg-gray-50 p-3 rounded-lg border-l-4 border-green-500">
                      <span className="font-medium block text-sm text-gray-500">Capital</span>
                      <span className="font-semibold">{country.capital?.[0] || 'N/A'}</span>
                    </div>
                    
                    <div className="bg-gray-50 p-3 rounded-lg border-l-4 border-purple-500">
                      <span className="font-medium block text-sm text-gray-500">Region</span>
                      <span className="font-semibold">{country.region}</span>
                    </div>
                    
                    <div className="bg-gray-50 p-3 rounded-lg border-l-4 border-yellow-500">
                      <span className="font-medium block text-sm text-gray-500">Subregion</span>
                      <span className="font-semibold">{country.subregion || 'N/A'}</span>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Population and Languages */}
            <motion.div
              className="lg:col-span-1"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              <div className="space-y-6">
                <div className="bg-white rounded-2xl shadow-md p-6">
                  <h2 className="text-xl font-semibold text-gray-800 mb-3">Population</h2>
                  <div className="flex items-center mb-4">
                    <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center mr-3">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                    </div>
                    <p className="text-3xl font-bold text-blue-600">
                      {country.population.toLocaleString()}
                    </p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-xl border border-gray-100" style={{ height: '240px' }}>
                    <Bar data={getPopulationData(country.population)} options={chartOptions} />
                  </div>
                </div>
                
                <div className="bg-white rounded-2xl shadow-md p-6">
                  <div className="mb-6">
                    <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
                      <FaLanguage className="mr-2 text-blue-500" />
                      Languages
                    </h2>
                    <div className="flex flex-wrap gap-2">
                      {Object.entries(country.languages || {}).length > 0 ? (
                        Object.entries(country.languages).map(([code, language]) => (
                          <span key={code} className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm flex items-center">
                            <span className="font-mono text-xs mr-1.5 bg-blue-200 px-1.5 py-0.5 rounded">{code}</span>
                            {language}
                          </span>
                        ))
                      ) : (
                        <span className="text-gray-500 italic">No language information available</span>
                      )}
                    </div>
                  </div>
                  
                  <div>
                    <h2 className="text-xl font-semibold text-gray-800 mb-3 flex items-center">
                      <FaRulerCombined className="mr-2 text-blue-500" />
                      Area
                    </h2>
                    <div className="bg-gray-50 p-4 rounded-lg flex items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-gray-400 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                      </svg>
                      <p className="text-2xl font-bold text-gray-700">
                        {country.area.toLocaleString()} km²
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-white rounded-2xl shadow-md p-6">
                  <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
                    <FaMoneyBillWave className="mr-2 text-blue-500" />
                    Currency
                  </h2>
                  <div className="space-y-3">
                    {Object.entries(country.currencies || {}).length > 0 ? (
                      Object.entries(country.currencies).map(([code, currency]) => (
                        <div key={code} className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                          <div className="flex items-center justify-between mb-3">
                            <div>
                              <span className="font-medium text-lg">{currency.name}</span>
                              <div className="text-sm text-gray-500 mt-0.5">{code}</div>
                            </div>
                            <span className="text-blue-600 font-bold text-xl">{currency.symbol}</span>
                          </div>
                          <div className="text-sm border-t border-gray-200 pt-3 mt-1">
                            <div className="flex justify-between items-center">
                              <span className="text-gray-600">USD Exchange Rate:</span>
                              {loadingRates ? (
                                <span className="text-xs bg-gray-100 px-2 py-1 rounded animate-pulse">Loading...</span>
                              ) : (
                                <span className="font-semibold text-green-600">
                                  {exchangeRates[code]?.rate ? `$1 USD = ${exchangeRates[code]?.rate} ${code}` : 'Rate unavailable'}
                                </span>
                              )}
                            </div>
                            {exchangeRates[code]?.lastUpdated && exchangeRates[code]?.lastUpdated !== "N/A" && (
                              <div className="text-xs text-gray-500 mt-1 text-right">
                                Last updated: {exchangeRates[code]?.lastUpdated}
                              </div>
                            )}
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="bg-gray-50 p-4 rounded-lg text-center text-gray-500">
                        No currency information available
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Map and Time */}
            <motion.div
              className="lg:col-span-1"
              initial={{ x: 20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.4 }}
            >
              <div className="space-y-6">
                <div className="bg-white rounded-2xl shadow-md overflow-hidden">
                  <div className="p-4 bg-gray-50 border-b border-gray-200">
                    <h2 className="text-xl font-semibold text-gray-800 flex items-center justify-center">
                      <FaMapMarkerAlt className="mr-2 text-blue-500" />
                      Location
                    </h2>
                  </div>
                  <div className="h-[350px]">
                    {country.latlng && country.latlng.length === 2 ? (
                      <MapContainer
                        center={country.latlng}
                        zoom={4}
                        style={{ height: '100%', width: '100%' }}
                        zoomControl={false}
                      >
                        <TileLayer
                          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                        />
                        <Marker position={country.latlng}>
                          <Popup>
                            <div className="text-center">
                              <strong>{country.name.common}</strong>
                              <p>{country.capital?.[0]}</p>
                            </div>
                          </Popup>
                        </Marker>
                      </MapContainer>
                    ) : (
                      <div className="h-full flex items-center justify-center bg-gray-100">
                        <p className="text-gray-500">Map coordinates not available</p>
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="bg-white rounded-2xl shadow-md overflow-hidden">
                  <div className="p-4 bg-gray-50 border-b border-gray-200">
                    <h2 className="text-xl font-semibold text-gray-800 flex items-center justify-center">
                      <FaClock className="mr-2 text-blue-500" />
                      Time Comparison
                    </h2>
                  </div>
                  <div className="p-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      <div className="flex flex-col items-center">
                        <h3 className="text-base font-medium text-gray-700 mb-3">Your Local Time</h3>
                        <div className="mb-3" style={{ width: '120px', height: '120px' }}>
                          <Clock 
                            value={localTime} 
                            renderNumbers={true}
                            size={120}
                          />
                        </div>
                        <p className="text-lg font-semibold text-gray-800">{formatTime(localTime)}</p>
                        <p className="text-xs text-gray-500 mt-1">{formatDate(localTime)}</p>
                      </div>
                      
                      <div className="flex flex-col items-center">
                        <h3 className="text-base font-medium text-gray-700 mb-3">{country.name.common} Time</h3>
                        <div className="mb-3" style={{ width: '120px', height: '120px' }}>
                          <Clock 
                            value={countryTime} 
                            renderNumbers={true}
                            size={120}
                          />
                        </div>
                        <p className="text-lg font-semibold text-gray-800">{formatTime(countryTime)}</p>
                        <p className="text-xs text-gray-500 mt-1">{formatDate(countryTime)}</p>
                      </div>
                    </div>
                    
                    <div className="mt-4 pt-4 border-t border-gray-100">
                      <h3 className="text-sm font-medium text-gray-700 mb-2">Timezones:</h3>
                      <div className="flex flex-wrap gap-2">
                        {country.timezones && country.timezones.length ? (
                          country.timezones.map((timezone, index) => (
                            <span key={index} className="px-2 py-1 bg-gray-100 text-gray-800 rounded-md text-xs">
                              {timezone}
                            </span>
                          ))
                        ) : (
                          <span className="text-gray-500 italic">No timezone information</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

export default CountryDetail;
