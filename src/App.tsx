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
import {TripDispatcherPage} from './features/trips/TripDispatcherPage';
import FuelExpensesPage from './features/fuel-expenses/FuelExpensesPage';
import AnalyticsPage from './features/analytics/AnalyticsPage';
import {AuthPage} from './features/auth/AuthPage';

const AppContent = memo(function AppContent({ initialTab = 'dashboard' }: { initialTab?: ActiveTab }) {
  const {isAuthenticated} = useAuth();
  const [activeTab, setActiveTab] = useState<ActiveTab>(initialTab);
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
      {activeTab === 'trips' && <TripDispatcherPage />}
      {activeTab === 'expenses' && <FuelExpensesPage />}
      {activeTab === 'analytics' && <AnalyticsPage />}
      <ToastContainer />
    </AppShell>
  );
});

export default AppContent;
