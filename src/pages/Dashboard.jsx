import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { getAllCountries } from '../services/api';
import { FaGlobeAmericas, FaUsers, FaSearch, FaArrowRight, FaChartBar, FaMap, FaStar, FaSignInAlt, FaUserPlus, FaCity, FaLanguage, FaMoneyBillWave, FaRoute } from 'react-icons/fa';
import { Bar, Pie, Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement } from 'chart.js';
import bg from '../assets/bg.jpg';
import CountUp from 'react-countup';

// Register Chart.js components
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement);

function Dashboard() {
  const [countries, setCountries] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [regionStats, setRegionStats] = useState({});
  const [languageStats, setLanguageStats] = useState({});
  const [populationStats, setPopulationStats] = useState({});
  const [currencyStats, setCurrencyStats] = useState({});
  const [dashboardMetrics, setDashboardMetrics] = useState({
    totalPopulation: 0,
    avgPopulation: 0,
    independentCountries: 0,
    unCountries: 0,
  });
  const [userCount, setUserCount] = useState(0);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch countries data
        const countriesData = await getAllCountries();
        setCountries(countriesData);

        // Get region statistics
        const regions = {};
        countriesData.forEach(country => {
          if (!regions[country.region]) {
            regions[country.region] = 0;
          }
          regions[country.region]++;
        });
        setRegionStats(regions);

        // Get languages statistics
        const languages = {};
        countriesData.forEach(country => {
          if (country.languages) {
            Object.values(country.languages).forEach(lang => {
              if (!languages[lang]) {
                languages[lang] = 0;
              }
              languages[lang]++;
            });
          }
        });
        
        // Sort languages by frequency and get top 5
        const sortedLanguages = Object.entries(languages)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 5)
          .reduce((obj, [key, value]) => {
            obj[key] = value;
            return obj;
          }, {});
        
        setLanguageStats(sortedLanguages);

        // Get population by continent
        const populationByContinent = {};
        countriesData.forEach(country => {
          if (!populationByContinent[country.region]) {
            populationByContinent[country.region] = 0;
          }
          populationByContinent[country.region] += country.population;
        });
        setPopulationStats(populationByContinent);
        
        // Get currency statistics (top 5)
        const currencies = {};
        countriesData.forEach(country => {
          if (country.currencies) {
            Object.keys(country.currencies).forEach(currency => {
              if (!currencies[currency]) {
                currencies[currency] = 0;
              }
              currencies[currency]++;
            });
          }
        });
        
        const topCurrencies = Object.entries(currencies)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 5)
          .reduce((obj, [key, value]) => {
            obj[key] = value;
            return obj;
          }, {});
        
        setCurrencyStats(topCurrencies);
        
        // Calculate dashboard metrics
        const totalPop = countriesData.reduce((sum, country) => sum + country.population, 0);
        const independentCount = countriesData.filter(country => country.independent).length;
        const unCount = countriesData.filter(country => country.unMember).length;
        
        setDashboardMetrics({
          totalPopulation: totalPop,
          avgPopulation: Math.round(totalPop / countriesData.length),
          independentCountries: independentCount,
          unCountries: unCount
        });

        // Get user count from localStorage
        const allUsers = JSON.parse(localStorage.getItem('users')) || {};
        setUserCount(Object.keys(allUsers).length);
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Failed to load dashboard data');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  // Prepare chart data for regions
  const regionChartData = {
    labels: Object.keys(regionStats),
    datasets: [
      {
        label: 'Number of Countries',
        data: Object.values(regionStats),
        backgroundColor: [
          'rgba(54, 162, 235, 0.7)',
          'rgba(255, 99, 132, 0.7)',
          'rgba(255, 206, 86, 0.7)',
          'rgba(75, 192, 192, 0.7)',
          'rgba(153, 102, 255, 0.7)',
        ],
        borderColor: [
          'rgba(54, 162, 235, 1)',
          'rgba(255, 99, 132, 1)',
          'rgba(255, 206, 86, 1)',
          'rgba(75, 192, 192, 1)',
          'rgba(153, 102, 255, 1)',
        ],
        borderWidth: 1
      }
    ]
  };

  // Prepare population chart data
  const populationChartData = {
    labels: Object.keys(populationStats),
    datasets: [
      {
        label: 'Population (billions)',
        data: Object.values(populationStats).map(pop => pop / 1000000000),
        backgroundColor: [
          'rgba(255, 99, 132, 0.7)',
          'rgba(54, 162, 235, 0.7)',
          'rgba(255, 206, 86, 0.7)',
          'rgba(75, 192, 192, 0.7)',
          'rgba(153, 102, 255, 0.7)',
          'rgba(255, 159, 64, 0.7)',
        ],
        borderColor: [
          'rgba(255, 99, 132, 1)',
          'rgba(54, 162, 235, 1)',
          'rgba(255, 206, 86, 1)',
          'rgba(75, 192, 192, 1)',
          'rgba(153, 102, 255, 1)',
          'rgba(255, 159, 64, 1)',
        ],
        borderWidth: 1,
      }
    ]
  };

  // Currency donut chart data
  const currencyChartData = {
    labels: Object.keys(currencyStats),
    datasets: [
      {
        label: 'Countries using currency',
        data: Object.values(currencyStats),
        backgroundColor: [
          'rgba(75, 192, 192, 0.7)',
          'rgba(153, 102, 255, 0.7)',
          'rgba(255, 159, 64, 0.7)',
          'rgba(54, 162, 235, 0.7)',
          'rgba(255, 99, 132, 0.7)',
        ],
        borderColor: [
          'rgba(75, 192, 192, 1)',
          'rgba(153, 102, 255, 1)',
          'rgba(255, 159, 64, 1)',
          'rgba(54, 162, 235, 1)',
          'rgba(255, 99, 132, 1)',
        ],
        borderWidth: 1
      }
    ]
  };

  // Chart options
  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'bottom',
      },
      title: {
        display: true,
        text: 'Countries by Region',
        font: {
          size: 16,
          weight: 'bold'
        },
        color: '#374151',
      }
    }
  };

  const populationChartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'bottom',
      },
      title: {
        display: true,
        text: 'Population by Region (Billions)',
        font: {
          size: 16,
          weight: 'bold'
        },
        color: '#374151',
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            const value = context.raw;
            return `Population: ${(value * 1000000000).toLocaleString()} people`;
          }
        }
      }
    }
  };

  const currencyChartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'right',
      },
      title: {
        display: true,
        text: 'Top 5 Currencies by Usage',
        font: {
          size: 16,
          weight: 'bold'
        },
        color: '#374151',
      }
    }
  };

  // Sample countries for preview
  const sampleCountries = countries.slice(0, 4);

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-16 h-16 border-t-4 border-blue-500 border-solid rounded-full animate-spin mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-gray-700">Loading dashboard data...</h2>
          <p className="text-gray-500 mt-2">Preparing global statistics and insights</p>
          <div className="mt-4 w-64 h-2 bg-gray-200 rounded-full mx-auto overflow-hidden">
            <div className="h-full bg-blue-500 animate-pulse rounded-full"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
        <div className="text-center max-w-md">
          <div className="text-red-500 text-5xl mb-4">
            <FaGlobeAmericas className="mx-auto" />
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-3">Something went wrong</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="relative bg-gradient-to-r from-blue-900 to-indigo-800 text-white py-16 px-4 sm:px-6 lg:px-8" style={{
        backgroundImage: `linear-gradient(rgba(30, 58, 138, 0.85), rgba(79, 70, 229, 0.85)), url(${bg})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center'
      }}>
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="mb-10 md:mb-0 md:max-w-xl">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
              >
                <div className="flex items-center mb-6">
                  <FaGlobeAmericas className="text-4xl mr-3 text-blue-300" />
                  <h1 className="text-4xl md:text-5xl font-extrabold">Country Book</h1>
                </div>
                <p className="text-xl mb-8 text-blue-100">
                  Your comprehensive guide to <span className="font-semibold">{countries.length} countries</span> around the world, with detailed demographics, statistics, and geographic insights.
                </p>
                <div className="flex flex-wrap gap-4">
                  <Link to="/login" className="px-6 py-3 bg-white text-blue-800 rounded-full font-semibold hover:bg-blue-50 transition-colors shadow-md flex items-center">
                    <FaSignInAlt className="mr-2" />
                    Sign In
                  </Link>
                  <Link to="/login" className="px-6 py-3 bg-transparent border-2 border-white text-white rounded-full font-semibold hover:bg-white/10 transition-colors flex items-center" onClick={() => localStorage.setItem('showRegister', 'true')}>
                    <FaUserPlus className="mr-2" />
                    Create Account
                  </Link>
                </div>
              </motion.div>
            </div>
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="bg-white/10 backdrop-blur-sm p-6 rounded-2xl shadow-lg"
            >
              <div className="text-center">
                <p className="text-blue-200 mb-2">Global Overview</p>
                <h2 className="text-3xl font-bold mb-6">World Statistics</h2>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white/10 p-4 rounded-xl">
                    <p className="text-5xl font-bold">
                      <CountUp end={Object.keys(regionStats).length} duration={2} />
                    </p>
                    <p className="text-sm text-blue-200">Regions</p>
                  </div>
                  <div className="bg-white/10 p-4 rounded-xl">
                    <p className="text-5xl font-bold">
                      <CountUp end={dashboardMetrics.unCountries} duration={2} />
                    </p>
                    <p className="text-sm text-blue-200">UN Members</p>
                  </div>
                  <div className="bg-white/10 p-4 rounded-xl">
                    <p className="text-5xl font-bold">
                      <CountUp end={Object.keys(languageStats).length + 5} duration={2} />+
                    </p>
                    <p className="text-sm text-blue-200">Languages</p>
                  </div>
                  <div className="bg-white/10 p-4 rounded-xl">
                    <p className="text-5xl font-bold">
                      <CountUp end={Math.floor(dashboardMetrics.totalPopulation / 1000000000)} duration={2} />B+
                    </p>
                    <p className="text-sm text-blue-200">Global Population</p>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
      
      {/* Key Metrics Section */}
      <section className="py-10 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <motion.div 
              className="bg-white p-6 rounded-xl shadow-sm border border-gray-100"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
            >
              <div className="flex items-center mb-3">
                <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center mr-3">
                  <FaGlobeAmericas className="text-blue-600" />
                </div>
                <h3 className="text-lg font-medium text-gray-700">Total Countries</h3>
              </div>
              <p className="text-3xl font-bold text-gray-900">
                <CountUp end={countries.length} duration={2} />
              </p>
              <p className="text-sm text-gray-500 mt-1">Across {Object.keys(regionStats).length} regions</p>
            </motion.div>
            
            <motion.div 
              className="bg-white p-6 rounded-xl shadow-sm border border-gray-100"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.1 }}
            >
              <div className="flex items-center mb-3">
                <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center mr-3">
                  <FaUsers className="text-indigo-600" />
                </div>
                <h3 className="text-lg font-medium text-gray-700">Global Population</h3>
              </div>
              <p className="text-3xl font-bold text-gray-900">
                <CountUp end={Math.floor(dashboardMetrics.totalPopulation / 1000000000)} duration={2} />B
              </p>
              <p className="text-sm text-gray-500 mt-1">{(dashboardMetrics.totalPopulation).toLocaleString()} people</p>
            </motion.div>
            
            <motion.div 
              className="bg-white p-6 rounded-xl shadow-sm border border-gray-100"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.2 }}
            >
              <div className="flex items-center mb-3">
                <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center mr-3">
                  <FaLanguage className="text-green-600" />
                </div>
                <h3 className="text-lg font-medium text-gray-700">Languages</h3>
              </div>
              <p className="text-3xl font-bold text-gray-900">
                {Object.keys(languageStats).length}+
              </p>
              <p className="text-sm text-gray-500 mt-1">Major languages tracked</p>
            </motion.div>
            
            <motion.div 
              className="bg-white p-6 rounded-xl shadow-sm border border-gray-100"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.3 }}
            >
              <div className="flex items-center mb-3">
                <div className="h-10 w-10 rounded-full bg-amber-100 flex items-center justify-center mr-3">
                  <FaRoute className="text-amber-600" />
                </div>
                <h3 className="text-lg font-medium text-gray-700">Avg. Population</h3>
              </div>
              <p className="text-3xl font-bold text-gray-900">
                <CountUp end={Math.floor(dashboardMetrics.avgPopulation / 1000000)} duration={2} />M
              </p>
              <p className="text-sm text-gray-500 mt-1">Per country</p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-12 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-4">Explore Our Features</h2>
          <p className="text-center text-gray-600 max-w-3xl mx-auto mb-12">
            Dive into a world of information with our comprehensive suite of tools designed to enhance your global knowledge
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <motion.div 
              className="p-6 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl shadow-md flex flex-col items-center text-center"
              whileHover={{ y: -5 }}
              transition={{ duration: 0.3 }}
            >
              <div className="h-16 w-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                <FaSearch className="text-blue-600 text-2xl" />
              </div>
              <h3 className="text-xl font-semibold mb-2 text-gray-800">Advanced Search</h3>
              <p className="text-gray-600">
                Easily search for countries by name, filter by region, population, language, or currency to find exactly what you're looking for.
              </p>
            </motion.div>
            
            <motion.div 
              className="p-6 bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl shadow-md flex flex-col items-center text-center"
              whileHover={{ y: -5 }}
              transition={{ duration: 0.3 }}
            >
              <div className="h-16 w-16 bg-purple-100 rounded-full flex items-center justify-center mb-4">
                <FaMap className="text-purple-600 text-2xl" />
              </div>
              <h3 className="text-xl font-semibold mb-2 text-gray-800">Interactive Maps</h3>
              <p className="text-gray-600">
                View countries on interactive maps, explore border relationships, geographic details, and see relative locations in the world.
              </p>
            </motion.div>
            
            <motion.div 
              className="p-6 bg-gradient-to-br from-green-50 to-teal-50 rounded-xl shadow-md flex flex-col items-center text-center"
              whileHover={{ y: -5 }}
              transition={{ duration: 0.3 }}
            >
              <div className="h-16 w-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                <FaChartBar className="text-green-600 text-2xl" />
              </div>
              <h3 className="text-xl font-semibold mb-2 text-gray-800">Detailed Analytics</h3>
              <p className="text-gray-600">
                Analyze demographic trends, compare countries side-by-side, and gain insights through comprehensive statistical data.
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Statistics Section */}
      <section className="py-12 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-4">Global Insights</h2>
          <p className="text-center text-gray-600 max-w-3xl mx-auto mb-12">
            Explore detailed statistics about our world through interactive visualizations
          </p>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-10">
            <motion.div 
              className="bg-white p-6 rounded-xl shadow-md"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <h3 className="text-xl font-semibold mb-4 text-gray-800">Countries by Region</h3>
              <div className="h-64">
                <Bar data={regionChartData} options={chartOptions} />
              </div>
            </motion.div>
            
            <motion.div 
              className="bg-white p-6 rounded-xl shadow-md"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <h3 className="text-xl font-semibold mb-4 text-gray-800">Population Distribution</h3>
              <div className="h-64">
                <Pie data={populationChartData} options={populationChartOptions} />
              </div>
            </motion.div>

            <motion.div 
              className="bg-white p-6 rounded-xl shadow-md"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              <h3 className="text-xl font-semibold mb-4 text-gray-800">Top 5 Languages</h3>
              <div className="space-y-4">
                {Object.entries(languageStats).map(([language, count], index) => (
                  <div key={language} className="flex items-center">
                    <span className="w-1/3 font-medium text-gray-700">{language}</span>
                    <div className="w-2/3 h-6 bg-gray-100 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full ${
                          ['bg-blue-500', 'bg-indigo-500', 'bg-purple-500', 'bg-pink-500', 'bg-red-500'][index % 5]
                        }`}
                        style={{ width: `${(count / Math.max(...Object.values(languageStats))) * 100}%` }}
                      ></div>
                    </div>
                    <span className="ml-2 text-sm text-gray-500">{count}</span>
                  </div>
                ))}
              </div>
            </motion.div>
            
            <motion.div 
              className="bg-white p-6 rounded-xl shadow-md"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
            >
              <h3 className="text-xl font-semibold mb-4 text-gray-800">Currency Usage</h3>
              <div className="h-64">
                <Doughnut data={currencyChartData} options={currencyChartOptions} />
              </div>
            </motion.div>
          </div>
          
          <div className="bg-white p-6 rounded-xl shadow-md">
            <h3 className="text-xl font-semibold mb-6 text-gray-800">Population Heat Map by Region</h3>
            <div className="mb-4">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium text-gray-700">Region</span>
                <span className="text-sm font-medium text-gray-700">Population</span>
              </div>
              {Object.entries(populationStats)
                .sort((a, b) => b[1] - a[1])
                .map(([region, population], index) => (
                  <div key={region} className="mb-3">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-gray-700">{region}</span>
                      <span className="text-gray-600 font-medium">{(population / 1000000000).toFixed(2)}B</span>
                    </div>
                    <div className="w-full h-4 bg-gray-100 rounded-full overflow-hidden">
                      <div 
                        className={`h-full ${
                          ['bg-blue-500', 'bg-indigo-500', 'bg-purple-500', 'bg-pink-500', 'bg-red-500', 'bg-amber-500'][index % 6]
                        }`}
                        style={{ width: `${(population / Math.max(...Object.values(populationStats))) * 100}%` }}
                      ></div>
                    </div>
                  </div>
              ))}
            </div>
            <p className="text-sm text-gray-500 italic text-center">
              Population data represents the total number of people living in each region
            </p>
          </div>
        </div>
      </section>

      {/* Sample Countries Preview */}
      <section className="py-12 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h2 className="text-3xl font-bold text-gray-900">Featured Countries</h2>
              <p className="text-gray-600 mt-2">Preview of randomly selected countries from our database</p>
            </div>
            <Link to="/home" className="text-blue-600 hover:text-blue-800 flex items-center">
              <span className="font-medium">
                <span className="hidden md:inline">explore all </span>
                <span>{countries.length}</span>
                <span className="hidden md:inline"> countries</span>
                <span className="md:hidden"> countries</span>
              </span>
              <FaArrowRight className="ml-2" />
            </Link>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {sampleCountries.map(country => (
              <motion.div 
                key={country.cca3}
                className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-200"
                whileHover={{ y: -5 }}
                transition={{ duration: 0.3 }}
              >
                <div className="h-40 overflow-hidden">
                  <img 
                    src={country.flags.svg || country.flags.png} 
                    alt={`Flag of ${country.name.common}`}
                    className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
                  />
                </div>
                <div className="p-5">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-lg font-bold text-gray-800">{country.name.common}</h3>
                    <span className="text-xs font-medium py-1 px-2 bg-blue-100 text-blue-800 rounded-full">{country.cca3}</span>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center text-gray-700">
                      <span className="font-medium w-24">Region:</span>
                      <span className="ml-2">{country.region}</span>
                    </div>
                    <div className="flex items-center text-gray-700">
                      <span className="font-medium w-24">Capital:</span>
                      <span className="ml-2">{country.capital?.[0] || 'N/A'}</span>
                    </div>
                    <div className="flex items-center text-gray-700">
                      <span className="font-medium w-24">Population:</span>
                      <span className="ml-2">{country.population.toLocaleString()}</span>
                    </div>
                    <div className="flex items-center text-gray-700">
                      <span className="font-medium w-24">Area:</span>
                      <span className="ml-2">{country.area?.toLocaleString() || 'N/A'} km²</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Sign In Footer CTA */}
      <section className="py-12 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-blue-800 to-indigo-800 text-white">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to explore the world?</h2>
          <p className="text-xl mb-8 text-blue-100">
            Join {userCount} users already discovering interesting facts about countries!
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link to="/login" className="px-8 py-3 bg-white text-blue-800 rounded-full font-semibold hover:bg-blue-50 transition-colors shadow-md">
              Sign In Now
            </Link>
            <Link to="/login" className="px-8 py-3 bg-transparent border-2 border-white text-white rounded-full font-semibold hover:bg-white/10 transition-colors" onClick={() => localStorage.setItem('showRegister', 'true')}>
              Create New Account
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

export default Dashboard;
