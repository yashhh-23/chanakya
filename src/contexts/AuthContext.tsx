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
    return true;
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    localStorage.removeItem('transitops-user');
    sessionStorage.removeItem('transitops-user');
  }, []);

  const setRole = useCallback((role: UserRole) => {
    setUser((prev) => {
      if (!prev) return null;
      const updated = {...prev, role};
      
      const userStr = JSON.stringify(updated);
      if (localStorage.getItem('transitops-user')) {
        localStorage.setItem('transitops-user', userStr);
      } else {
        sessionStorage.setItem('transitops-user', userStr);
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
