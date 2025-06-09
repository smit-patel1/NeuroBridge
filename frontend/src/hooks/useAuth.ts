// hooks/useAuth.ts
import { useState, useEffect, useCallback } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabaseClient';

interface AuthState {
  user: User | null;
  session: Session | null;
  loading: boolean;
  error: string | null;
}

export function useAuth() {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    session: null,
    loading: true,
    error: null
  });

  // Force session refresh
  const refreshSession = useCallback(async () => {
    try {
      const { data, error } = await supabase.auth.refreshSession();
      if (error) {
        console.error('Session refresh failed:', error.message);
        setAuthState(prev => ({ ...prev, error: error.message }));
        return false;
      }
      return true;
    } catch (error) {
      console.error('Session refresh error:', error);
      return false;
    }
  }, []);

  // Validate current session
  const validateSession = useCallback(async () => {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error('Session validation error:', error.message);
        setAuthState(prev => ({ ...prev, error: error.message }));
        return false;
      }

      if (!session) {
        setAuthState(prev => ({ ...prev, user: null, session: null }));
        return false;
      }

      const expiresAt = session.expires_at;
      
      if (expiresAt !== undefined) {
        const now = Math.floor(Date.now() / 1000);
        const timeUntilExpiry = expiresAt - now;
      
        if (timeUntilExpiry < 300) {
          console.log('Token expiring soon, refreshing...');
          return await refreshSession();
        }
      }


      return true;
    } catch (error) {
      console.error('Session validation failed:', error);
      return false;
    }
  }, [refreshSession]);

  // Safe session operation wrapper
  const withValidSession = useCallback(async (operation: () => Promise<any>) => {
    const isValid = await validateSession();
    if (!isValid) {
      throw new Error('Session invalid or expired');
    }
    return await operation();
  }, [validateSession]);

  useEffect(() => {
    let refreshInterval: NodeJS.Timeout;

    const initializeAuth = async () => {
      try {
        setAuthState(prev => ({ ...prev, loading: true, error: null }));

        // Get initial session
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Initial session error:', error.message);
          setAuthState(prev => ({ ...prev, error: error.message, loading: false }));
          return;
        }

        setAuthState({
          user: session?.user || null,
          session: session,
          loading: false,
          error: null
        });

        // Set up periodic session validation (every 2 minutes)
        refreshInterval = setInterval(async () => {
          await validateSession();
        }, 120000); // 2 minutes

      } catch (error) {
        console.error('Auth initialization failed:', error);
        setAuthState(prev => ({ 
          ...prev, 
          error: 'Authentication initialization failed', 
          loading: false 
        }));
      }
    };

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event);
        
        setAuthState({
          user: session?.user || null,
          session: session,
          loading: false,
          error: null
        });

        // Handle session refresh events
        if (event === 'TOKEN_REFRESHED') {
          console.log('Token refreshed successfully');
        } else if (event === 'SIGNED_OUT') {
          console.log('User signed out');
          if (refreshInterval) clearInterval(refreshInterval);
        }
      }
    );

    initializeAuth();

    // Cleanup
    return () => {
      if (refreshInterval) clearInterval(refreshInterval);
      subscription.unsubscribe();
    };
  }, [validateSession]);

  return {
    ...authState,
    refreshSession,
    validateSession,
    withValidSession,
    signOut: () => supabase.auth.signOut()
  };
}
