"use client";

import {useState, useEffect, memo} from 'react';
import {ThemeProvider} from './contexts/ThemeContext';
import {ToastProvider} from './contexts/ToastContext';
import {AuthProvider, useAuth} from './contexts/AuthContext';
import {DataProvider} from './contexts/DataContext';
import {AppShell, ActiveTab} from './components/layout/AppShell';
import {ToastContainer} from './components/ui/Feedback';

import {DashboardPage} from './features/dashboard/DashboardPage';
import {VehicleRegistryPage} from './features/fleet/VehicleRegistryPage';
import {DriverDirectoryPage} from './features/drivers/DriverDirectoryPage';
import {AuthPage} from './features/auth/AuthPage';

const AppContent = memo(function AppContent() {
  const {isAuthenticated} = useAuth();
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  if (!isAuthenticated) {
    return (
      <>
        <AuthPage />
        <ToastContainer />
      </>
    );
  }

  return (
    <AppShell activeTab={activeTab} setActiveTab={setActiveTab}>
      {activeTab === 'dashboard' && <DashboardPage />}
      {activeTab === 'vehicles' && <VehicleRegistryPage />}
      {activeTab === 'drivers' && <DriverDirectoryPage />}
      <ToastContainer />
    </AppShell>
  );
});

export default function App() {
  return (
    <ThemeProvider>
      <ToastProvider>
        <AuthProvider>
          <DataProvider>
            <AppContent />
          </DataProvider>
        </AuthProvider>
      </ToastProvider>
    </ThemeProvider>
  );
}
