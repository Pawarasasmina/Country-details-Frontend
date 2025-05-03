import { useUser } from '../contexts/UserContext';
import { useNavigate, Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { FaHeart, FaGlobeAmericas, FaSignOutAlt, FaUser, FaRegHeart, FaStar } from 'react-icons/fa';
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// Custom event name for favorites changes
const FAVORITES_CHANGED_EVENT = 'favoritesChanged';

// Helper function to dispatch event when favorites change
export const notifyFavoritesChanged = () => {
  window.dispatchEvent(new CustomEvent(FAVORITES_CHANGED_EVENT));
};

function Header({ onToggleFavorites, showFavoritesButton = true }) {
  const { user, logout } = useUser();
  const navigate = useNavigate();
  const [showFavorites, setShowFavorites] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [favoritesCount, setFavoritesCount] = useState(0);
  const [scrolled, setScrolled] = useState(false);

  // Function to update favorites count from localStorage
  const updateFavoritesCount = () => {
    if (user?.username) {
      try {
        const allUsers = JSON.parse(localStorage.getItem('users')) || {};
        const userData = allUsers[user.username];
        if (userData && userData.favorites) {
          setFavoritesCount(userData.favorites.length);
        } else {
          setFavoritesCount(0);
        }
      } catch (error) {
        console.error('Error updating favorites count:', error);
        setFavoritesCount(0);
      }
    } else {
      setFavoritesCount(0);
    }
  };

  // Listen for favorites changes and update count
  useEffect(() => {
    // Update count initially
    updateFavoritesCount();
    
    // Listen for favorites changed events
    const handleFavoritesChanged = () => {
      updateFavoritesCount();
    };
    
    window.addEventListener(FAVORITES_CHANGED_EVENT, handleFavoritesChanged);
    
    // Clean up
    return () => {
      window.removeEventListener(FAVORITES_CHANGED_EVENT, handleFavoritesChanged);
    };
  }, [user?.username]);
  
  // Additional effect to update count when showFavorites changes
  useEffect(() => {
    updateFavoritesCount();
  }, [showFavorites]);

  // Detect scroll for header style changes
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleFavoritesClick = () => {
    const newState = !showFavorites;
    setShowFavorites(newState);
    onToggleFavorites(newState);
  };
  
  const handleLogoutClick = () => {
    setShowLogoutConfirm(true);
  };
  
  const confirmLogout = () => {
    logout();
    navigate('/login');
    setShowLogoutConfirm(false);
  };

  return (
    <header 
      className={`bg-gradient-to-r from-blue-800 to-indigo-900 text-white py-3 px-4 
                 flex flex-wrap justify-between items-center sticky top-0 z-30 transition-all duration-300
                 ${scrolled ? 'shadow-xl backdrop-blur-sm bg-opacity-90' : 'shadow-lg'}`}
    >
      <Link to="/" className="flex items-center gap-2 group">
        <motion.div
          whileHover={{ rotate: 360 }}
          transition={{ duration: 0.7, ease: "easeInOut" }}
          className="bg-gradient-to-br from-blue-400 to-indigo-500 p-2 rounded-full shadow-md"
        >
          <FaGlobeAmericas className="text-xl text-white" />
        </motion.div>
        <div>
          <h1 className="text-xl md:text-2xl font-bold group-hover:text-blue-200 transition-colors">
            Country Book
          </h1>
          <span className="text-xs text-blue-300 hidden md:inline-block">Explore the world</span>
        </div>
      </Link>
      
      <div className="flex items-center gap-3 md:gap-4 order-3 md:order-2 w-full md:w-auto justify-center mt-3 md:mt-0">
        {/* World Map Link */}
        <Link to="/world-map">
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            className="flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-indigo-500 to-blue-600 hover:from-indigo-600 hover:to-blue-700 text-white shadow-md transition-all duration-300 border border-blue-400/30"
          >
            <FaGlobeAmericas className="text-blue-200" />
            <span className="text-sm md:text-base font-medium">World Map</span>
          </motion.button>
        </Link>
        
        {showFavoritesButton && (
          <motion.button
            onClick={handleFavoritesClick}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            className={`flex items-center gap-2 px-4 py-2 rounded-full shadow-md transition-all duration-300 border
                      ${showFavorites 
                        ? 'bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white border-red-400/30' 
                        : 'bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white border-blue-400/30'
                      }`}
          >
            {showFavorites ? (
              <FaRegHeart className="text-red-200" />
            ) : (
              <div className="relative">
                <FaHeart className="text-red-200" />
                {favoritesCount > 0 && (
                  <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
                    {favoritesCount > 9 ? '9+' : favoritesCount}
                  </span>
                )}
              </div>
            )}
            <span className="text-sm md:text-base font-medium">
              {showFavorites ? 'Show All Countries' : 'View Favorites'}
            </span>
          </motion.button>
        )}
      </div>
      
      <div className="flex items-center gap-3 order-2 md:order-3">
        {user && (
          <motion.div 
            className="flex items-center gap-2 md:gap-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <motion.div 
              className="hidden md:flex items-center gap-2 bg-gradient-to-r from-blue-700/50 to-indigo-700/50 backdrop-blur-sm px-3 py-1.5 rounded-full border border-blue-500/30"
              whileHover={{ scale: 1.03 }}
            >
              <div className="bg-blue-500 rounded-full p-1">
                <FaUser className="text-white text-xs" />
              </div>
              <div className="flex flex-col">
                <span className="text-xs text-blue-200">Welcome,</span>
                <span className="text-sm font-semibold text-white -mt-1">{user.username}</span>
              </div>
              {user.favorites && user.favorites.length > 0 && (
                <div className="bg-blue-500/30 rounded-full px-2 py-0.5 flex items-center ml-1">
                  <FaStar className="text-yellow-300 text-xs mr-1" />
                  <span className="text-xs font-medium">{user.favorites.length}</span>
                </div>
              )}
            </motion.div>
            
            <motion.button
              onClick={handleLogoutClick}
              whileHover={{ scale: 1.05, backgroundColor: '#b91c1c' }}
              whileTap={{ scale: 0.95 }}
              className="flex items-center gap-1.5 bg-gradient-to-r from-red-600 to-red-700 text-white px-3 py-1.5 rounded-md shadow-md transition-all duration-300 border border-red-500/30"
            >
              <FaSignOutAlt />
              <span className="hidden md:inline font-medium">Logout</span>
            </motion.button>
          </motion.div>
        )}
      </div>
      
      {/* Logout Confirmation Dialog */}
      <AnimatePresence>
        {showLogoutConfirm && (
          <motion.div 
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowLogoutConfirm(false)}
          >
            <motion.div 
              className="bg-white text-gray-800 p-6 rounded-xl shadow-2xl max-w-md mx-4 border border-gray-200"
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-center gap-4 mb-4">
                <div className="bg-red-100 p-3 rounded-full">
                  <FaSignOutAlt className="text-red-600 text-xl" />
                </div>
                <h3 className="text-xl font-semibold">Confirm Logout</h3>
              </div>
              <p className="mb-6 text-gray-600">Are you sure you want to logout from your account? You'll need to sign in again to access your favorites.</p>
              <div className="flex justify-end gap-3">
                <motion.button 
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors font-medium text-gray-700"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setShowLogoutConfirm(false)}
                >
                  Cancel
                </motion.button>
                <motion.button 
                  className="px-4 py-2 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white rounded-lg transition-colors font-medium"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={confirmLogout}
                >
                  Confirm Logout
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}

export default Header;
