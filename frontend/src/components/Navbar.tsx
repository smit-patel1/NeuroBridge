import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Github, LogIn, LogOut, User } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';

export default function Navbar() {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    const getSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        setUser(session?.user || null);
        console.log('✓ Navbar: Initial session loaded', session?.user ? 'User found' : 'No user');
      } catch (error) {
        console.error('❌ Navbar: Error getting initial session:', error);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    getSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('✓ Navbar: Auth state changed:', event, session?.user ? 'User present' : 'No user');
      setUser(session?.user || null);
      
      // Handle sign out event specifically
      if (event === 'SIGNED_OUT') {
        console.log('✓ Navbar: User signed out, clearing state');
        setUser(null);
      }
    });

    return () => {
      console.log('✓ Navbar: Cleaning up auth subscription');
      subscription.unsubscribe();
    };
  }, []);

  const handleSignOut = async () => {
    try {
      console.log('🔄 Navbar: Starting sign out process...');
      
      // Clear user state immediately for responsive UI
      setUser(null);
      
      // Sign out from Supabase
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        console.error('❌ Navbar: Sign out error:', error);
        // Restore user state if sign out failed
        const { data: { session } } = await supabase.auth.getSession();
        setUser(session?.user || null);
        return;
      }
      
      console.log('✓ Navbar: User successfully signed out');
      
      // Navigate to home page
      navigate('/');
      
    } catch (error) {
      console.error('❌ Navbar: Unexpected error during sign out:', error);
      // Restore user state on unexpected error
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user || null);
    }
  };

  const handleDemoClick = () => {
    if (user) {
      console.log('✓ Navbar: Navigating to demo (user authenticated)');
      navigate('/demo');
    } else {
      console.log('✓ Navbar: Redirecting to auth (user not authenticated)');
      navigate('/auth');
    }
  };

  return (
    <nav className="fixed w-full bg-gray-900/90 backdrop-blur-sm z-50">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <Link to="/" className="text-xl font-bold text-white">
            MindRender
          </Link>
          
          <div className="flex items-center space-x-6">
            <Link to="/" className="text-gray-300 hover:text-white transition-colors">
              Home
            </Link>
            <button 
              onClick={handleDemoClick}
              className="text-gray-300 hover:text-white transition-colors"
            >
              {user ? 'Try Demo' : 'Try Demo'}
            </button>
            <Link to="/learn" className="text-gray-300 hover:text-white transition-colors">
              Learn More
            </Link>
            <a
              href="https://github.com/smit-patel1/MindRender"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-300 hover:text-white transition-colors"
            >
              <Github className="w-5 h-5" />
            </a>
            
            {loading ? (
              <div className="w-20 h-10 bg-gray-700 rounded-lg animate-pulse"></div>
            ) : user ? (
              <div className="flex items-center space-x-3">
                <div className="flex items-center space-x-2 text-gray-300">
                  <User className="w-4 h-4" />
                  <span className="text-sm">{user.email}</span>
                </div>
                <button 
                  onClick={handleSignOut}
                  className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-400 transition-colors flex items-center space-x-2"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Sign Out</span>
                </button>
              </div>
            ) : (
              <Link 
                to="/auth" 
                className="bg-yellow-500 text-black px-4 py-2 rounded-lg hover:bg-yellow-400 transition-colors flex items-center space-x-2"
              >
                <LogIn className="w-4 h-4" />
                <span>Login</span>
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}