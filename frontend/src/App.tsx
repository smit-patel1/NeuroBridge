import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthProvider';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Demo from './pages/Demo';
import LearnMore from './pages/LearnMore';
import Auth from './pages/Auth';

function AppContent() {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Auto-redirect logic can be handled in individual components now
    // since AuthProvider manages the global auth state
  }, [navigate]);

  // Hide global navbar on demo page
  const showNavbar = location.pathname !== '/demo';

  return (
    <div className="min-h-screen">
      {showNavbar && <Navbar />}
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/demo" element={<Demo />} />
        <Route path="/learn" element={<LearnMore />} />
        <Route path="/auth" element={<Auth />} />
      </Routes>
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <AppContent />
      </Router>
    </AuthProvider>
  );
}

export default App;