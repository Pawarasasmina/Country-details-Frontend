import { Routes, Route, useNavigate, Navigate } from 'react-router-dom'
import Home from './pages/Home'
import CountryDetail from './pages/CountryDetail'
import Login from './pages/Login'
import WorldMap from './pages/WorldMap'
import Dashboard from './pages/Dashboard'
import { useEffect } from 'react'
import { useUser } from './contexts/UserContext'
import './app.css'

function App() {
  const navigate = useNavigate();
  const { user } = useUser();

  // This effect will handle redirects for protected routes
  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    // If a user tries to access protected routes without being logged in
    if (!savedUser) {
      const currentPath = window.location.pathname;
      // Redirect to dashboard if they are trying to access a protected route
      if (currentPath !== '/dashboard' && 
          currentPath !== '/login' && 
          currentPath !== '/') {
        navigate('/dashboard');
      }
    }
  }, [navigate]);

  return (
    <div className="min-h-screen bg-gray-100 text-gray-800">
      <Routes>
        {/* Set root route to show Dashboard for non-authenticated users and Home for authenticated users */}
        <Route path="/" element={user ? <Home /> : <Dashboard />} />
        <Route path="/home" element={user ? <Home /> : <Navigate to="/login" />} />
        <Route path="/country/:code" element={user ? <CountryDetail /> : <Navigate to="/login" />} />
        <Route path="/world-map" element={user ? <WorldMap /> : <Navigate to="/dashboard" />} />
        <Route path="/login" element={<Login />} />
        <Route path="/dashboard" element={<Dashboard />} />
        {/* Catch any other routes and redirect to dashboard */}
        <Route path="*" element={<Navigate to="/dashboard" />} />
      </Routes>
    </div>
  )
}

export default App
