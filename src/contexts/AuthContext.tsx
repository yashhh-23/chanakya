/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {createContext, useContext, useState, useEffect, ReactNode, useCallback, useMemo} from 'react';
import {User, UserRole} from '../types';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, role: UserRole, rememberMe: boolean) => boolean;
  logout: () => void;
  setRole: (role: UserRole) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({children}: {children: ReactNode}) {
  const [user, setUser] = useState<User | null>(() => {
    if (typeof window !== 'undefined') {
      const savedUser = localStorage.getItem('transitops-user') || sessionStorage.getItem('transitops-user');
      if (savedUser) {
        try {
          return JSON.parse(savedUser);
        } catch {
          return null;
        }
      }
    }
    return null;
  });

  const login = useCallback((email: string, role: UserRole, rememberMe: boolean): boolean => {
    // Generate a default name from email
    const namePart = email.split('@')[0];
    const name = namePart.charAt(0).toUpperCase() + namePart.slice(1).replace(/[^a-zA-Z]/g, ' ');
    
    const newUser: User = {
      email,
      role,
      name,
    };

    setUser(newUser);

    const userStr = JSON.stringify(newUser);
    if (rememberMe) {
      localStorage.setItem('transitops-user', userStr);
    } else {
      sessionStorage.setItem('transitops-user', userStr);
    }

    // Set cookie for backend authentication
    if (typeof document !== 'undefined') {
      const maxAge = rememberMe ? 30 * 24 * 60 * 60 : 24 * 60 * 60;
      document.cookie = `transitops-user=${encodeURIComponent(userStr)}; path=/; max-age=${maxAge}; SameSite=Strict`;
    }

    return true;
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    localStorage.removeItem('transitops-user');
    sessionStorage.removeItem('transitops-user');

    // Clear cookie
    if (typeof document !== 'undefined') {
      document.cookie = 'transitops-user=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Strict';
    }
  }, []);

  const setRole = useCallback((role: UserRole) => {
    setUser((prev) => {
      if (!prev) return null;
      const updated = {...prev, role};
      
      const userStr = JSON.stringify(updated);
      const isRemembered = !!localStorage.getItem('transitops-user');
      if (isRemembered) {
        localStorage.setItem('transitops-user', userStr);
      } else {
        sessionStorage.setItem('transitops-user', userStr);
      }

      // Update cookie
      if (typeof document !== 'undefined') {
        const maxAge = isRemembered ? 30 * 24 * 60 * 60 : 24 * 60 * 60;
        document.cookie = `transitops-user=${encodeURIComponent(userStr)}; path=/; max-age=${maxAge}; SameSite=Strict`;
      }

      return updated;
    });
  }, []);

  const value = useMemo(() => ({
    user,
    isAuthenticated: !!user,
    login,
    logout,
    setRole,
  }), [user, login, logout, setRole]);

  return (
    <AuthContext.Provider value={value}>
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
