import React, { memo, useState, useMemo } from 'react';
import { useData } from '../../contexts/DataContext';
import { TripStatus } from '../../types';
import { Search, Filter, ArrowUpDown, ChevronRight, CheckCircle, XCircle, Clock, Navigation } from 'lucide-react';
import { SpinnerLinear } from '../../components/ui/StatusAndMetrics';

interface TripTableProps {
  onActionClick: (tripId: string, action: 'dispatch' | 'complete' | 'cancel') => void;
}

export const TripTable = memo(function TripTable({ onActionClick }: TripTableProps) {
  const { trips, loading } = useData();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<TripStatus | 'All'>('All');
  const [sortField, setSortField] = useState<'createdAt' | 'status' | 'destination'>('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const getStatusBadge = (status: string) => {
    const s = (status || '').toUpperCase()
    const styles: Record<string, string> = {
      DRAFT: 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20',
      DISPATCHED: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
      COMPLETED: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
      CANCELLED: 'bg-red-500/10 text-red-400 border-red-500/20',
    };
    
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${styles[s] || styles.DRAFT}`}>
        {s}
      </span>
    );
  };

  const filteredTrips = useMemo(() => {
    return trips.filter(trip => {
      const matchesSearch = trip.destination.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            trip.source.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            (trip.vehicle?.regNumber || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                            (trip.driver?.name || '').toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === 'All' || (trip.status || '').toUpperCase() === statusFilter.toUpperCase();
      return matchesSearch && matchesStatus;
    }).sort((a, b) => {
      let comparison = 0;
      if (sortField === 'createdAt') {
        comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      } else if (sortField === 'status') {
        comparison = a.status.localeCompare(b.status);
      } else if (sortField === 'destination') {
        comparison = a.destination.localeCompare(b.destination);
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });
  }, [trips, searchTerm, statusFilter, sortField, sortOrder]);

  const toggleSort = (field: 'createdAt' | 'status' | 'destination') => {
    if (sortField === field) {
      setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  if (loading && trips.length === 0) {
    return (
      <div className="bg-bg-card rounded-xl border border-border-base shadow-sm">
        <div className="p-4 border-b border-border-base">
          <SpinnerLinear />
        </div>
        <div className="p-4 space-y-4">
          <div className="h-10 bg-border-base/50 animate-pulse rounded"></div>
          <div className="h-10 bg-border-base/50 animate-pulse rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-bg-card rounded-xl border border-border-base shadow-sm overflow-hidden">
      <div className="p-4 border-b border-border-base flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-bg-base/30">
        <div className="relative flex-1 max-w-md">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search size={16} className="text-text-muted" />
          </div>
          <input
            type="text"
            className="block w-full pl-10 pr-3 py-2 border border-[var(--input-border)] rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-[var(--status-dispatched)] transition-colors"
            placeholder="Search destination, vehicle, driver..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 border border-[var(--input-border)] rounded-lg px-3 py-1.5" style={{ backgroundColor: 'var(--input-bg)' }}>
            <Filter size={16} className="text-text-muted" />
            <select 
              className="text-sm focus:outline-none cursor-pointer border-none outline-none"
              style={{ backgroundColor: 'var(--input-bg)', color: 'var(--input-text)' }}
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
            >
              <option value="All" style={{ backgroundColor: 'var(--input-bg)', color: 'var(--input-text)' }}>All Statuses</option>
              <option value="Draft" style={{ backgroundColor: 'var(--input-bg)', color: 'var(--input-text)' }}>Draft</option>
              <option value="Dispatched" style={{ backgroundColor: 'var(--input-bg)', color: 'var(--input-text)' }}>Dispatched</option>
              <option value="Completed" style={{ backgroundColor: 'var(--input-bg)', color: 'var(--input-text)' }}>Completed</option>
              <option value="Cancelled" style={{ backgroundColor: 'var(--input-bg)', color: 'var(--input-text)' }}>Cancelled</option>
            </select>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="text-xs text-text-muted uppercase bg-bg-base border-b border-border-base">
            <tr>
              <th className="px-6 py-4 font-semibold cursor-pointer hover:bg-bg-card transition-colors" onClick={() => toggleSort('destination')}>
                <div className="flex items-center gap-1">
                  Route
                  <ArrowUpDown size={14} className={sortField === 'destination' ? 'text-primary-base' : 'opacity-50'} />
                </div>
              </th>
              <th className="px-6 py-4 font-semibold cursor-pointer hover:bg-bg-card transition-colors" onClick={() => toggleSort('createdAt')}>
                <div className="flex items-center gap-1">
                  Created Date
                  <ArrowUpDown size={14} className={sortField === 'createdAt' ? 'text-primary-base' : 'opacity-50'} />
                </div>
              </th>
              <th className="px-6 py-4 font-semibold">Vehicle & Driver</th>
              <th className="px-6 py-4 font-semibold cursor-pointer hover:bg-bg-card transition-colors" onClick={() => toggleSort('status')}>
                <div className="flex items-center gap-1">
                  Status
                  <ArrowUpDown size={14} className={sortField === 'status' ? 'text-primary-base' : 'opacity-50'} />
                </div>
              </th>
              <th className="px-6 py-4 font-semibold text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border-base">
            {filteredTrips.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-10 text-center text-text-muted">
                  <div className="flex flex-col items-center gap-2">
                    <Navigation size={24} className="opacity-20" />
                    <p>No trips match your filters.</p>
                  </div>
                </td>
              </tr>
            ) : (
              filteredTrips.map(trip => (
                <tr key={trip.id} className="hover:bg-bg-base/50 transition-colors group">
                  <td className="px-6 py-4 font-medium text-text-base whitespace-nowrap">
                    <div className="flex flex-col">
                      <span>{trip.source} → {trip.destination}</span>
                      <span className="text-xs text-text-muted font-normal">{trip.plannedDistance} km | {trip.cargoWeight} kg</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-text-muted">
                    {new Date(trip.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex flex-col">
                      <span className="font-medium text-text-base">{trip.vehicle?.regNumber || trip.vehicleId}</span>
                      <span className="text-xs text-text-muted">{trip.driver?.name || trip.driverId}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getStatusBadge(trip.status)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      {(trip.status || '').toUpperCase() === 'DRAFT' && (
                        <>
                          <button 
                            onClick={() => onActionClick(trip.id, 'dispatch')}
                            className="p-1.5 bg-status-dispatched/10 text-status-dispatched rounded hover:bg-status-dispatched/20 transition-colors"
                            title="Dispatch Trip"
                          >
                            <Navigation size={16} />
                          </button>
                          <button 
                            onClick={() => onActionClick(trip.id, 'cancel')}
                            className="p-1.5 bg-status-cancelled/10 text-status-cancelled rounded hover:bg-status-cancelled/20 transition-colors"
                            title="Cancel Trip"
                          >
                            <XCircle size={16} />
                          </button>
                        </>
                      )}
                      {(trip.status || '').toUpperCase() === 'DISPATCHED' && (
                        <button 
                          onClick={() => onActionClick(trip.id, 'complete')}
                          className="p-1.5 bg-emerald-500/10 text-emerald-400 rounded hover:bg-emerald-500/20 transition-colors"
                          title="Complete Trip"
                        >
                          <CheckCircle size={16} />
                        </button>
                      )}
                    </div>
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
