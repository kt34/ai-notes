import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { config } from '../config';

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
            const response = await fetch(`${config.apiUrl}/auth/refresh`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ refresh_token: storedRefreshToken }),
            });

            if (response.ok) {
              const data = await response.json();
              localStorage.setItem('token', data.access_token);
              localStorage.setItem('refreshToken', data.refresh_token);
              const refreshedUserData = await fetchUser(data.access_token);
              if (refreshedUserData) {
                setUser(refreshedUserData);
                setToken(data.access_token);
              }
    } else {
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
      const response = await fetch(`${config.apiUrl}/auth/me`, {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });
      
      if (!response.ok) return null;
      
      const userData = await response.json();
      return {
        id: userData.id,
        email: userData.email,
        full_name: userData.user_metadata?.full_name || null
      };
    } catch (err) {
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
      
      const response = await fetch(`${config.apiUrl}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Login failed');
      }

      const data = await response.json();
      localStorage.setItem('token', data.access_token);
      localStorage.setItem('refreshToken', data.refresh_token);
      setToken(data.access_token);
      
      const userData = await fetchUser(data.access_token);
      if (userData) {
        setUser(userData);
      } else {
        throw new Error('Failed to fetch user data');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (email: string, password: string, full_name?: string) => {
    try {
      setError(null);
      setIsLoading(true);
      
      const response = await fetch(`${config.apiUrl}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, full_name })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Registration failed');
      }

      const data = await response.json();
      console.log('Registration successful:', data);
      return {
        success: true,
        message: 'Please check your email to verify your account before logging in.'
      };
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed');
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
        await fetch(`${config.apiUrl}/auth/logout`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
          }
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

  return (
    <AuthContext.Provider value={{
      user,
      token,
      isLoading,
      error,
      login,
      register,
      logout,
      clearError
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