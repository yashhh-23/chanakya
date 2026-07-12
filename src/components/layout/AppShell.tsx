/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {useState, ReactNode, memo, useCallback, ChangeEvent, useEffect, useMemo} from 'react';
import {motion, AnimatePresence} from 'motion/react';
import {
  Menu,
  X,
  LayoutDashboard,
  Truck,
  Users,
  Search,
  Bell,
  Sun,
  Moon,
  LogOut,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  MapPin,
  Wrench,
  Coins,
  BarChart3
} from 'lucide-react';
import {useAuth} from '../../contexts/AuthContext';
import {useTheme} from '../../contexts/ThemeContext';
import {RoleBadge} from '../ui/StatusAndMetrics';
import {UserRole} from '../../types';

export type ActiveTab = 'dashboard' | 'vehicles' | 'drivers' | 'trips' | 'maintenance' | 'fuel-expenses' | 'analytics';

interface AppShellProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  children: ReactNode;
}

export const AppShell = memo(function AppShell({
  activeTab,
  setActiveTab,
  children,
}: AppShellProps) {
  const {user, logout, setRole} = useAuth();
  const {theme, toggleTheme} = useTheme();
  
  // Layout States
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  // Mock Notifications
  const [notifications] = useState([
    {id: '1', text: 'Vehicle MH-04-EX-8891 registered successfully.', time: '5m ago'},
    {id: '2', text: 'Driver Rohan Sharma license expires in 30 days.', time: '2h ago'},
    {id: '3', text: 'Maintenance scheduled for Tata Ultra T.7 tomorrow.', time: '1d ago'},
  ]);

  const navItems = useMemo(() => [
    {id: 'dashboard' as ActiveTab, label: 'Dashboard', icon: LayoutDashboard, roles: ['FLEET_MANAGER', 'DRIVER', 'SAFETY_OFFICER', 'FINANCIAL_ANALYST']},
    {id: 'vehicles' as ActiveTab, label: 'Vehicle Registry', icon: Truck, roles: ['FLEET_MANAGER']},
    {id: 'maintenance' as ActiveTab, label: 'Maintenance Log', icon: Wrench, roles: ['FLEET_MANAGER']},
    {id: 'trips' as ActiveTab, label: 'Trip Dispatcher', icon: MapPin, roles: ['DRIVER']},
    {id: 'drivers' as ActiveTab, label: 'Driver Directory', icon: Users, roles: ['SAFETY_OFFICER']},
    {id: 'fuel-expenses' as ActiveTab, label: 'Fuel & Expenses', icon: Coins, roles: ['FINANCIAL_ANALYST']},
    {id: 'analytics' as ActiveTab, label: 'Reports & Analytics', icon: BarChart3, roles: ['FINANCIAL_ANALYST']},
  ], []);

  const filteredNavItems = useMemo(() => {
    if (!user) return [];
    return navItems.filter((item: any) => item.roles.includes(user.role));
  }, [user, navItems]);

  useEffect(() => {
    if (user) {
      const hasAccess = navItems.find((item: any) => item.id === activeTab)?.roles.includes(user.role);
      if (!hasAccess) {
        setActiveTab('dashboard');
      }
    }
  }, [user?.role, activeTab, setActiveTab, navItems]);

  const handleRoleChange = useCallback((e: ChangeEvent<HTMLSelectElement>) => {
    setRole(e.target.value as UserRole);
  }, [setRole]);

  return (
    <div className="min-h-screen flex bg-bg-base text-text-base transition-colors duration-200">
      
      {/* ==========================================
          DESKTOP SIDEBAR
          ========================================== */}
      <aside
        className={`hidden md:flex flex-col border-r border-border-base bg-bg-sidebar text-text-sidebar transition-all duration-300 relative select-none ${
          sidebarCollapsed ? 'w-16' : 'w-64'
        }`}
        role="complementary"
        aria-label="Desktop Navigation"
      >
        {/* Sidebar Header */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-border-base/15">
          <div className="flex items-center gap-2.5 overflow-hidden">
            <div className="h-8 w-8 bg-white rounded flex items-center justify-center flex-shrink-0">
              <svg className="w-5 h-5 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            {!sidebarCollapsed && (
              <span className="font-bold text-lg tracking-tight font-display bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                TransitOps
              </span>
            )}
          </div>
          
          <button
            type="button"
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="p-1 rounded-md text-text-sidebar/60 hover:bg-white/10 hover:text-white transition-colors"
            aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {sidebarCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          </button>
        </div>

        {/* User Role Badge in Sidebar */}
        {user && !sidebarCollapsed && (
          <div className="px-4 py-3.5 border-b border-border-base/15 bg-white/2 overflow-hidden">
            <div className="text-[10px] font-semibold text-text-sidebar/50 uppercase tracking-wider mb-1">Active Role</div>
            <RoleBadge role={user.role} className="bg-white/10 text-white border-none w-full justify-center" />
          </div>
        )}

        {/* Sidebar Nav Items */}
        <nav className="flex-1 py-4 px-2 space-y-1" role="navigation" aria-label="Main Navigation">
          {filteredNavItems.map((item: any) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center rounded-lg px-3 py-2.5 text-xs font-semibold transition-all duration-150 border ${
                  isActive
                    ? 'bg-muted-base text-white border-border-base shadow-sm'
                    : 'text-text-sidebar/70 border-transparent hover:bg-white/5 hover:text-white'
                } ${sidebarCollapsed ? 'justify-center' : 'gap-3'}`}
                title={item.label}
                aria-current={isActive ? 'page' : undefined}
              >
                <Icon size={18} className="flex-shrink-0" />
                {!sidebarCollapsed && <span>{item.label}</span>}
              </button>
            );
          })}
        </nav>

        {/* Sidebar Footer */}
        <div className="p-3 border-t border-border-base/15">
          <button
            onClick={logout}
            className={`w-full flex items-center rounded-lg px-3 py-2 text-xs font-semibold text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-all ${
              sidebarCollapsed ? 'justify-center' : 'gap-3'
            }`}
            title="Log Out"
          >
            <LogOut size={16} />
            {!sidebarCollapsed && <span>Log Out</span>}
          </button>
        </div>
      </aside>

      {/* ==========================================
          MOBILE DRAWER SIDEBAR
          ========================================== */}
      <AnimatePresence>
        {mobileSidebarOpen && (
          <div className="fixed inset-0 z-40 flex md:hidden">
            {/* Backdrop */}
            <motion.div
              initial={{opacity: 0}}
              animate={{opacity: 1}}
              exit={{opacity: 0}}
              onClick={() => setMobileSidebarOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-xs"
              aria-hidden="true"
            />

            {/* Content Drawer */}
            <motion.aside
              initial={{x: '-100%'}}
              animate={{x: 0}}
              exit={{x: '-100%'}}
              transition={{type: 'tween', duration: 0.25}}
              className="relative flex flex-col w-64 bg-bg-sidebar text-text-sidebar h-full z-10"
              role="dialog"
              aria-modal="true"
              aria-label="Mobile Navigation Drawer"
            >
              {/* Close Button */}
              <div className="h-16 flex items-center justify-between px-4 border-b border-border-base/15">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 bg-white rounded flex items-center justify-center flex-shrink-0">
                    <svg className="w-5 h-5 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                  <span className="font-bold text-lg tracking-tight font-display text-white">
                    TransitOps
                  </span>
                </div>
                <button
                  onClick={() => setMobileSidebarOpen(false)}
                  className="p-1.5 rounded-lg text-text-sidebar/70 hover:bg-white/10 hover:text-white"
                  aria-label="Close menu"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Mobile Role display */}
              {user && (
                <div className="px-4 py-3.5 border-b border-border-base/15 bg-white/2">
                  <div className="text-[10px] font-semibold text-text-sidebar/50 uppercase tracking-wider mb-1">Active Role</div>
                  <RoleBadge role={user.role} className="bg-white/10 text-white border-none w-full justify-center" />
                </div>
              )}

              {/* Navigation items */}
              <nav className="flex-grow py-4 px-2 space-y-1">
                {filteredNavItems.map((item: any) => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        setActiveTab(item.id);
                        setMobileSidebarOpen(false);
                      }}
                      className={`w-full flex items-center rounded-lg px-3 py-2.5 text-xs font-semibold gap-3 transition-all border ${
                        isActive
                          ? 'bg-muted-base text-white border-border-base'
                          : 'text-text-sidebar/70 border-transparent hover:bg-white/5 hover:text-white'
                      }`}
                      aria-current={isActive ? 'page' : undefined}
                    >
                      <Icon size={18} />
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </nav>

              {/* Mobile Logout */}
              <div className="p-3 border-t border-border-base/15">
                <button
                  onClick={logout}
                  className="w-full flex items-center rounded-lg px-3 py-2 text-xs font-semibold text-red-400 hover:bg-red-500/10 hover:text-red-300 gap-3 transition-all"
                >
                  <LogOut size={16} />
                  <span>Log Out</span>
                </button>
              </div>
            </motion.aside>
          </div>
        )}
      </AnimatePresence>

      {/* ==========================================
          MAIN PAGE CONTENT AREA
          ========================================== */}
      <div className="flex-1 flex flex-col min-w-0">
        
        {/* ==========================================
            TOPBAR
            ========================================== */}
        <header className="h-16 flex items-center justify-between px-4 md:px-6 border-b border-border-base bg-bg-surface/80 backdrop-blur-md select-none z-30 sticky top-0" role="banner">
          
          {/* Left: Mobile menu toggle + Page title */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileSidebarOpen(true)}
              className="p-2 -ml-2 rounded-lg text-text-muted hover:bg-border-base/50 md:hidden transition-colors"
              aria-label="Open sidebar menu"
            >
              <Menu size={20} />
            </button>
            <h1 className="text-sm font-bold tracking-tight font-display text-text-base md:text-base capitalize">
              {navItems.find((n: any) => n.id === activeTab)?.label}
            </h1>
          </div>

          {/* Right: Actions, search, notifications, themes, role changer */}
          <div className="flex items-center gap-3">
            
            {/* Global Role Changer (extremely useful for demonstrating role-aware dashboards) */}
            {user && (
              <div className="hidden sm:flex items-center gap-2 border-r border-border-base pr-3 h-8">
                <ShieldCheck size={14} className="text-text-muted" />
                <span className="text-[10px] font-bold text-text-muted uppercase">Role:</span>
                <select
                  value={user.role}
                  onChange={handleRoleChange}
                  className="rounded-md text-[11px] font-bold px-2 py-1 outline-none border cursor-pointer focus-visible:ring-1 focus-visible:ring-[var(--status-dispatched)]"
                  style={{ backgroundColor: 'var(--input-bg)', color: 'var(--input-text)', borderColor: 'var(--input-border)', colorScheme: 'inherit' }}
                  title="Switch Mock Role"
                >
                  <option value="FLEET_MANAGER" style={{ backgroundColor: 'var(--input-bg)', color: 'var(--input-text)' }}>Fleet Manager</option>
                  <option value="DRIVER" style={{ backgroundColor: 'var(--input-bg)', color: 'var(--input-text)' }}>Driver</option>
                  <option value="SAFETY_OFFICER" style={{ backgroundColor: 'var(--input-bg)', color: 'var(--input-text)' }}>Safety Officer</option>
                  <option value="FINANCIAL_ANALYST" style={{ backgroundColor: 'var(--input-bg)', color: 'var(--input-text)' }}>Financial Analyst</option>
                </select>
              </div>
            )}

            {/* Search Input Icon Placeholder */}
            <div className="relative hidden md:block">
              <span className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-text-muted">
                <Search size={14} />
              </span>
              <input
                type="text"
                placeholder="Global search..."
                className="w-44 lg:w-56 h-8 pl-8 pr-3 text-xs border rounded-md outline-none focus-visible:ring-1 focus-visible:ring-[var(--status-dispatched)]"
                style={{ backgroundColor: 'var(--input-bg)', color: 'var(--input-text)', borderColor: 'var(--input-border)' }}
              />
            </div>

            {/* Dark Mode Toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg text-text-muted hover:bg-border-base/50 transition-colors"
              aria-label={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
            >
              {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
            </button>

            {/* Notifications Dropdown */}
            <div className="relative">
              <button
                onClick={() => {
                  setNotificationsOpen(!notificationsOpen);
                  setProfileOpen(false);
                }}
                className="p-2 rounded-lg text-text-muted hover:bg-border-base/50 transition-colors relative"
                aria-label="View notifications"
                aria-expanded={notificationsOpen}
              >
                <Bell size={16} />
                <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-status-dispatched ring-2 ring-bg-surface animate-pulse"></span>
              </button>

              <AnimatePresence>
                {notificationsOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setNotificationsOpen(false)} />
                    <motion.div
                      initial={{opacity: 0, y: 10}}
                      animate={{opacity: 1, y: 0}}
                      exit={{opacity: 0, y: 10}}
                      transition={{duration: 0.12}}
                      className="absolute right-0 mt-2 w-80 bg-bg-surface border border-border-base rounded-lg shadow-xl py-2 z-50 text-xs"
                    >
                      <div className="px-4 py-2 border-b border-border-base font-bold text-text-base flex items-center justify-between">
                        <span>Notifications</span>
                        <span className="text-[10px] font-semibold text-status-dispatched bg-status-dispatched/10 px-1.5 py-0.5 rounded-md">New</span>
                      </div>
                      <div className="divide-y divide-border-base/40 max-h-60 overflow-y-auto">
                        {notifications.map((n) => (
                          <div key={n.id} className="px-4 py-3 hover:bg-bg-base/30 transition-colors">
                            <p className="text-text-base leading-snug font-medium mb-1">{n.text}</p>
                            <span className="text-[10px] text-text-muted font-bold">{n.time}</span>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>

            {/* Profile Dropdown */}
            {user && (
              <div className="relative">
                <button
                  onClick={() => {
                    setProfileOpen(!profileOpen);
                    setNotificationsOpen(false);
                  }}
                  className="flex items-center gap-2 pl-1.5 pr-2 py-1 bg-bg-base/60 hover:bg-bg-base border border-border-base rounded-full transition-all text-xs"
                  aria-label="Open user menu"
                  aria-expanded={profileOpen}
                >
                  <div className="h-6 w-6 rounded-full bg-status-dispatched flex items-center justify-center font-bold text-white text-[10px] uppercase">
                    {user.name.charAt(0)}
                  </div>
                  <span className="font-bold text-text-base hidden sm:inline max-w-24 truncate">{user.name}</span>
                </button>

                <AnimatePresence>
                  {profileOpen && (
                    <>
                      <div className="fixed inset-0 z-40" onClick={() => setProfileOpen(false)} />
                      <motion.div
                        initial={{opacity: 0, y: 10}}
                        animate={{opacity: 1, y: 0}}
                        exit={{opacity: 0, y: 10}}
                        transition={{duration: 0.12}}
                        className="absolute right-0 mt-2 w-52 bg-bg-surface border border-border-base rounded-lg shadow-xl py-1 z-50"
                      >
                        <div className="px-4 py-2.5 border-b border-border-base">
                          <p className="text-xs font-bold text-text-base leading-none truncate mb-1">{user.name}</p>
                          <p className="text-[10px] text-text-muted truncate">{user.email}</p>
                        </div>
                        
                        {/* Mobile Role selection */}
                        <div className="px-4 py-2 border-b border-border-base sm:hidden">
                          <div className="text-[9px] font-bold text-text-muted uppercase mb-1">Switch Role</div>
                          <select
                            value={user.role}
                            onChange={handleRoleChange}
                            className="w-full rounded-md text-[11px] font-bold px-1.5 py-1 outline-none border cursor-pointer"
                            style={{ backgroundColor: 'var(--input-bg)', color: 'var(--input-text)', borderColor: 'var(--input-border)', colorScheme: 'inherit' }}
                          >
                            <option value="FLEET_MANAGER" style={{ backgroundColor: 'var(--input-bg)', color: 'var(--input-text)' }}>Fleet Manager</option>
                            <option value="DRIVER" style={{ backgroundColor: 'var(--input-bg)', color: 'var(--input-text)' }}>Driver</option>
                            <option value="SAFETY_OFFICER" style={{ backgroundColor: 'var(--input-bg)', color: 'var(--input-text)' }}>Safety Officer</option>
                            <option value="FINANCIAL_ANALYST" style={{ backgroundColor: 'var(--input-bg)', color: 'var(--input-text)' }}>Financial Analyst</option>
                          </select>
                        </div>

                        <button
                          onClick={logout}
                          className="w-full text-left px-4 py-2 text-xs font-semibold text-red-500 hover:bg-red-500/10 flex items-center gap-2 transition-colors"
                        >
                          <LogOut size={14} />
                          <span>Log Out</span>
                        </button>
                      </motion.div>
                    </>
                  )}
                </AnimatePresence>
              </div>
            )}

          </div>
        </header>

        {/* ==========================================
            PAGECONTAINER
            ========================================== */}
        <main
          className="flex-1 overflow-y-auto px-4 py-6 md:px-6 md:py-8 lg:px-8 max-w-7xl w-full mx-auto"
          role="main"
          aria-label="Page Content"
        >
          {children}
        </main>
      </div>
    </div>
  );
});
