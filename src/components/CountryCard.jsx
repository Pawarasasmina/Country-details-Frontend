import React from 'react';
import { Link } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { FaHeart, FaRegHeart, FaMapMarkerAlt, FaUsers, FaGlobeAmericas, FaChevronRight } from 'react-icons/fa'
import { motion } from 'framer-motion'
import { notifyFavoritesChanged } from './Header';

function CountryCard({ country, viewMode = 'grid' }) {
  const [isFavorite, setIsFavorite] = useState(false)
  const [imageLoaded, setImageLoaded] = useState(false)
  const [imageError, setImageError] = useState(false)

  useEffect(() => {
    const username = localStorage.getItem('user')
    if (username) {
      const allUsers = JSON.parse(localStorage.getItem('users')) || {}
      const user = allUsers[username]
      if (user?.favorites.includes(country.cca3)) {
        setIsFavorite(true)
      }
    }
  }, [country.cca3])

  const handleFavoriteToggle = () => {
    const username = localStorage.getItem('user')
    if (!username) return

    const allUsers = JSON.parse(localStorage.getItem('users')) || {}
    const user = allUsers[username]

    if (isFavorite) {
      user.favorites = user.favorites.filter((code) => code !== country.cca3)
    } else {
      user.favorites.push(country.cca3)
    }

    allUsers[username] = user
    localStorage.setItem('users', JSON.stringify(allUsers))
    setIsFavorite(!isFavorite)
    
    // Notify other components that favorites have changed
    notifyFavoritesChanged();
  }

  // Format large numbers with abbreviations
  const formatPopulation = (num) => {
    if (num >= 1000000000) {
      return (num / 1000000000).toFixed(1) + 'B';
    }
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    }
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num;
  };

  // Render grid view (original card design)
  if (viewMode === 'grid') {
    return (
      <motion.div 
        className="relative overflow-hidden rounded-xl bg-gradient-to-b from-white to-gray-50 shadow-md hover:shadow-xl transition-all duration-300"
        whileHover={{ y: -5 }}
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
      >
        <Link to={`/country/${country.cca3}`} className="block h-full">
          <div className="relative overflow-hidden aspect-video">
            {!imageError ? (
              <img 
                src={country.flags.svg || country.flags.png} 
                alt={country.flags.alt || `Flag of ${country.name.common}`}
                className={`w-full h-full object-cover transition-all duration-700 ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
                onLoad={() => setImageLoaded(true)}
                onError={() => setImageError(true)}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gray-200">
                <span className="text-gray-500">{country.name.common}</span>
              </div>
            )}
            
            {/* Region badge */}
            <div className="absolute top-3 left-3">
              <span className={`px-2 py-1 rounded-full text-xs font-semibold text-white 
                ${country.region === 'Africa' ? 'bg-yellow-600' : 
                  country.region === 'Americas' ? 'bg-blue-600' : 
                  country.region === 'Asia' ? 'bg-red-600' : 
                  country.region === 'Europe' ? 'bg-green-600' : 
                  country.region === 'Oceania' ? 'bg-purple-600' : 'bg-gray-600'}`}>
                {country.region}
              </span>
            </div>
            
            {/* Gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent"></div>
          </div>
          
          <div className="p-5">
            <div className="flex justify-between items-start mb-3">
              <h2 className="text-xl font-bold text-gray-800 line-clamp-1 group-hover:text-blue-700 transition-colors">
                {country.name.common}
              </h2>
              <motion.button
                onClick={(e) => {
                  e.preventDefault() // Prevent navigation when clicking the heart
                  handleFavoriteToggle()
                }}
                className="relative p-2 rounded-full hover:bg-gray-100"
                whileTap={{ scale: 0.85 }}
              >
                {isFavorite ? (
                  <FaHeart className="text-red-500 text-xl transition-all duration-300 hover:scale-110" />
                ) : (
                  <FaRegHeart className="text-gray-400 text-xl transition-all duration-300 hover:text-red-400" />
                )}
              </motion.button>
            </div>
            
            <div className="space-y-2 text-sm">
              <div className="flex items-center text-gray-700">
                <FaMapMarkerAlt className="mr-2 text-blue-500" />
                <span className="font-medium">Capital:</span>
                <span className="ml-1">{country.capital?.[0] || 'N/A'}</span>
              </div>
              
              <div className="flex items-center text-gray-700">
                <FaGlobeAmericas className="mr-2 text-green-500" />
                <span className="font-medium">Subregion:</span>
                <span className="ml-1">{country.subregion || 'N/A'}</span>
              </div>
              
              <div className="flex items-center text-gray-700">
                <FaUsers className="mr-2 text-purple-500" />
                <span className="font-medium">Population:</span>
                <span className="ml-1 font-semibold text-gray-900">{formatPopulation(country.population)}</span>
                <span className="ml-1 text-xs text-gray-500">({country.population.toLocaleString()})</span>
              </div>
            </div>
            
            {/* Bottom info bar */}
            <div className="mt-4 pt-3 border-t border-gray-200 flex justify-between items-center">
              {country.languages && (
                <div className="flex flex-wrap gap-1">
                  {Object.values(country.languages).slice(0, 2).map((lang, index) => (
                    <span key={index} className="px-2 py-0.5 bg-blue-50 text-blue-700 text-xs rounded-full">
                      {lang}
                    </span>
                  ))}
                  {Object.values(country.languages).length > 2 && (
                    <span className="px-2 py-0.5 bg-gray-50 text-gray-500 text-xs rounded-full">
                      +{Object.values(country.languages).length - 2}
                    </span>
                  )}
                </div>
              )}
              
              <span className="text-xs text-blue-600 font-medium">View details →</span>
            </div>
          </div>
        </Link>
      </motion.div>
    );
  }
  
  // Render list view (new horizontal card design)
  return (
    <motion.div 
      className="relative overflow-hidden bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300"
      whileHover={{ x: 5 }}
      transition={{ duration: 0.2 }}
    >
      <Link to={`/country/${country.cca3}`} className="flex items-center h-full">
        <div className="w-24 sm:w-36 md:w-48 h-full relative flex-shrink-0">
          {!imageError ? (
            <img 
              src={country.flags.svg || country.flags.png} 
              alt={country.flags.alt || `Flag of ${country.name.common}`}
              className={`w-full h-full object-cover transition-all duration-700 ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
              style={{ minHeight: '100px' }}
              onLoad={() => setImageLoaded(true)}
              onError={() => setImageError(true)}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gray-200" style={{ minHeight: '100px' }}>
              <span className="text-gray-500">{country.name.common.charAt(0)}</span>
            </div>
          )}
          
          {/* Region badge in list view */}
          <div className="absolute bottom-2 left-2">
            <span className={`px-2 py-1 rounded-full text-xs font-semibold text-white 
              ${country.region === 'Africa' ? 'bg-yellow-600' : 
                country.region === 'Americas' ? 'bg-blue-600' : 
                country.region === 'Asia' ? 'bg-red-600' : 
                country.region === 'Europe' ? 'bg-green-600' : 
                country.region === 'Oceania' ? 'bg-purple-600' : 'bg-gray-600'}`}>
              {country.region}
            </span>
          </div>
        </div>
        
        <div className="flex-1 p-4 flex items-center">
          <div className="flex-1">
            <div className="flex justify-between items-center mb-2">
              <h2 className="text-lg font-bold text-gray-800 transition-colors group-hover:text-blue-700">
                {country.name.common}
              </h2>
              
              <motion.button
                onClick={(e) => {
                  e.preventDefault() // Prevent navigation when clicking the heart
                  handleFavoriteToggle()
                }}
                className="p-2 rounded-full hover:bg-gray-100"
                whileTap={{ scale: 0.85 }}
              >
                {isFavorite ? (
                  <FaHeart className="text-red-500 text-lg" />
                ) : (
                  <FaRegHeart className="text-gray-400 text-lg" />
                )}
              </motion.button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
              <div className="flex items-center text-gray-700 text-sm">
                <FaMapMarkerAlt className="mr-1.5 text-blue-500" />
                <span className="font-medium">Capital:</span>
                <span className="ml-1 truncate">{country.capital?.[0] || 'N/A'}</span>
              </div>
              
              <div className="flex items-center text-gray-700 text-sm">
                <FaGlobeAmericas className="mr-1.5 text-green-500" />
                <span className="font-medium">Subregion:</span>
                <span className="ml-1 truncate">{country.subregion || 'N/A'}</span>
              </div>
              
              <div className="flex items-center text-gray-700 text-sm">
                <FaUsers className="mr-1.5 text-purple-500" />
                <span className="font-medium">Population:</span>
                <span className="ml-1 font-semibold text-gray-900">{formatPopulation(country.population)}</span>
              </div>
            </div>
            
            {/* Languages in list view */}
            {country.languages && (
              <div className="flex flex-wrap gap-1 mt-2">
                {Object.values(country.languages).slice(0, 3).map((lang, index) => (
                  <span key={index} className="px-2 py-0.5 bg-blue-50 text-blue-700 text-xs rounded-full">
                    {lang}
                  </span>
                ))}
                {Object.values(country.languages).length > 3 && (
                  <span className="px-2 py-0.5 bg-gray-50 text-gray-500 text-xs rounded-full">
                    +{Object.values(country.languages).length - 3}
                  </span>
                )}
              </div>
            )}
          </div>
          
          <div className="ml-4 text-blue-600">
            <FaChevronRight />
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

export default CountryCard
