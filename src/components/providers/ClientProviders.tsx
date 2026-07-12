"use client";

import {ReactNode} from 'react';
import {ThemeProvider} from '@/contexts/ThemeContext';
import {ToastProvider} from '@/contexts/ToastContext';
import {AuthProvider} from '@/contexts/AuthContext';
import {DataProvider} from '@/contexts/DataContext';

export function ClientProviders({children}: {children: ReactNode}) {
  return (
    <ThemeProvider>
      <ToastProvider>
        <AuthProvider>
          <DataProvider>
            {children}
          </DataProvider>
        </AuthProvider>
      </ToastProvider>
    </ThemeProvider>
  );
}
