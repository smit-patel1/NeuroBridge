import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Github, LogIn, LogOut, User } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';

export default function Navbar() {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial user using getUser() instead of getSession() to avoid stale cache
    const getCurrentUser = async () => {
      try {
        console.log('🔄 Navbar: Fetching current user...');
        const { data: { user }, error } = await supabase.auth.getUser();
        
        if (error) {
          console.error('❌ Navbar: Error getting current user:', error);
          setUser(null);
        } else {
          setUser(user);
          console.log('✓ Navbar: Current user loaded:', user ? `${user.email}` : 'No user');
        }
      } catch (error) {
        console.error('❌ Navbar: Unexpected error getting user:', error);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    getCurrentUser();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('✓ Navbar: Auth state changed:', event, session?.user ? `User: ${session.user.email}` : 'No user');
      
      // Always update user state based on session
      setUser(session?.user || null);
      
      // Handle sign out event specifically
      if (event === 'SIGNED_OUT') {
        console.log('✓ Navbar: User signed out event received, clearing state');
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
      console.log('🔄 Navbar: Current user before sign out:', user?.email || 'No user');
      
      // Clear user state immediately for responsive UI
      setUser(null);
      
      // Sign out from Supabase
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        console.error('❌ Navbar: Sign out failed:', error.message);
        
        // Try to restore user state if sign out failed
        try {
          const { data: { user: currentUser } } = await supabase.auth.getUser();
          setUser(currentUser);
          console.log('⚠️ Navbar: Restored user state after failed sign out');
        } catch (restoreError) {
          console.error('❌ Navbar: Could not restore user state:', restoreError);
        }
        return;
      }
      
      console.log('✓ Navbar: Supabase sign out successful');
      
      // Use window.location.href for full page reload and complete session clearance
      console.log('🔄 Navbar: Performing full page reload to clear session...');
      window.location.href = '/';
      
    } catch (error) {
      console.error('❌ Navbar: Unexpected error during sign out:', error);
      
      // Try to restore user state on unexpected error
      try {
        const { data: { user: currentUser } } = await supabase.auth.getUser();
        setUser(currentUser);
        console.log('⚠️ Navbar: Restored user state after unexpected error');
      } catch (restoreError) {
        console.error('❌ Navbar: Could not restore user state after error:', restoreError);
      }
    }
  };

  const handleDemoClick = () => {
    if (user) {
      console.log('✓ Navbar: Navigating to demo (user authenticated):', user.email);
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