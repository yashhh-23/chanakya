import React, { memo, useEffect, useState, useMemo } from 'react';
import { useData } from '../../contexts/DataContext';
import { TripStatus } from '../../types';
import { Clock, RefreshCw, AlertTriangle, Navigation } from 'lucide-react';
import { SpinnerLinear } from '../../components/ui/StatusAndMetrics';

export const LiveBoard = memo(function LiveBoard() {
  const { trips, vehicles, drivers, refreshData, loading } = useData();
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Polling mechanism every 15s
  useEffect(() => {
    const interval = setInterval(() => {
      setIsRefreshing(true);
      refreshData().finally(() => {
        setIsRefreshing(false);
        setLastUpdated(new Date());
      });
    }, 15000);
    return () => clearInterval(interval);
  }, [refreshData]);

  const activeTrips = useMemo(() => {
    return trips.filter(t => {
      const s = (t.status || '').toUpperCase()
      return s === 'DISPATCHED' || s === 'COMPLETED'
    })
  }, [trips]);

  const getStatusBadge = (status: string) => {
    const s = (status || '').toUpperCase()
    const styles: Record<string, string> = {
      DRAFT: 'bg-status-available/10 text-status-available border-status-available/20',
      DISPATCHED: 'bg-status-dispatched/10 text-status-dispatched border-status-dispatched/20',
      COMPLETED: 'bg-status-inShop/10 text-status-inShop border-status-inShop/20',
      CANCELLED: 'bg-status-cancelled/10 text-status-cancelled border-status-cancelled/20',
    };
    
    return (
      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold border ${styles[s] || styles.DRAFT}`}>
        {s}
      </span>
    );
  };

  if (loading && trips.length === 0) {
    return (
      <div className="bg-bg-card rounded-xl border border-border-base p-6 shadow-sm mb-6">
        <h2 className="text-lg font-display font-bold text-text-base mb-4">Live Board</h2>
        <div className="space-y-4">
          <SpinnerLinear />
          <div className="h-10 bg-border-base/50 animate-pulse rounded"></div>
          <div className="h-10 bg-border-base/50 animate-pulse rounded"></div>
          <div className="h-10 bg-border-base/50 animate-pulse rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-bg-card rounded-xl border border-border-base shadow-sm mb-6 overflow-hidden">
      <div className="px-6 py-4 border-b border-border-base flex justify-between items-center bg-bg-base/50">
        <div>
          <h2 className="text-lg font-display font-bold text-text-base">Live Board</h2>
          <p className="text-xs text-text-muted mt-0.5">Real-time status of active trips</p>
        </div>
        <div className="flex items-center gap-2 text-xs text-text-muted bg-bg-base px-3 py-1.5 rounded-full border border-border-base">
          <Clock size={14} className={isRefreshing ? 'animate-pulse text-status-dispatched' : ''} />
          <span>Updated {lastUpdated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
          {isRefreshing && <RefreshCw size={12} className="animate-spin ml-1 text-status-dispatched" />}
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="text-xs text-text-muted uppercase bg-bg-base border-b border-border-base">
            <tr>
              <th className="px-6 py-4 font-semibold">Route</th>
              <th className="px-6 py-4 font-semibold">Vehicle</th>
              <th className="px-6 py-4 font-semibold">Driver</th>
              <th className="px-6 py-4 font-semibold">Status</th>
              <th className="px-6 py-4 font-semibold">ETA / Progress</th>
              <th className="px-6 py-4 font-semibold">Blocking Reason</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border-base">
            {activeTrips.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-10 text-center text-text-muted">
                  <div className="flex flex-col items-center gap-2">
                    <Navigation size={24} className="opacity-20" />
                    <p>No active trips on the live board.</p>
                  </div>
                </td>
              </tr>
            ) : (
              activeTrips.map(trip => (
                <tr key={trip.id} className="hover:bg-bg-base/50 transition-colors">
                  <td className="px-6 py-4 font-medium text-text-base whitespace-nowrap">
                    {trip.source} → {trip.destination}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {trip.vehicle?.regNumber || trip.vehicleId}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {trip.driver?.name || trip.driverId}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getStatusBadge(trip.status)}
                  </td>
                  <td className="px-6 py-4 text-text-muted whitespace-nowrap">
                    {trip.eta || 'Calculating...'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {trip.blockingReason ? (
                      <div className="flex items-center gap-1.5 text-status-cancelled text-xs font-medium">
                        <AlertTriangle size={14} />
                        {trip.blockingReason}
                      </div>
                    ) : (
                      <span className="text-text-muted text-xs">-</span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
});
