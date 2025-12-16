import React, { createContext, useContext, useState, useEffect } from 'react';
import { safeStorage } from './storage';

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  avatar?: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  updateUser: (userData: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for existing session on mount
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      // In a real app, this would check with your backend
      const token = safeStorage.getItem('voxlink_token');
      if (token) {
        // Mock user data - replace with actual API call
        const mockUser: User = {
          id: '1',
          name: 'John Doe',
          email: 'john@company.com',
          role: 'admin',
        };
        setUser(mockUser);
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      safeStorage.removeItem('voxlink_token');
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    try {
      setIsLoading(true);
      
      // Mock login - replace with actual API call
      if (email && password) {
        const mockToken = 'mock-jwt-token';
        const mockUser: User = {
          id: '1',
          name: 'John Doe',
          email: email,
          role: 'admin',
        };
        
        safeStorage.setItem('voxlink_token', mockToken);
        setUser(mockUser);
      } else {
        throw new Error('Invalid credentials');
      }
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    safeStorage.removeItem('voxlink_token');
    setUser(null);
    window.location.href = '/login';
  };

  const updateUser = (userData: Partial<User>) => {
    if (user) {
      setUser({ ...user, ...userData });
    }
  };

  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated: !!user,
    login,
    logout,
    updateUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};