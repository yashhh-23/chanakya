/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useMemo, useCallback, memo } from 'react';
import { useData } from '../../contexts/DataContext';
import { DataTable, Column } from '../../components/data-table/DataTable';
import { MetricCard, StatusPill } from '../../components/ui/StatusAndMetrics';
import { BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Legend, ResponsiveContainer } from 'recharts';
import { BarChart3, Download, RefreshCw, AlertCircle, FileText, Fuel, DollarSign, Percent, TrendingUp } from 'lucide-react';
import { SpinnerCircular } from '../../components/ui/StatusAndMetrics';

interface VehicleReportItem {
  id: string;
  regNumber: string;
  name: string;
  type: string;
  odometer: number;
  status: string;
  fuelCost: number;
  maintCost: number;
  otherCost: number;
  operationalCost: number;
  fuelEfficiency: number;
  roi: number;
}

export const AnalyticsPage = memo(function AnalyticsPage() {
  const {
    vehicles,
    trips,
    expenses,
    loading,
    error,
    refreshData,
  } = useData();

  const [activeSubTab, setActiveSubTab] = useState<'fleet' | 'fuel' | 'cost' | 'roi'>('fleet');
  const [lastRefreshed, setLastRefreshed] = useState<string>(new Date().toLocaleTimeString());

  const handleRefresh = useCallback(async () => {
    await refreshData();
    setLastRefreshed(new Date().toLocaleTimeString());
  }, [refreshData]);

  // Compute detailed metrics for each vehicle
  const vehicleReportData = useMemo<VehicleReportItem[]>(() => {
    return vehicles.map((v) => {
      // operational cost
      const vExpenses = expenses.filter((exp) => exp.vehicleId === v.id);
      const fuelCost = vExpenses.filter((e) => e.category === 'Fuel').reduce((sum, e) => sum + e.amount, 0);
      const maintCost = vExpenses.filter((e) => e.category === 'Maintenance').reduce((sum, e) => sum + e.amount, 0);
      const otherCost = vExpenses.filter((e) => e.category === 'Toll' || e.category === 'Other').reduce((sum, e) => sum + e.amount, 0);
      const totalOpCost = fuelCost + maintCost + otherCost;

      // Fuel efficiency
      const vTrips = trips.filter((t) => t.vehicleId === v.id && t.status === 'Completed');
      const totalDistance = vTrips.reduce((sum, t) => sum + (t.plannedDistance || 0), 0);
      const totalFuel = vTrips.reduce((sum, t) => sum + (t.fuelConsumed || 0), 0);
      const fuelEfficiency = totalFuel > 0 ? totalDistance / totalFuel : 0;

      // ROI
      const totalRevenue = vTrips.reduce((sum, t) => sum + (t.revenue || 0), 0);
      const acquisitionCost = v.acquisitionCost || 10000;
      const roi = ((totalRevenue - totalOpCost) / acquisitionCost) * 100;

      return {
        id: v.id || '',
        regNumber: v.regNumber || '',
        name: v.name || '',
        type: v.type || '',
        odometer: v.odometer || 0,
        status: v.status || 'AVAILABLE',
        fuelCost,
        maintCost,
        otherCost,
        operationalCost: totalOpCost,
        fuelEfficiency,
        roi,
      };
    });
  }, [vehicles, expenses, trips]);

  // Compute 4 global KPI Summary Cards
  const stats = useMemo(() => {
    // 1. Avg Fuel Efficiency = Total completed distance / Total completed fuel
    const completedTrips = trips.filter((t) => t.status === 'Completed');
    const totalDistance = completedTrips.reduce((sum, t) => sum + (t.plannedDistance || 0), 0);
    const totalFuel = completedTrips.reduce((sum, t) => sum + (t.fuelConsumed || 0), 0);
    const avgFuelEfficiency = totalFuel > 0 ? totalDistance / totalFuel : 0;

    // 2. Total Fleet Cost = Sum of all expenses
    const totalFleetCost = expenses.reduce((sum, exp) => sum + exp.amount, 0);

    // 3. Avg ROI (%) = Sum of active vehicles ROI / Count of active vehicles
    const activeVehiclesReport = vehicleReportData.filter((v) => v.status !== 'RETIRED');
    const avgRoi =
      activeVehiclesReport.length > 0
        ? activeVehiclesReport.reduce((sum, v) => sum + v.roi, 0) / activeVehiclesReport.length
        : 0;

    // 4. Fleet Utilization (%) = (Vehicles On Trip or Dispatched / Total Active Vehicles) * 100
    const activeFleet = vehicles.filter((v) => v.status !== 'RETIRED');
    const busyVehicles = activeFleet.filter(
      (v) => v.status === 'ON_TRIP' || v.status === 'DISPATCHED'
    );
    const fleetUtilization =
      activeFleet.length > 0 ? (busyVehicles.length / activeFleet.length) * 100 : 0;

    return {
      avgFuelEfficiency,
      totalFleetCost,
      avgRoi,
      fleetUtilization,
    };
  }, [trips, expenses, vehicles, vehicleReportData]);

  // CSV Export handler
  const handleExportCSV = useCallback(() => {
    const headers = [
      'Registration Number',
      'Model Name',
      'Vehicle Type',
      'Current Odometer (km)',
      'Total Operational Cost',
      'Calculated ROI',
      'Current Status',
    ];

    const csvRows = [
      headers.join(','),
      ...vehicleReportData.map((row) =>
        [
          `"${row.regNumber}"`,
          `"${row.name}"`,
          `"${row.type}"`,
          row.odometer,
          row.operationalCost.toFixed(2),
          (row.roi / 100).toFixed(4),
          `"${row.status}"`,
        ].join(',')
      ),
    ];

    const csvContent = csvRows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute(
      'download',
      `transitops_fleet_report_${new Date().toISOString().slice(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, [vehicleReportData]);

  // Fleet Report columns
  const fleetColumns: Column<VehicleReportItem>[] = useMemo(
    () => [
      {
        id: 'regNumber',
        header: 'Registration Number',
        accessorKey: 'regNumber',
        sortable: true,
        cell: (row) => <span className="font-mono font-bold uppercase">{row.regNumber}</span>,
      },
      {
        id: 'name',
        header: 'Model Name',
        accessorKey: 'name',
        sortable: true,
        cell: (row) => <span className="font-medium text-text-base">{row.name}</span>,
      },
      {
        id: 'type',
        header: 'Vehicle Type',
        accessorKey: 'type',
        sortable: true,
      },
      {
        id: 'odometer',
        header: 'Current Odometer (km)',
        accessorKey: 'odometer',
        sortable: true,
        cell: (row) => <span className="font-mono text-xs">{row.odometer.toLocaleString()} km</span>,
      },
      {
        id: 'operationalCost',
        header: 'Total Operational Cost',
        accessorKey: 'operationalCost',
        sortable: true,
        cell: (row) => (
          <span className="font-mono font-bold">
            ${row.operationalCost.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </span>
        ),
      },
      {
        id: 'roi',
        header: 'Calculated ROI',
        accessorKey: 'roi',
        sortable: true,
        cell: (row) => (
          <span className={`font-mono font-bold ${row.roi >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
            {row.roi.toFixed(1)}%
          </span>
        ),
      },
      {
        id: 'status',
        header: 'Current Status',
        accessorKey: 'status',
        sortable: true,
        cell: (row) => <StatusPill status={row.status as any} />,
      },
    ],
    []
  );

  if (loading && vehicleReportData.length === 0) {
    return (
      <div className="h-[400px] flex flex-col items-center justify-center gap-3">
        <SpinnerCircular size="lg" />
        <p className="text-sm text-text-muted">Analyzing operational statistics...</p>
      </div>
    );
  }

  if (error && vehicleReportData.length === 0) {
    return (
      <div className="h-[400px] flex flex-col items-center justify-center gap-3 border border-red-500/20 bg-red-500/5 rounded-xl p-6">
        <AlertCircle size={32} className="text-red-500" />
        <h3 className="text-sm font-bold text-text-base">System Error</h3>
        <p className="text-xs text-text-muted text-center max-w-sm">{error}</p>
        <button
          onClick={handleRefresh}
          className="mt-2 px-3 py-1.5 text-xs font-bold bg-bg-surface border border-border-base text-text-base rounded-lg hover:bg-bg-base/40 flex items-center gap-1.5"
        >
          <RefreshCw size={12} />
          <span>Retry Connection</span>
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8 select-none">
      {/* Header Panel */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold tracking-tight font-display text-text-base">
            Reports & Analytics
          </h2>
          <p className="text-xs text-text-muted mt-0.5">
            Audit overall operational finance performance, ROI charts, and download compliance reports.
          </p>
        </div>

        <div className="flex items-center gap-2.5 w-full sm:w-auto">
          <span className="text-[10px] font-bold text-text-muted mr-1.5">
            Last updated: {lastRefreshed}
          </span>
          <button
            onClick={handleRefresh}
            className="p-2 border border-border-base bg-bg-surface hover:bg-bg-base/50 text-text-muted rounded-lg transition-all"
            title="Refresh Data"
          >
            <RefreshCw size={16} />
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <MetricCard
          label="Avg Fuel Efficiency"
          value={`${stats.avgFuelEfficiency.toFixed(2)} km/L`}
          icon={<Fuel size={16} className="text-emerald-500" />}
        />
        <MetricCard
          label="Total Fleet Cost"
          value={`$${stats.totalFleetCost.toLocaleString(undefined, { maximumFractionDigits: 0 })}`}
          icon={<DollarSign size={16} className="text-blue-500" />}
        />
        <MetricCard
          label="Avg Vehicle ROI"
          value={`${stats.avgRoi.toFixed(1)}%`}
          icon={<Percent size={16} className={stats.avgRoi >= 0 ? 'text-emerald-500' : 'text-red-500'} />}
        />
        <MetricCard
          label="Fleet Utilization"
          value={`${stats.fleetUtilization.toFixed(1)}%`}
          icon={<TrendingUp size={16} className="text-amber-500" />}
        />
      </div>

      {/* Main Tabs Panel */}
      <div className="bg-bg-card border border-border-base rounded-xl p-5 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border-base/50 pb-4">
          <div className="flex flex-wrap rounded-lg border border-border-base p-0.5 bg-bg-surface">
            {[
              { id: 'fleet', label: 'Fleet Report', icon: FileText },
              { id: 'fuel', label: 'Fuel Efficiency', icon: Fuel },
              { id: 'cost', label: 'Operational Costs', icon: BarChart3 },
              { id: 'roi', label: 'Vehicle ROI', icon: Percent },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveSubTab(tab.id as any)}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-md transition-all ${
                  activeSubTab === tab.id
                    ? 'bg-muted-base text-white border border-border-base/50 shadow-sm'
                    : 'text-text-muted hover:text-text-base border border-transparent'
                }`}
              >
                <tab.icon size={12} />
                <span>{tab.label}</span>
              </button>
            ))}
          </div>

          {activeSubTab === 'fleet' && (
            <button
              onClick={handleExportCSV}
              className="flex items-center justify-center gap-2 h-8 px-4 text-[11px] font-bold bg-status-dispatched text-white hover:bg-opacity-95 shadow-sm rounded-lg transition-all"
            >
              <Download size={12} />
              <span>Export CSV</span>
            </button>
          )}
        </div>

        {/* Tab Contents */}
        <div className="min-h-[380px]">
          {activeSubTab === 'fleet' && (
            <div>
              {vehicleReportData.length === 0 ? (
                <div className="h-[300px] flex flex-col items-center justify-center text-center">
                  <FileText size={28} className="text-text-muted/40 mb-1" />
                  <p className="text-xs text-text-muted font-semibold">No fleet records available.</p>
                </div>
              ) : (
                <DataTable<VehicleReportItem>
                  columns={fleetColumns}
                  data={vehicleReportData}
                  searchKey="name"
                  searchPlaceholder="Search vehicles by name..."
                  pageSize={8}
                />
              )}
            </div>
          )}

          {activeSubTab === 'fuel' && (
            <div className="space-y-4">
              <div>
                <h4 className="text-xs font-extrabold text-text-base">Fuel Efficiency per Vehicle (km/L)</h4>
                <p className="text-[10px] text-text-muted">Shows the computed efficiency metrics from completed trips.</p>
              </div>

              {vehicleReportData.length === 0 ? (
                <div className="h-[300px] flex flex-col items-center justify-center text-center">
                  <AlertCircle size={28} className="text-text-muted/40 mb-1" />
                  <p className="text-xs text-text-muted font-semibold">No fuel efficiency data.</p>
                </div>
              ) : (
                <div className="w-full h-[320px] bg-bg-surface/20 rounded-lg p-3">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={vehicleReportData} margin={{ top: 20, right: 30, left: 10, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                      <XAxis dataKey="regNumber" stroke="#94a3b8" fontSize={10} tickLine={false} />
                      <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} />
                      <Tooltip
                        contentStyle={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)', borderRadius: '8px', color: 'var(--text)', fontSize: '11px' }}
                      />
                      <Bar dataKey="fuelEfficiency" name="Efficiency (km/L)" fill="#10b981" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          )}

          {activeSubTab === 'cost' && (
            <div className="space-y-4">
              <div>
                <h4 className="text-xs font-extrabold text-text-base">Operational Cost Breakdown ($)</h4>
                <p className="text-[10px] text-text-muted">Aggregated fuel, maintenance, and toll/other costs per fleet asset.</p>
              </div>

              {vehicleReportData.length === 0 ? (
                <div className="h-[300px] flex flex-col items-center justify-center text-center">
                  <AlertCircle size={28} className="text-text-muted/40 mb-1" />
                  <p className="text-xs text-text-muted font-semibold">No cost data available.</p>
                </div>
              ) : (
                <div className="w-full h-[320px] bg-bg-surface/20 rounded-lg p-3">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={vehicleReportData} margin={{ top: 20, right: 30, left: 10, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                      <XAxis dataKey="regNumber" stroke="#94a3b8" fontSize={10} tickLine={false} />
                      <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} />
                      <Tooltip
                        contentStyle={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)', borderRadius: '8px', color: 'var(--text)', fontSize: '11px' }}
                      />
                      <Legend wrapperStyle={{ fontSize: '10px', paddingTop: '10px' }} />
                      <Bar dataKey="fuelCost" name="Fuel Cost" stackId="costs" fill="#10b981" />
                      <Bar dataKey="maintCost" name="Maintenance" stackId="costs" fill="#f59e0b" />
                      <Bar dataKey="otherCost" name="Tolls & Other" stackId="costs" fill="#3b82f6" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          )}

          {activeSubTab === 'roi' && (
            <div className="space-y-4">
              <div>
                <h4 className="text-xs font-extrabold text-text-base">Calculated Vehicle ROI (%)</h4>
                <p className="text-[10px] text-text-muted">Shows return on investment based on acquisition cost, revenue, and operation cost.</p>
              </div>

              {vehicleReportData.length === 0 ? (
                <div className="h-[300px] flex flex-col items-center justify-center text-center">
                  <AlertCircle size={28} className="text-text-muted/40 mb-1" />
                  <p className="text-xs text-text-muted font-semibold">No ROI data calculated.</p>
                </div>
              ) : (
                <div className="w-full h-[320px] bg-bg-surface/20 rounded-lg p-3">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={vehicleReportData} margin={{ top: 20, right: 30, left: 10, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                      <XAxis dataKey="regNumber" stroke="#94a3b8" fontSize={10} tickLine={false} />
                      <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} />
                      <Tooltip
                        contentStyle={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)', borderRadius: '8px', color: 'var(--text)', fontSize: '11px' }}
                      />
                      <Bar dataKey="roi" name="ROI (%)" fill="#6366f1" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
});