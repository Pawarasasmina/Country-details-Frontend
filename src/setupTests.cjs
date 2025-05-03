require('@testing-library/jest-dom');

global.TextEncoder = require('util').TextEncoder;
global.TextDecoder = require('util').TextDecoder;

// Setup fake timers for all tests
jest.useFakeTimers();

// Mock window.scrollTo to fix framer-motion error
window.scrollTo = jest.fn();

// Suppress React act() warnings
const originalError = console.error;
console.error = (...args) => {
  if (/Warning.*not wrapped in act/.test(args[0]) || 
      /The current testing environment is not configured to support act/.test(args[0])) {
    return;
  }
  originalError.call(console, ...args);
};

// Mock for React 18+ concurrent features
global.IS_REACT_ACT_ENVIRONMENT = true;
