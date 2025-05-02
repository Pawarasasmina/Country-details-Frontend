import { useParams, Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { getCountryByCode } from '../services/api';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { motion } from 'framer-motion';
import 'react-clock/dist/Clock.css';
import 'leaflet/dist/leaflet.css';

function CountryDetail() {
  const { code } = useParams();
  const [country, setCountry] = useState(null);
  const [user, setUser] = useState(null);
  const [localTime, setLocalTime] = useState(new Date());
  const [countryTime, setCountryTime] = useState(new Date());

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await getCountryByCode(code);
        setCountry(res[0]); // API returns an array
      } catch (err) {
        console.error('Error loading country:', err);
      }
    };
    fetchData();
  }, [code]);

  useEffect(() => {
    const username = localStorage.getItem('user');
    if (username) {
      const allUsers = JSON.parse(localStorage.getItem('users')) || {};
      setUser(allUsers[username]);
    }
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      setLocalTime(now);

      if (country?.timezones?.[0]) {
        const formatter = new Intl.DateTimeFormat('en-US', {
          timeZone: country.timezones[0],
          hour: 'numeric',
          minute: 'numeric',
          second: 'numeric',
          hour12: true
        });
        const parts = formatter.formatToParts(now);
        const hours = parts.find((part) => part.type === 'hour')?.value;
        const minutes = parts.find((part) => part.type === 'minute')?.value;
        const seconds = parts.find((part) => part.type === 'second')?.value;
        const dayPeriod = parts.find((part) => part.type === 'dayPeriod')?.value;
        setCountryTime(new Date(now.setHours(hours, minutes, seconds)));
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [country]);

  const formatTimeDigital = (date) => {
    return {
      time: new Intl.DateTimeFormat('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true
      }).format(date),
      date: new Intl.DateTimeFormat('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      }).format(date)
    };
  };

  const handleFavoriteToggle = () => {
    const username = localStorage.getItem('user');
    if (!username) return;

    const allUsers = JSON.parse(localStorage.getItem('users')) || {};
    const user = allUsers[username];

    if (user.favorites.includes(country.cca3)) {
      user.favorites = user.favorites.filter((code) => code !== country.cca3);
    } else {
      user.favorites.push(country.cca3);
    }

    allUsers[username] = user;
    localStorage.setItem('users', JSON.stringify(allUsers));
    setUser(user);
  };

  if (!country) {
    return (
      <motion.p
        className="text-center mt-6"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        Loading...
      </motion.p>
    );
  }

  return (
    <motion.div
      className="max-w-6xl mx-auto p-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Link
        to="/"
        className="inline-block mb-4 bg-gray-800 text-white px-4 py-2 rounded hover:bg-gray-900 transition-transform transform hover:scale-105"
      >
        ← Back
      </Link>

      <motion.div
        className="bg-white shadow-lg rounded-lg p-6 flex flex-col md:flex-row gap-6"
        initial={{ scale: 0.95 }}
        animate={{ scale: 1 }}
        transition={{ duration: 0.3 }}
      >
        {/* Left Section: Flag and Details */}
        <motion.div
          className="flex-1"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <img
            src={country.flags.svg}
            alt={country.name.common}
            className="w-full rounded-lg shadow-md mb-4"
          />
          <div>
            <h1 className="text-4xl font-bold mb-4">{country.name.common}</h1>
            <p className="text-lg"><strong>Official Name:</strong> {country.name.official}</p>
            <p className="text-lg"><strong>Capital:</strong> {country.capital?.[0]}</p>
            <p className="text-lg"><strong>Region:</strong> {country.region}</p>
            <p className="text-lg"><strong>Subregion:</strong> {country.subregion}</p>
            <p className="text-lg"><strong>Population:</strong> {country.population.toLocaleString()}</p>
            <p className="text-lg"><strong>Languages:</strong> {Object.values(country.languages || {}).join(', ')}</p>
            <p className="text-lg"><strong>Timezones:</strong> {country.timezones.join(', ')}</p>
            <p className="text-lg"><strong>Area:</strong> {country.area.toLocaleString()} km²</p>
            <p className="text-lg"><strong>Currency:</strong> {Object.values(country.currencies || {}).map(c => c.name).join(', ')}</p>
          </div>
        </motion.div>

        {/* Right Section: Map and Clocks */}
        <motion.div
          className="flex-1"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          <h2 className="text-2xl font-semibold mb-4">Location on Map</h2>
          <MapContainer
            center={country.latlng}
            zoom={4}
            style={{ height: '400px', width: '100%' }}
            className="rounded-lg shadow-md mb-6"
          >
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            />
            <Marker position={country.latlng}>
              <Popup>
                {country.name.common}
              </Popup>
            </Marker>
          </MapContainer>
          <h2 className="text-2xl font-semibold mb-4">Current Time</h2>
          <div className="flex justify-center items-center">
            <div className="text-center p-6 bg-gradient-to-b from-gray-100 to-gray-200 rounded-lg shadow-lg w-full border border-gray-300">
              <h3 className="text-xl font-medium mb-3 text-gray-700">{country.name.common} Time</h3>
              <div className="flex flex-col items-center justify-center">
                <div className="text-5xl font-mono bg-gray-800 text-white px-6 py-4 rounded-lg w-full mb-2 font-bold tracking-wider shadow-inner">
                  {formatTimeDigital(countryTime).time}
                  <span className="inline-block ml-2 w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
                </div>
                <div className="text-gray-600 text-lg mt-2 font-semibold">
                  {formatTimeDigital(countryTime).date}
                </div>
                <div className="mt-2 text-sm text-gray-500">
                  Timezone: {country.timezones[0]}
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </motion.div>
  );
}

export default CountryDetail;
