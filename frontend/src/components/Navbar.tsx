import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Github, LogIn, LogOut, User } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';

export default function Navbar() {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial auth state using session first, then validate with getUser
    const getCurrentAuth = async () => {
      try {
        console.log('Navbar: Checking initial auth state...');
        
        // First check if we have a session
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          console.error('Navbar: Session error:', sessionError);
          setUser(null);
          setLoading(false);
          return;
        }

        if (!session) {
          console.log('Navbar: No session found, user not authenticated');
          setUser(null);
          setLoading(false);
          return;
        }

        // If we have a session, validate it with getUser
        try {
          const { data: { user }, error: userError } = await supabase.auth.getUser();
          
          if (userError) {
            console.error('Navbar: User validation failed:', userError);
            // Session exists but user validation failed - likely expired
            console.log('Navbar: Session appears expired, clearing auth state');
            await supabase.auth.signOut();
            setUser(null);
          } else if (user) {
            console.log('Navbar: User authenticated and validated:', user.email);
            setUser(user);
          } else {
            console.log('Navbar: No user found despite session');
            setUser(null);
          }
        } catch (authError: any) {
          console.error('Navbar: Auth validation error:', authError);
          // If getUser fails with "Auth session missing", clear everything
          if (authError.message?.includes('Auth session missing')) {
            console.log('Navbar: Auth session missing, clearing state');
            await supabase.auth.signOut();
          }
          setUser(null);
        }
      } catch (error) {
        console.error('Navbar: Unexpected error during auth check:', error);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    getCurrentAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Navbar: Auth state changed:', event, session?.user ? `User: ${session.user.email}` : 'No user');
      
      if (event === 'SIGNED_OUT' || !session) {
        console.log('Navbar: User signed out or session ended');
        setUser(null);
      } else if (event === 'SIGNED_IN' && session?.user) {
        console.log('Navbar: User signed in:', session.user.email);
        setUser(session.user);
      } else if (event === 'TOKEN_REFRESHED' && session?.user) {
        console.log('Navbar: Token refreshed for user:', session.user.email);
        setUser(session.user);
      } else if (session?.user) {
        // For other events, validate the user to ensure session is still valid
        try {
          const { data: { user }, error } = await supabase.auth.getUser();
          if (error) {
            console.error('Navbar: User validation failed during auth change:', error);
            // Handle session expiration gracefully
            if (error.message?.includes('Auth session missing')) {
              console.log('Navbar: Session expired during auth change, signing out');
              await supabase.auth.signOut();
            }
            setUser(null);
          } else {
            console.log('Navbar: User validated during auth change:', user?.email);
            setUser(user);
          }
        } catch (error: any) {
          console.error('Navbar: Error validating user during auth change:', error);
          if (error.message?.includes('Auth session missing')) {
            console.log('Navbar: Session missing during validation, signing out');
            await supabase.auth.signOut();
          }
          setUser(null);
        }
      }
    });

    return () => {
      console.log('Navbar: Cleaning up auth subscription');
      subscription.unsubscribe();
    };
  }, []);

  const handleSignOut = async () => {
    try {
      console.log('Navbar: Starting sign out process...');
      console.log('Navbar: Current user before sign out:', user?.email || 'No user');
      
      // Clear user state immediately for responsive UI
      setUser(null);
      
      // Sign out from Supabase
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        console.error('Navbar: Sign out failed:', error.message);
        
        // Try to restore user state if sign out failed
        try {
          const { data: { session } } = await supabase.auth.getSession();
          if (session?.user) {
            setUser(session.user);
            console.log('Navbar: Restored user state after failed sign out');
          }
        } catch (restoreError) {
          console.error('Navbar: Could not restore user state:', restoreError);
        }
        return;
      }
      
      console.log('Navbar: Supabase sign out successful');
      
      // Use window.location.href for full page reload and complete session clearance
      console.log('Navbar: Performing full page reload to clear session...');
      window.location.href = '/';
      
    } catch (error: any) {
      console.error('Navbar: Unexpected error during sign out:', error);
      
      // Try to restore user state on unexpected error
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          setUser(session.user);
          console.log('Navbar: Restored user state after unexpected error');
        }
      } catch (restoreError) {
        console.error('Navbar: Could not restore user state after error:', restoreError);
      }
    }
  };

  const handleDemoClick = () => {
    if (user) {
      console.log('Navbar: Navigating to demo (user authenticated):', user.email);
      navigate('/demo');
    } else {
      console.log('Navbar: Redirecting to auth (user not authenticated)');
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