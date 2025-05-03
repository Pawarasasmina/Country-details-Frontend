import React from 'react';
import { createContext, useState, useContext, useEffect } from 'react';

const UserContext = createContext();
const SESSION_TIMEOUT = 30 * 60 * 1000; // 30 minutes of inactivity
const ACTIVITY_EVENTS = ['mousemove', 'keypress', 'click', 'scroll', 'touchstart'];

export const UserProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem('user');
    const lastActivityTimestamp = localStorage.getItem('lastActivityTimestamp');
    if (savedUser && lastActivityTimestamp && Date.now() - parseInt(lastActivityTimestamp) < SESSION_TIMEOUT) {
      return { username: savedUser };
    }
    localStorage.removeItem('user');
    localStorage.removeItem('lastActivityTimestamp');
    return null;
  });

  const updateActivityTimestamp = () => {
    if (user) {
      localStorage.setItem('lastActivityTimestamp', Date.now().toString());
    }
  };

  const login = (username) => {
    localStorage.setItem('user', username);
    localStorage.setItem('lastActivityTimestamp', Date.now().toString());
    setUser({ username });
  };

  const logout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('lastActivityTimestamp');
    setUser(null);
  };

  useEffect(() => {
    if (!user) return;

    // Throttled activity handler
    let activityTimeout;
    const handleUserActivity = () => {
      if (activityTimeout) {
        clearTimeout(activityTimeout);
      }
      activityTimeout = setTimeout(() => {
        updateActivityTimestamp();
      }, 1000); // Throttle to once per second
    };

    // Add event listeners for user activity
    ACTIVITY_EVENTS.forEach(event => {
      window.addEventListener(event, handleUserActivity);
    });

    // Initial activity timestamp
    updateActivityTimestamp();

    // Check for inactivity
    const interval = setInterval(() => {
      const lastActivityTimestamp = localStorage.getItem('lastActivityTimestamp');
      if (lastActivityTimestamp && Date.now() - parseInt(lastActivityTimestamp) >= SESSION_TIMEOUT) {
        logout();
      }
    }, 10000); // Check every 10 seconds

    return () => {
      // Clean up
      if (activityTimeout) {
        clearTimeout(activityTimeout);
      }
      ACTIVITY_EVENTS.forEach(event => {
        window.removeEventListener(event, handleUserActivity);
      });
      clearInterval(interval);
    };
  }, [user]);

  return (
    <UserContext.Provider value={{ user, login, logout }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => useContext(UserContext);
