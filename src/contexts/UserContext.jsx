import { createContext, useState, useContext } from 'react';

const UserContext = createContext();

export const UserProvider = ({ children }) => {
  const [user, setUser] = useState(localStorage.getItem('user') ? { username: localStorage.getItem('user') } : null);

  const login = (username) => {
    localStorage.setItem('user', username);
    setUser({ username }); // Ensure user is an object with a username property
  };

  const logout = () => {
    localStorage.removeItem('user');
    setUser(null);
  };

  return (
    <UserContext.Provider value={{ user, login, logout }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => useContext(UserContext);
