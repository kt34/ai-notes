import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { apiRequest, TokenExpiredError } from '../utils/api';
import { supabase } from '../utils/supabase'; // Import the shared client

interface User {
  id: string;
  email: string;
  full_name?: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, full_name?: string) => Promise<{ success: boolean; message: string }>;
  logout: () => Promise<void>;
  clearError: () => void;
  updatePassword: (newPassword: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  const fetchUser = async (authToken: string) => {
    try {
      const userData = await apiRequest('/auth/me', {
        token: authToken,
        skipAuthRedirect: true
      });
      
      return {
        id: userData.id,
        email: userData.email,
        full_name: userData.user_metadata?.full_name || null
      };
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
      // The apiRequest utility already extracts the message from the error response
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
      // The apiRequest utility already extracts the message from the error response
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

  const clearError = () => setError(null);

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
      updatePassword
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