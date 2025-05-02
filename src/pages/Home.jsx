import React, { useEffect, useState } from 'react'
import Header from '../components/Header'
import SearchBar from '../components/SearchBar'
import FilterBar from '../components/FilterBar'
import CountryCard from '../components/CountryCard'
import {
  getAllCountries,
  getCountryByName,
  getCountriesByRegion,
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

  const toggleFavorites = () => {
    setShowFavorites(!showFavorites)
  }

  useEffect(() => {
    const fetchData = async () => {
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

      // Calculate top 5 languages
      const languageCounts = data.reduce((acc, country) => {
        Object.values(country.languages || {}).forEach((language) => {
          acc[language] = (acc[language] || 0) + 1
        })
        return acc
      }, {})
      const sortedLanguages = Object.entries(languageCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([language]) => language)
      setTopLanguages(sortedLanguages)
    }
    fetchData()
  }, [])

  useEffect(() => {
    let results = countries

    if (showFavorites) {
      const username = localStorage.getItem('user')
      const allUsers = JSON.parse(localStorage.getItem('users')) || {}
      const user = allUsers[username]
      if (user) {
        results = results.filter((country) => user.favorites.includes(country.cca3))
      }
    }

    // Search by name
    if (searchQuery) {
      results = results.filter((country) =>
        country.name.common.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    // Filter by region
    if (selectedRegion) {
      results = results.filter(
        (country) => country.region === selectedRegion
      )
    }

    // Filter by language
    if (selectedLanguage) {
      results = results.filter((country) =>
        Object.values(country.languages || {}).includes(selectedLanguage)
      )
    }

    setFilteredCountries(results)
  }, [searchQuery, selectedRegion, selectedLanguage, countries, showFavorites])

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-blue-50">
      <Header onToggleFavorites={setShowFavorites} />
      
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-800 text-white py-12 mb-8 shadow-lg">
        <div className="max-w-6xl mx-auto px-4">
          <h1 className="text-4xl font-bold mb-4">Explore Our World</h1>
          <p className="text-xl opacity-90 max-w-2xl">
            Discover details about countries around the globe, from population and languages to 
            currencies and time zones.
          </p>
        </div>
      </div>
      
      <div className="max-w-6xl mx-auto px-4 pb-12">
        {/* Stats Banner */}
        <div className="flex flex-wrap justify-between items-center mb-8 bg-white rounded-xl p-4 shadow-md">
          <div className="text-center p-3">
            <p className="text-3xl font-bold text-indigo-600">{countries.length}</p>
            <p className="text-gray-600">Countries</p>
          </div>
          <div className="text-center p-3">
            <p className="text-3xl font-bold text-indigo-600">{topRegions.length}</p>
            <p className="text-gray-600">Regions</p>
          </div>
          <div className="text-center p-3">
            <p className="text-3xl font-bold text-indigo-600">{topLanguages.length}</p>
            <p className="text-gray-600">Languages</p>
          </div>
          <div className="text-center p-3">
            <p className="text-3xl font-bold text-indigo-600">
              {showFavorites ? 
                (() => {
                  const username = localStorage.getItem('user');
                  const allUsers = JSON.parse(localStorage.getItem('users')) || {};
                  return allUsers[username]?.favorites?.length || 0;
                })() : 
                '❤️'
              }
            </p>
            <p className="text-gray-600">
              {showFavorites ? 'Favorites' : 'Save Favorites'}
            </p>
          </div>
        </div>
        
        {/* Search Section with Modern Design */}
        <div className="bg-white rounded-xl p-6 shadow-md mb-8">
          <h2 className="text-2xl font-semibold mb-4 text-gray-800">Find Your Country</h2>
          <div className="mb-6">
            <SearchBar onSearch={setSearchQuery} />
          </div>
          <FilterBar
            onRegionChange={setSelectedRegion}
            onLanguageChange={setSelectedLanguage}
            regions={topRegions}
            languages={topLanguages}
          />
        </div>
        
        {/* Results Section */}
        <div className="bg-white rounded-xl p-6 shadow-md">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-semibold text-gray-800">
              {showFavorites ? 'Your Favorite Countries' : 'Countries'}
            </h2>
            <span className="text-sm font-medium text-gray-500">
              {filteredCountries.length} results
            </span>
          </div>
          
          {/* Country Grid with Animation */}
          <div id="country-list" className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
            {filteredCountries.length > 0 ? (
              filteredCountries.map((country) => (
                <div key={country.cca3} className="transform transition duration-300 hover:scale-105">
                  <CountryCard country={country} />
                </div>
              ))
            ) : (
              <div className="text-center col-span-full py-12">
                <svg className="w-16 h-16 mx-auto text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-xl text-gray-600">No countries found.</p>
                <p className="text-gray-500 mt-2">Try adjusting your search or filters.</p>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Footer */}
      <footer className="bg-gray-800 text-white py-6 mt-12">
        <div className="max-w-6xl mx-auto px-4 text-center">
          <p>&copy; {new Date().getFullYear()} Country Book | Explore our beautiful world</p>
        </div>
      </footer>
    </div>
  )
}

export default Home
