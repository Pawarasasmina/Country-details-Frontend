import React, { useEffect, useState } from 'react'
import Header from '../components/Header'
import SearchBar from '../components/SearchBar'
import FilterBar from '../components/FilterBar'
import CountryCard from '../components/CountryCard'
import { motion, AnimatePresence } from 'framer-motion'
import { FaSearch, FaFilter, FaHeart, FaTimes, FaSortAmountDown, FaThLarge, FaList } from 'react-icons/fa'
import {
  getAllCountries,
  getCountryByName,
  getCountriesByRegion,
  getCountriesByLanguage,
} from '../services/api'

function Home() {
  const [countries, setCountries] = useState([])
  const [filteredCountries, setFilteredCountries] = useState([])
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedRegion, setSelectedRegion] = useState('')
  const [selectedLanguage, setSelectedLanguage] = useState('')
  const [showFavorites, setShowFavorites] = useState(false)
  const [topRegions, setTopRegions] = useState([])
  const [topLanguages, setTopLanguages] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [sortOrder, setSortOrder] = useState('') 
  const [viewMode, setViewMode] = useState('grid') // 'grid' or 'list'

  const toggleFavorites = () => {
    setShowFavorites(!showFavorites)
  }

  const toggleViewMode = () => {
    setViewMode(viewMode === 'grid' ? 'list' : 'grid')
  }

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true)
      try {
        const data = await getAllCountries()
        setCountries(data)
        setFilteredCountries(data)

        // Calculate top 5 regions
        const regionCounts = data.reduce((acc, country) => {
          acc[country.region] = (acc[country.region] || 0) + 1
          return acc
        }, {})
        const sortedRegions = Object.entries(regionCounts)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 5)
          .map(([region]) => region)
        setTopRegions(sortedRegions)

        // Calculate top 8 languages
        const languageCounts = data.reduce((acc, country) => {
          Object.values(country.languages || {}).forEach((language) => {
            acc[language] = (acc[language] || 0) + 1
          })
          return acc
        }, {})
        const sortedLanguages = Object.entries(languageCounts)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 8)
          .map(([language]) => language)
        setTopLanguages(sortedLanguages)
      } catch (error) {
        console.error('Error fetching countries:', error)
      } finally {
        setIsLoading(false)
      }
    }
    fetchData()
  }, [])

  useEffect(() => {
    const fetchFilteredData = async () => {
      setIsLoading(true)
      try {
        let results = [];
        
        // Determine which API to use based on priority, but then apply other filters client-side
        if (searchQuery) {
          // If search query exists, use the search API endpoint
          results = await getCountryByName(searchQuery);
          
          // Then apply additional filters client-side
          if (selectedRegion) {
            results = results.filter(country => country.region === selectedRegion);
          }
          if (selectedLanguage) {
            results = results.filter(country => {
              const languages = country.languages || {};
              return Object.values(languages).some(lang => 
                lang.toLowerCase() === selectedLanguage.toLowerCase()
              );
            });
          }
        } 
        else if (selectedRegion) {
          // If region is selected, use the region API endpoint
          results = await getCountriesByRegion(selectedRegion);
          
          // Then apply language filter if needed
          if (selectedLanguage) {
            results = results.filter(country => {
              const languages = country.languages || {};
              return Object.values(languages).some(lang => 
                lang.toLowerCase() === selectedLanguage.toLowerCase()
              );
            });
          }
        }
        else if (selectedLanguage) {
          // If language is selected, use the language API endpoint
          results = await getCountriesByLanguage(selectedLanguage);
        }
        else {
          // If no search, region, or language filter is active, use all countries
          results = countries;
        }
        
        // Apply favorites filter
        if (showFavorites) {
          const username = localStorage.getItem('user')
          const allUsers = JSON.parse(localStorage.getItem('users')) || {}
          const user = allUsers[username]
          if (user) {
            results = results.filter((country) => user.favorites.includes(country.cca3))
          }
        }

        // Apply sorting
        if (sortOrder) {
          results = [...results].sort((a, b) => {
            const [field, direction] = sortOrder.split('-');
            
            if (field === 'name') {
              return direction === 'asc' 
                ? a.name.common.localeCompare(b.name.common)
                : b.name.common.localeCompare(a.name.common);
            }
            
            if (field === 'population') {
              return direction === 'asc'
                ? a.population - b.population
                : b.population - a.population;
            }
            
            if (field === 'area') {
              // Handle potential undefined area values
              const areaA = a.area || 0;
              const areaB = b.area || 0;
              return direction === 'asc'
                ? areaA - areaB
                : areaB - areaA;
            }
            
            return 0;
          });
        }

        setFilteredCountries(results)
      } catch (error) {
        console.error('Error fetching filtered countries:', error)
        setFilteredCountries([]) // Set empty array on error
      } finally {
        setIsLoading(false)
      }
    };

    // Only fetch when filters change
    fetchFilteredData();
  }, [searchQuery, selectedRegion, selectedLanguage, countries, showFavorites, sortOrder]);

  // Function to clear all filters
  const clearFilters = () => {
    setSearchQuery('')
    setSelectedRegion('')
    setSelectedLanguage('')
    setShowFavorites(false)
    setSortOrder('') // Clear sort order when clearing filters
  }

  // Check if any filters are active
  const hasActiveFilters = searchQuery || selectedRegion || selectedLanguage || showFavorites || sortOrder

  return (
    <div className="flex flex-col h-screen w-full bg-gray-50 overflow-hidden">
      <Header onToggleFavorites={setShowFavorites} />
      
      {/* Main content area with overflow scrolling */}
      <div className="flex-1 overflow-hidden">
        <div className="h-full overflow-y-auto">
          {/* Rest of the content */}
          <div className="p-4 md:p-6">
            {/* Search and filter section - more compact */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="bg-white rounded-xl shadow-md p-3 mb-4"
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between mb-2">
                <div className="flex items-center mb-2 md:mb-0">
                  <FaSearch className="text-blue-500 mr-2" />
                  <h2 className="text-lg font-semibold">Find Countries</h2>
                </div>
                
                {hasActiveFilters && (
                  <button 
                    onClick={clearFilters}
                    className="flex items-center text-sm text-red-600 hover:text-red-800 transition-colors"
                  >
                    <FaTimes className="mr-1" />
                    Clear all filters
                  </button>
                )}
              </div>
              
              {/* Compact search and filter layout */}
              <div className="flex flex-col md:flex-row md:space-x-4">
                <div className="md:flex-1">
                  <SearchBar onSearch={setSearchQuery} value={searchQuery} />
                </div>
                
                <div className="md:flex-1">
                  <FilterBar
                    onRegionChange={setSelectedRegion}
                    onLanguageChange={setSelectedLanguage}
                    onSortChange={setSortOrder}
                    regions={topRegions}
                    languages={topLanguages}
                    selectedRegion={selectedRegion}
                    selectedLanguage={selectedLanguage}
                    selectedSort={sortOrder}
                  />
                </div>
              </div>
              
              {/* Active filters display - more compact */}
              {hasActiveFilters && (
                <div className="mt-2 pt-2 border-t border-gray-100">
                  <div className="flex items-center text-xs text-gray-600 mb-1">
                    <FaFilter className="mr-1 text-blue-500" />
                    <span>Active filters:</span>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {showFavorites && (
                      <span className="px-2 py-0.5 bg-red-100 text-red-800 rounded-full text-xs flex items-center">
                        <FaHeart className="mr-1 text-xs" /> Favorites
                      </span>
                    )}
                    {searchQuery && (
                      <span className="px-2 py-0.5 bg-blue-100 text-blue-800 rounded-full text-xs">
                        Search: "{searchQuery}"
                      </span>
                    )}
                    {selectedRegion && (
                      <span className="px-2 py-0.5 bg-green-100 text-green-800 rounded-full text-xs">
                        Region: {selectedRegion}
                      </span>
                    )}
                    {selectedLanguage && (
                      <span className="px-2 py-0.5 bg-purple-100 text-purple-800 rounded-full text-xs">
                        Language: {selectedLanguage}
                      </span>
                    )}
                    {sortOrder && (
                      <span className="px-2 py-0.5 bg-yellow-100 text-yellow-800 rounded-full text-xs flex items-center">
                        <FaSortAmountDown className="mr-1 text-xs" /> 
                        Sorted by: {sortOrder.split('-')[0].charAt(0).toUpperCase() + sortOrder.split('-')[0].slice(1)} 
                        ({sortOrder.includes('-asc') ? 'Ascending' : 'Descending'})
                      </span>
                    )}
                  </div>
                </div>
              )}
            </motion.div>
            
            {/* Results header with view toggle */}
            <div className="flex justify-between items-center mb-4 px-1">
              <h2 className="text-xl font-semibold text-gray-800">
                {isLoading ? 'Loading countries...' : 
                  `${filteredCountries.length} ${filteredCountries.length === 1 ? 'Country' : 'Countries'} ${showFavorites ? 'in Favorites' : 'Found'}`
                }
              </h2>
              
              {/* View toggle buttons */}
              {!isLoading && filteredCountries.length > 0 && (
                <div className="flex bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                  <button 
                    onClick={() => setViewMode('grid')}
                    className={`px-3 py-2 flex items-center ${viewMode === 'grid' 
                      ? 'bg-blue-500 text-white' 
                      : 'bg-white text-gray-700 hover:bg-gray-100'}`}
                    aria-label="Grid view"
                  >
                    <FaThLarge className={`${viewMode === 'grid' ? 'text-white' : 'text-gray-600'}`} />
                  </button>
                  <button 
                    onClick={() => setViewMode('list')}
                    className={`px-3 py-2 flex items-center ${viewMode === 'list' 
                      ? 'bg-blue-500 text-white' 
                      : 'bg-white text-gray-700 hover:bg-gray-100'}`}
                    aria-label="List view"
                  >
                    <FaList className={`${viewMode === 'list' ? 'text-white' : 'text-gray-600'}`} />
                  </button>
                </div>
              )}
            </div>
            
            {/* Countries grid/list with loading state */}
            <div className="pb-4">
              {isLoading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4 md:gap-6">
                  {[...Array(10)].map((_, index) => (
                    <div key={index} className="bg-white rounded-lg shadow-md overflow-hidden animate-pulse">
                      <div className="h-40 bg-gray-300"></div>
                      <div className="p-4">
                        <div className="h-6 bg-gray-300 rounded w-3/4 mb-3"></div>
                        <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
                        <div className="h-4 bg-gray-200 rounded w-1/3 mb-2"></div>
                        <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <AnimatePresence>
                  {viewMode === 'grid' ? (
                    <div id="country-list" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4 md:gap-6">
                      {filteredCountries.length > 0 ? (
                        filteredCountries.map((country) => (
                          <motion.div
                            key={country.cca3}
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            transition={{ duration: 0.3 }}
                            layout
                          >
                            <CountryCard country={country} viewMode={viewMode} />
                          </motion.div>
                        ))
                      ) : (
                        <motion.div 
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="col-span-full"
                        >
                          <div className="text-center py-12 px-4 bg-white rounded-lg shadow-sm">
                            <FaSearch className="inline-block text-4xl text-gray-300 mb-4" />
                            <h3 className="text-xl font-semibold text-gray-800 mb-2">No countries found</h3>
                            <p className="text-gray-600 mb-4">
                              {showFavorites 
                                ? "You don't have any favorites yet. Add countries to your favorites!"
                                : "Try adjusting your search or filters to find what you're looking for."}
                            </p>
                            {hasActiveFilters && (
                              <button
                                onClick={clearFilters}
                                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                              >
                                Clear all filters
                              </button>
                            )}
                          </div>
                        </motion.div>
                      )}
                    </div>
                  ) : (
                    <div id="country-list-view" className="flex flex-col gap-3">
                      {filteredCountries.length > 0 ? (
                        filteredCountries.map((country) => (
                          <motion.div
                            key={country.cca3}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 20 }}
                            transition={{ duration: 0.3 }}
                          >
                            <CountryCard country={country} viewMode={viewMode} />
                          </motion.div>
                        ))
                      ) : (
                        <motion.div 
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                        >
                          <div className="text-center py-12 px-4 bg-white rounded-lg shadow-sm">
                            <FaSearch className="inline-block text-4xl text-gray-300 mb-4" />
                            <h3 className="text-xl font-semibold text-gray-800 mb-2">No countries found</h3>
                            <p className="text-gray-600 mb-4">
                              {showFavorites 
                                ? "You don't have any favorites yet. Add countries to your favorites!"
                                : "Try adjusting your search or filters to find what you're looking for."}
                            </p>
                            {hasActiveFilters && (
                              <button
                                onClick={clearFilters}
                                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                              >
                                Clear all filters
                              </button>
                            )}
                          </div>
                        </motion.div>
                      )}
                    </div>
                  )}
                </AnimatePresence>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Home
