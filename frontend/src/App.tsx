import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { supabase } from './lib/supabaseClient';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Demo from './pages/Demo';
import LearnMore from './pages/LearnMore';
import Auth from './pages/Auth';

function AppContent() {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const checkAuthAndRedirect = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();

        // If user is authenticated and on root path, redirect to demo
        if (user && window.location.pathname === '/') {
          navigate('/demo');
        }
      } catch (error) {
        console.error('Error checking authentication:', error);
      }
    };

    checkAuthAndRedirect();
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
    <Router>
      <AppContent />
    </Router>
  );
}

export default App;