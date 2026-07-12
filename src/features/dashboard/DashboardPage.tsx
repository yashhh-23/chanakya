/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {memo} from 'react';
import {useData} from '../../contexts/DataContext';
import {KpiCard} from '../../components/ui/StatusAndMetrics';
import {
  TripTrendChart,
  VehicleHealthChart,
  FuelConsumptionChart
} from '../../components/charts/DashboardCharts';
import {
  Truck,
  Users,
  Wrench,
  Navigation,
  Percent,
  TrendingUp,
  MapPin,
  Calendar
} from 'lucide-react';

export const DashboardPage = memo(function DashboardPage() {
  const {stats, vehicles, drivers} = useData();

  // Find recent activities
  const recentVehicles = vehicles.slice(0, 3);
  const recentDrivers = drivers.slice(0, 3);

  return (
    <div className="space-y-8 select-none">
      
      {/* Upper Panel: Description & Actions */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold tracking-tight font-display text-text-base">Operations Control</h2>
          <p className="text-xs text-text-muted mt-0.5">Real-time telematics overview and active resource metrics.</p>
        </div>
        <div className="flex items-center gap-2 text-xs bg-bg-card border border-border-base rounded-lg px-3.5 py-1.5 font-bold text-text-muted shadow-xs">
          <Calendar size={14} className="text-status-dispatched" />
          <span>Jul 11, 2026</span>
        </div>
      </div>

      {/* KPI Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-5">
        <KpiCard
          label="Active Fleet"
          value={stats.activeFleetCount}
          change="+4%"
          trend="up"
          description="vs last week"
          icon={<Truck size={18} />}
        />
        <KpiCard
          label="Drivers On Duty"
          value={stats.driversOnDutyCount}
          change="100%"
          trend="neutral"
          description="compliance rating"
          icon={<Users size={18} />}
        />
        <KpiCard
          label="Vehicles In Shop"
          value={stats.vehiclesInShopCount}
          change="-2"
          trend="up" // Negative in shop is a positive trend
          description="resolved issues"
          icon={<Wrench size={18} />}
        />
        <KpiCard
          label="Today's Trips"
          value={stats.todayTripsCount}
          change="+12.5%"
          trend="up"
          description="active dispatches"
          icon={<Navigation size={18} />}
        />
        <KpiCard
          label="Fleet Utilization"
          value={`${stats.fleetUtilizationPercent}%`}
          change="+3.2%"
          trend="up"
          description="optimal load capacity"
          icon={<Percent size={18} />}
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <TripTrendChart />
        </div>
        <div>
          <VehicleHealthChart />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div>
          <FuelConsumptionChart />
        </div>
        
        {/* Recent Fleet Activities (Operational Transparency) */}
        <div className="bg-bg-card border border-border-base rounded-xl p-5 shadow-xs flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold font-display text-text-base mb-1">Recent Fleet Additions</h3>
            <p className="text-xs text-text-muted mb-4">Latest vehicles registered onto the platform</p>
            <div className="space-y-3.5">
              {recentVehicles.map((v) => (
                <div key={v.regNumber} className="flex items-center justify-between border-b border-border-base/40 pb-2.5 last:border-0 last:pb-0">
                  <div className="flex items-center gap-2.5">
                    <div className="h-8 w-8 rounded-lg bg-bg-base flex items-center justify-center text-text-muted">
                      <Truck size={14} />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-text-base">{v.name}</h4>
                      <p className="text-[10px] font-semibold text-text-muted uppercase tracking-wider">{v.regNumber}</p>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold text-text-muted">{v.region}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="text-[11px] font-semibold text-status-dispatched text-center cursor-pointer hover:underline mt-4">
            View full vehicle registry →
          </div>
        </div>

        {/* Recent Driver Activities */}
        <div className="bg-bg-card border border-border-base rounded-xl p-5 shadow-xs flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold font-display text-text-base mb-1">Recent Driver Check-ins</h3>
            <p className="text-xs text-text-muted mb-4">Latest active operators registered in database</p>
            <div className="space-y-3.5">
              {recentDrivers.map((d) => (
                <div key={d.licenseNumber} className="flex items-center justify-between border-b border-border-base/40 pb-2.5 last:border-0 last:pb-0">
                  <div className="flex items-center gap-2.5">
                    <div className="h-8 w-8 rounded-lg bg-bg-base flex items-center justify-center text-text-muted">
                      <Users size={14} />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-text-base">{d.name}</h4>
                      <p className="text-[10px] text-text-muted font-medium">{d.category}</p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end">
                    <span className="text-[10px] font-bold text-text-muted">{d.contactNumber}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="text-[11px] font-semibold text-status-dispatched text-center cursor-pointer hover:underline mt-4">
            View full driver directory →
          </div>
        </div>
      </div>

    </div>
  );
});
