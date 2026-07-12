/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {memo} from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar
} from 'recharts';

// ==========================================
// Mock Telemetry Data
// ==========================================
const tripTrendData = [
  {date: 'Jul 05', completed: 35, dispatched: 40},
  {date: 'Jul 06', completed: 42, dispatched: 45},
  {date: 'Jul 07', completed: 38, dispatched: 43},
  {date: 'Jul 08', completed: 48, dispatched: 50},
  {date: 'Jul 09', completed: 52, dispatched: 55},
  {date: 'Jul 10', completed: 60, dispatched: 64},
  {date: 'Jul 11', completed: 58, dispatched: 60},
];

const fuelTrendData = [
  {week: 'Wk 24', consumption: 1450, cost: 2900},
  {week: 'Wk 25', consumption: 1380, cost: 2760},
  {week: 'Wk 26', consumption: 1520, cost: 3040},
  {week: 'Wk 27', consumption: 1610, cost: 3220},
  {week: 'Wk 28', consumption: 1490, cost: 2980},
];

const vehicleHealthData = [
  {name: 'Available', value: 24, color: '#10b981'},    // var(--status-available)
  {name: 'On Trip', value: 12, color: '#f59e0b'},      // var(--status-ontrip)
  {name: 'Dispatched', value: 6, color: '#f97316'},    // var(--status-dispatched)
  {name: 'In Shop', value: 4, color: '#ef4444'},       // var(--status-inshop)
  {name: 'Retired', value: 2, color: '#6b7280'},       // var(--status-retired)
];

// ==========================================
// Custom Tooltip Component (Responsive & Theme-safe)
// ==========================================
interface CustomTooltipProps {
  active?: boolean;
  payload?: any[];
  label?: string;
  valueSuffix?: string;
}

const CustomTooltip = ({active, payload, label, valueSuffix = ''}: CustomTooltipProps) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-bg-surface border border-border-base p-3 rounded-lg shadow-xl text-xs select-none">
        <p className="font-bold text-text-base mb-1.5">{label}</p>
        <div className="space-y-1">
          {payload.map((item, index) => (
            <div key={index} className="flex items-center gap-4 justify-between font-medium">
              <span className="flex items-center gap-1.5 text-text-muted">
                <span className="h-2 w-2 rounded-full" style={{backgroundColor: item.color || item.fill}} />
                {item.name}:
              </span>
              <span className="font-bold text-text-base">
                {typeof item.value === 'number' ? item.value.toLocaleString() : item.value}
                {valueSuffix}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  }
  return null;
};

// ==========================================
// Trip Trend Chart (Area Chart)
// ==========================================
export const TripTrendChart = memo(function TripTrendChart() {
  return (
    <div className="w-full h-80 bg-bg-card border border-border-base rounded-xl p-5 shadow-xs">
      <div className="flex flex-col gap-1 mb-5">
        <h3 className="text-sm font-bold font-display text-text-base">Trip Volume Trend</h3>
        <p className="text-xs text-text-muted">Daily breakdown of scheduled dispatches vs successfully completed trips</p>
      </div>

      <div className="w-full h-[calc(100%-48px)]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={tripTrendData} margin={{top: 5, right: 5, left: -20, bottom: 0}}>
            <defs>
              <linearGradient id="colorCompleted" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--status-available)" stopOpacity={0.2}/>
                <stop offset="95%" stopColor="var(--status-available)" stopOpacity={0.01}/>
              </linearGradient>
              <linearGradient id="colorDispatched" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--status-dispatched)" stopOpacity={0.2}/>
                <stop offset="95%" stopColor="var(--status-dispatched)" stopOpacity={0.01}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.4} />
            <XAxis
              dataKey="date"
              stroke="var(--secondary)"
              fontSize={10}
              tickLine={false}
              axisLine={false}
              dy={10}
            />
            <YAxis
              stroke="var(--secondary)"
              fontSize={10}
              tickLine={false}
              axisLine={false}
              dx={-5}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend
              verticalAlign="top"
              height={36}
              iconType="circle"
              iconSize={8}
              wrapperStyle={{fontSize: 11, fontWeight: 500}}
            />
            <Area
              type="monotone"
              name="Completed Trips"
              dataKey="completed"
              stroke="var(--status-available)"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#colorCompleted)"
            />
            <Area
              type="monotone"
              name="Dispatched"
              dataKey="dispatched"
              stroke="var(--status-dispatched)"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#colorDispatched)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
});

// ==========================================
// Vehicle Health Chart (Pie Chart)
// ==========================================
export const VehicleHealthChart = memo(function VehicleHealthChart() {
  return (
    <div className="w-full h-80 bg-bg-card border border-border-base rounded-xl p-5 shadow-xs flex flex-col">
      <div className="flex flex-col gap-1 mb-5">
        <h3 className="text-sm font-bold font-display text-text-base">Fleet Allocation Breakdown</h3>
        <p className="text-xs text-text-muted">Real-time breakdown of vehicle statuses across regions</p>
      </div>

      <div className="flex-1 flex flex-col sm:flex-row items-center justify-around gap-4">
        {/* Pie graphic container */}
        <div className="w-40 h-40">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Tooltip content={<CustomTooltip />} />
              <Pie
                data={vehicleHealthData}
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={70}
                paddingAngle={4}
                dataKey="value"
              >
                {vehicleHealthData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Legend listing values */}
        <div className="grid grid-cols-2 sm:grid-cols-1 gap-x-6 gap-y-2 select-none">
          {vehicleHealthData.map((item, index) => (
            <div key={index} className="flex items-center gap-2 text-xs font-semibold">
              <span className="h-2.5 w-2.5 rounded-full flex-shrink-0" style={{backgroundColor: item.color}} />
              <span className="text-text-muted min-w-20">{item.name}</span>
              <span className="text-text-base font-bold ml-auto">{item.value} units</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
});

// ==========================================
// Fuel Consumption Chart (Bar Chart)
// ==========================================
export const FuelConsumptionChart = memo(function FuelConsumptionChart() {
  return (
    <div className="w-full h-80 bg-bg-card border border-border-base rounded-xl p-5 shadow-xs">
      <div className="flex flex-col gap-1 mb-5">
        <h3 className="text-sm font-bold font-display text-text-base">Weekly Fuel Analytics</h3>
        <p className="text-xs text-text-muted">Volume of fuel consumed (liters) vs operational cost (USD)</p>
      </div>

      <div className="w-full h-[calc(100%-48px)]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={fuelTrendData} margin={{top: 5, right: 5, left: -15, bottom: 0}}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.4} />
            <XAxis
              dataKey="week"
              stroke="var(--secondary)"
              fontSize={10}
              tickLine={false}
              axisLine={false}
              dy={10}
            />
            <YAxis
              stroke="var(--secondary)"
              fontSize={10}
              tickLine={false}
              axisLine={false}
              dx={-5}
            />
            <Tooltip content={<CustomTooltip valueSuffix=" L" />} />
            <Legend
              verticalAlign="top"
              height={36}
              iconType="rect"
              iconSize={10}
              wrapperStyle={{fontSize: 11, fontWeight: 500}}
            />
            <Bar
              name="Fuel Consumed"
              dataKey="consumption"
              fill="rgba(14, 165, 233, 0.8)" /* Sky Blue */
              radius={[4, 4, 0, 0]}
              barSize={24}
            />
            <Bar
              name="Operating Cost ($)"
              dataKey="cost"
              fill="rgba(168, 85, 247, 0.8)" /* Purple */
              radius={[4, 4, 0, 0]}
              barSize={24}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
});
