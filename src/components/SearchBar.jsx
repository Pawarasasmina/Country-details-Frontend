import React, { useState, useEffect, useRef } from 'react';

function SearchBar({ onSearch, value = '' }) {
  const [searchTerm, setSearchTerm] = useState(value);
  const [isTyping, setIsTyping] = useState(false);
  const debounceTimerRef = useRef(null);

  // Update internal state when external value changes
  useEffect(() => {
    setSearchTerm(value);
  }, [value]);

  // Handle search with debounce for API calls
  useEffect(() => {
    if (isTyping) {
      // Clear any existing timer
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      
      // Set a new timer with longer delay (700ms) for API calls
      debounceTimerRef.current = setTimeout(() => {
        onSearch(searchTerm);
        setIsTyping(false);
      }, 700); // Increased delay for API calls
    }
    
    // Cleanup on component unmount
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [searchTerm, isTyping, onSearch]);

  const handleInputChange = (e) => {
    setSearchTerm(e.target.value);
    setIsTyping(true);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      onSearch(searchTerm);
      setIsTyping(false);
    }
  };

  const clearSearch = () => {
    setSearchTerm('');
    onSearch('');
  };

  return (
    <div className="relative">
      <input
        type="text"
        placeholder="Search by country name..."
        className="w-full p-2 border border-gray-300 rounded-lg shadow-sm"
        value={searchTerm}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
      />
      {searchTerm && (
        <button 
          onClick={clearSearch}
          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
          aria-label="Clear search"
        >
          ×
        </button>
      )}
      {isTyping && (
        <span className="absolute right-10 top-1/2 transform -translate-y-1/2 text-gray-400 text-xs">
          Searching by name...
        </span>
      )}
    </div>
  );
}

export default SearchBar;
