import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { useUser } from '../contexts/UserContext';
import React from 'react';
import bg from '../assets/bg.jpg'; 
import { FaUser, FaLock, FaEye, FaEyeSlash, FaGoogle, FaFacebook, FaGithub, FaGlobeAmericas, FaCheckCircle } from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';

function Login() {
  const navigate = useNavigate();
  const { login } = useUser();
  
  // Form state
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [email, setEmail] = useState('');
  
  // UI state
  const [isRegister, setIsRegister] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formSuccess, setFormSuccess] = useState(false);
  
  // Validation state
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});

  // Updated useEffect to remove remembered username logic
  useEffect(() => {
    // Check if redirected from dashboard with intent to register
    const showRegister = localStorage.getItem('showRegister');
    if (showRegister === 'true') {
      setIsRegister(true);
      localStorage.removeItem('showRegister');
    }
  }, []);

  // Basic input validation
  const validateForm = () => {
    const newErrors = {};
    
    if (!username.trim()) newErrors.username = 'Username is required';
    else if (username.length < 3) newErrors.username = 'Username must be at least 3 characters';
    
    if (!password.trim()) newErrors.password = 'Password is required';
    else if (password.length < 4) newErrors.password = 'Password must be at least 4 characters';
    
    if (isRegister) {
      if (!email.trim()) newErrors.email = 'Email is required';
      else if (!/\S+@\S+\.\S+/.test(email)) newErrors.email = 'Email is invalid';
      
      if (password !== confirmPassword) newErrors.confirmPassword = 'Passwords do not match';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputBlur = (field) => {
    setTouched({ ...touched, [field]: true });
  };

  const handleLogin = async () => {
    if (!validateForm()) return;
    
    setIsSubmitting(true);
    
    try {
      const allUsers = JSON.parse(localStorage.getItem('users')) || {};
      const user = allUsers[username];

      if (user && user.password === password) {
        // Show success animation briefly before redirecting
        setFormSuccess(true);
        setTimeout(() => {
          login(username);
          navigate('/home'); // Redirect to /home instead of /
        }, 800);
      } else {
        setErrors({ auth: 'Invalid username or password' });
      }
    } catch (error) {
      setErrors({ auth: 'An error occurred. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRegister = async () => {
    if (!validateForm()) return;
    
    setIsSubmitting(true);
    
    try {
      const allUsers = JSON.parse(localStorage.getItem('users')) || {};

      if (allUsers[username]) {
        setErrors({ username: 'Username already exists' });
        setIsSubmitting(false);
        return;
      }
      
      allUsers[username] = { 
        password, 
        email,
        favorites: [],
        createdAt: new Date().toISOString()
      };
      
      localStorage.setItem('users', JSON.stringify(allUsers));
      
      // Show success animation briefly before redirecting
      setFormSuccess(true);
      setTimeout(() => {
        login(username);
        navigate('/');
      }, 800);
    } catch (error) {
      setErrors({ auth: 'Registration failed. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (isRegister) {
      handleRegister();
    } else {
      handleLogin();
    }
  };

  // Toggle between login and registration form
  const toggleForm = () => {
    setIsRegister(!isRegister);
    setErrors({});
    // Don't clear username and password when switching modes
  };

 
  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 relative" 
         style={{ 
           backgroundImage: `url(${bg})`,
           backgroundSize: 'cover',
           backgroundPosition: 'center',
           backgroundAttachment: 'fixed'  // Fix background during scroll
         }}>
      <div className="fixed inset-0 bg-gradient-to-br from-black/70 to-blue-900/50 backdrop-blur-sm"></div>
      
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="bg-white/95 backdrop-blur-md p-8 sm:p-10 rounded-2xl shadow-2xl w-full max-w-md z-10 relative overflow-hidden"
      >
        {/* Success overlay */}
        <AnimatePresence>
          {formSuccess && (
            <motion.div 
              className="absolute inset-0 bg-gradient-to-br from-green-500 to-blue-600 flex items-center justify-center z-20"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <motion.div
                initial={{ scale: 0.5 }}
                animate={{ scale: [0.5, 1.2, 1] }}
                transition={{ times: [0, 0.5, 1], duration: 0.5 }}
              >
                <FaCheckCircle className="text-6xl text-white" />
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      
        {/* Logo and heading */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-white mb-4">
            <FaGlobeAmericas className="text-2xl" />
          </div>
          <h2 className="text-3xl font-extrabold text-gray-900">
            {isRegister ? 'Create Your Account' : 'Welcome Back'}
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            {isRegister 
              ? 'Join Country Book to explore the world' 
              : 'Sign in to access your country favorites'}
          </p>
        </div>
        
        {/* Form */}
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            {/* Username field */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Username
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FaUser className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  placeholder="Enter your username"
                  className={`w-full pl-10 pr-3 py-3 border rounded-lg focus:outline-none focus:ring-2 transition-all ${
                    errors.username && touched.username ? 'border-red-300 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'
                  }`}
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  onBlur={() => handleInputBlur('username')}
                />
              </div>
              {errors.username && touched.username && (
                <p className="mt-1 text-sm text-red-600">{errors.username}</p>
              )}
            </div>
            
            {/* Email field (only for registration) */}
            {isRegister && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
              >
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="text-gray-400">@</span>
                  </div>
                  <input
                    type="email"
                    placeholder="Enter your email"
                    className={`w-full pl-10 pr-3 py-3 border rounded-lg focus:outline-none focus:ring-2 transition-all ${
                      errors.email && touched.email ? 'border-red-300 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'
                    }`}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onBlur={() => handleInputBlur('email')}
                  />
                </div>
                {errors.email && touched.email && (
                  <p className="mt-1 text-sm text-red-600">{errors.email}</p>
                )}
              </motion.div>
            )}
            
            {/* Password field */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FaLock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  className={`w-full pl-10 pr-10 py-3 border rounded-lg focus:outline-none focus:ring-2 transition-all ${
                    errors.password && touched.password ? 'border-red-300 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'
                  }`}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onBlur={() => handleInputBlur('password')}
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <FaEyeSlash className="h-5 w-5 text-gray-400 hover:text-gray-700" />
                  ) : (
                    <FaEye className="h-5 w-5 text-gray-400 hover:text-gray-700" />
                  )}
                </button>
              </div>
              {errors.password && touched.password && (
                <p className="mt-1 text-sm text-red-600">{errors.password}</p>
              )}
            </div>
            
            {/* Confirm Password field (only for registration) */}
            {isRegister && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
              >
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Confirm Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FaLock className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Confirm your password"
                    className={`w-full pl-10 pr-10 py-3 border rounded-lg focus:outline-none focus:ring-2 transition-all ${
                      errors.confirmPassword && touched.confirmPassword ? 'border-red-300 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'
                    }`}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    onBlur={() => handleInputBlur('confirmPassword')}
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? (
                      <FaEyeSlash className="h-5 w-5 text-gray-400 hover:text-gray-700" />
                    ) : (
                      <FaEye className="h-5 w-5 text-gray-400 hover:text-gray-700" />
                    )}
                  </button>
                </div>
                {errors.confirmPassword && touched.confirmPassword && (
                  <p className="mt-1 text-sm text-red-600">{errors.confirmPassword}</p>
                )}
              </motion.div>
            )}
          </div>
          
          {/* Additional form options - removed Remember me checkbox */}
          <div className="flex items-center justify-end">
            {!isRegister && (
              <div className="text-sm">
                <a href="#" className="font-medium text-blue-600 hover:text-blue-500">
                  Forgot password?
                </a>
              </div>
            )}
          </div>
          
          {/* Auth error message */}
          {errors.auth && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {errors.auth}
            </div>
          )}
          
          {/* Submit button */}
          <div>
            <button
              type="submit"
              disabled={isSubmitting}
              className={`w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white focus:outline-none focus:ring-2 focus:ring-offset-2 transition-all ${
                isSubmitting ? 'bg-gray-400 cursor-not-allowed' : isRegister
                  ? 'bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 focus:ring-green-500'
                  : 'bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 focus:ring-blue-500'
              }`}
            >
              {isSubmitting ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
              ) : null}
              {isSubmitting
                ? 'Processing...'
                : isRegister
                ? 'Create Account'
                : 'Sign In'}
            </button>
          </div>
          
          {/* Divider */}
          <div className="flex items-center mt-6">
            <div className="flex-grow border-t border-gray-300"></div>
            <span className="px-3 text-gray-500 text-sm">or continue with</span>
            <div className="flex-grow border-t border-gray-300"></div>
          </div>
          
          {/* Social login buttons */}
          <div className="grid grid-cols-3 gap-3">
            <button
              type="button"
              
              className="py-2.5 px-4 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <FaGoogle className="mx-auto text-red-500" />
            </button>
            <button
              type="button"
             
              className="py-2.5 px-4 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <FaFacebook className="mx-auto text-blue-600" />
            </button>
            <button
              type="button"
             
              className="py-2.5 px-4 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <FaGithub className="mx-auto text-gray-800" />
            </button>
          </div>
        </form>
        
        {/* Toggle between login and register */}
        <div className="text-center mt-6">
          <button
            onClick={toggleForm}
            className="text-blue-600 hover:text-blue-800 font-medium text-sm transition-colors duration-200"
          >
            {isRegister 
              ? 'Already have an account? Sign in'
              : "Don't have an account? Create one"}
          </button>
        </div>
        
        {/* Footer text */}
        <p className="mt-6 text-xs text-center text-gray-500">
          By using this service, you agree to our Privacy Policy and Terms of Service.
        </p>
      </motion.div>
    </div>
  );
}

export default Login;
