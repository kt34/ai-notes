import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { ReactNode } from 'react';
import { apiRequest, TokenExpiredError } from '../utils/api';
import { config } from '../config';
import { supabase } from '../utils/supabase'; // Import the shared client

interface User {
  id: string;
  email: string;
  full_name?: string;
  avatar_url?: string;
  subscription_status?: string;
  is_cancelled?: boolean;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, full_name?: string) => Promise<{ success: boolean; message: string }>;
  signInWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  clearError: () => void;
  updatePassword: (newPassword: string) => Promise<void>;
  refreshUser: () => Promise<void>;
  refreshNavBar: () => void;
  setNavBarRefreshFunction: (fn: () => void) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [navBarRefreshFunction, setNavBarRefreshFunction] = useState<(() => void) | null>(null);

  // Initialize auth state from localStorage
  useEffect(() => {
    const initializeAuth = async () => {
      const storedToken = localStorage.getItem('token');
      const storedRefreshToken = localStorage.getItem('refreshToken');
      
      if (storedToken && storedRefreshToken) {
        try {
          const userData = await fetchUser(storedToken);
          if (userData) {
            setUser(userData);
            setToken(storedToken);
          } else {
            // Try to refresh the token
            try {
              const data = await apiRequest('/auth/refresh', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ refresh_token: storedRefreshToken }),
                skipAuthRedirect: true
              });
              
              localStorage.setItem('token', data.access_token);
              localStorage.setItem('refreshToken', data.refresh_token);
              
              const refreshedUserData = await fetchUser(data.access_token);
              if (refreshedUserData) {
                setUser(refreshedUserData);
                setToken(data.access_token);
              }
            } catch (err) {
              handleLogout();
            }
          }
        } catch (err) {
          console.error('Auth initialization error:', err);
          handleLogout();
        }
      }
      setIsLoading(false);
    };

    initializeAuth();
  }, []);

  // Handle OAuth callbacks
  useEffect(() => {
    const handleOAuthCallback = async () => {
      if (!supabase) return;

      try {
        // If tokens are present from backend callback, set session manually
        const hash = window.location.hash.startsWith('#') ? window.location.hash.substring(1) : '';
        const params = new URLSearchParams(hash);
        const backendAccessToken = params.get('access_token');
        const backendRefreshToken = params.get('refresh_token');

        if (backendAccessToken && backendRefreshToken) {
          localStorage.setItem('token', backendAccessToken);
          localStorage.setItem('refreshToken', backendRefreshToken);
          setToken(backendAccessToken);

          const userData = await fetchUser(backendAccessToken);
          if (userData) setUser(userData);

          window.history.replaceState({}, document.title, window.location.pathname);
          return;
        }

        const { data, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('OAuth callback error:', error);
          setError(error.message);
          return;
        }

        if (data.session) {
          // User is authenticated via OAuth
          const { access_token, refresh_token } = data.session;
          
          localStorage.setItem('token', access_token);
          localStorage.setItem('refreshToken', refresh_token);
          setToken(access_token);
          
          // Fetch user data from your backend
          const userData = await fetchUser(access_token);
          if (userData) {
            setUser(userData);
          }
          
          // Clear URL fragments
          window.history.replaceState({}, document.title, window.location.pathname);
        }
      } catch (err) {
        console.error('OAuth callback processing error:', err);
        setError('Failed to process OAuth callback');
      }
    };

    // Check if we're on the callback page
    if (window.location.pathname === '/auth/callback') {
      handleOAuthCallback();
    }
  }, []);

  const fetchUser = async (authToken: string) => {
    try {
      const userData = await apiRequest('/auth/me', {
        token: authToken,
        skipAuthRedirect: true
      });
      
      return userData;
    } catch (err) {
      if (err instanceof TokenExpiredError) {
        return null;
      }
      console.error('Error fetching user:', err);
      return null;
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    setToken(null);
    setUser(null);
  };

  const login = async (email: string, password: string) => {
    try {
      setError(null);
      setIsLoading(true);
      
      const data = await apiRequest('/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
        skipAuthRedirect: true
      });

      localStorage.setItem('token', data.access_token);
      localStorage.setItem('refreshToken', data.refresh_token);
      setToken(data.access_token);
      
      const userData = await fetchUser(data.access_token);
      if (userData) {
        setUser(userData);
      } else {
        throw new Error('Failed to fetch user data after login.');
      }
    } catch (err: any) {
      // The apiRequest utility throws an error with the 'detail' message.
      const errorMessage = err.message || 'An unknown login error occurred.';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (email: string, password: string, full_name?: string) => {
    try {
      setError(null);
      setIsLoading(true);
      
      const data = await apiRequest('/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, full_name }),
        skipAuthRedirect: true
      });

      return {
        success: true,
        message: data.message || 'Please check your email to verify your account.'
      };
    } catch (err: any) {
      // The apiRequest utility throws an error with the 'detail' message.
      const errorMessage = err.message || 'An unknown registration error occurred.';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      setError(null);
      setIsLoading(true);
      
      if (token) {
        await apiRequest('/auth/logout', {
          method: 'POST',
          token,
          skipAuthRedirect: true
        });
      }
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      handleLogout();
      setIsLoading(false);
    }
  };

  const signInWithGoogle = async () => {
    try {
      setError(null);
      setIsLoading(true);
      
      // Start backend-proxied flow to show our own domain on Google's screen
      const apiBase = config.apiUrl.replace(/\/$/, '');
      const sameOrigin = apiBase.startsWith(window.location.origin);
      const startUrl = sameOrigin ? '/login/google' : `${apiBase}/login/google`;
      window.location.href = startUrl;

      // The OAuth flow will redirect the user to Google
      // The callback will be handled by the useEffect that checks for URL fragments
    } catch (err: any) {
      const errorMessage = err.message || 'An unknown Google sign-in error occurred.';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const clearError = useCallback(() => setError(null), []);

  const updatePassword = async (newPassword: string) => {
    try {
      setError(null);
      setIsLoading(true);

      if (!supabase) {
        throw new Error("Supabase client is not initialized. Check your environment variables.");
      }

      // The singleton supabase client has already processed the URL fragment
      // and established a temporary session. We just need to call updateUser.
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) {
        // The error from Supabase for using the same password has a 422 status code.
        // We check for this and create a more user-friendly error message.
        if ('status' in error && error.status === 422) {
          throw new Error('New password must be different from the old one.');
        }
        throw error;
      }
    } catch (err: any) {
      const errorMessage = err.message || 'An unexpected error occurred.';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const refreshUser = useCallback(async () => {
    const currentToken = localStorage.getItem('token');
    if (!currentToken) return;

    try {
      const userData = await apiRequest('/auth/me', { token: currentToken });
      setUser(userData);
    } catch (error) {
      console.error('Failed to refresh user data:', error);
    }
  }, []);

  const refreshNavBar = useCallback(() => {
    if (navBarRefreshFunction) {
      navBarRefreshFunction();
    }
  }, [navBarRefreshFunction]);

  const setNavBarRefreshFunctionWrapper = useCallback((fn: () => void) => {
    setNavBarRefreshFunction(() => fn);
  }, []);

  return (
    <AuthContext.Provider value={{
      user,
      token,
      isLoading,
      error,
      login,
      register,
      logout,
      clearError,
      updatePassword,
      refreshUser,
      refreshNavBar,
      setNavBarRefreshFunction: setNavBarRefreshFunctionWrapper,
      signInWithGoogle
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
} 