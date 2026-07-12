import React, { memo, useState, useMemo } from 'react';
import { useData } from '../../contexts/DataContext';
import { TripStatus, Trip } from '../../types';
import { CheckCircle, XCircle, Navigation } from 'lucide-react';
import { DataTable, Column } from '../../components/data-table/DataTable';
import { StatusBadge } from '../../components/ui/StatusBadge';

interface TripTableProps {
  onActionClick: (tripId: string, action: 'dispatch' | 'complete' | 'cancel') => void;
}

export const TripTable = memo(function TripTable({ onActionClick }: TripTableProps) {
  const { trips, loading } = useData();
  const [statusFilter, setStatusFilter] = useState<TripStatus | 'All'>('All');

  // Mapped data with concatenated searchText for multi-field search support inside DataTable
  const tableData = useMemo(() => {
    return trips.map((trip) => ({
      ...trip,
      searchText: `${trip.destination} ${trip.source} ${trip.vehicle?.regNumber || trip.vehicleId} ${trip.driver?.name || trip.driverId}`.toLowerCase(),
    }));
  }, [trips]);

  // Pre-filter on status so the internal search filter in DataTable works on top of it
  const filteredTrips = useMemo(() => {
    return tableData.filter((trip) => {
      if (statusFilter === 'All') return true;
      return (trip.status || '').toUpperCase() === statusFilter.toUpperCase();
    });
  }, [tableData, statusFilter]);

  const columns: Column<any>[] = useMemo(
    () => [
      {
        id: 'route',
        header: 'Route',
        sortable: true,
        accessorKey: 'destination',
        cell: (row: Trip) => (
          <div className="flex flex-col">
            <span className="font-semibold text-text-base">
              {row.source} → {row.destination}
            </span>
            <span className="text-xs text-text-muted font-normal mt-0.5">
              {row.plannedDistance} km | {row.cargoWeight} kg
            </span>
          </div>
        ),
      },
      {
        id: 'createdAt',
        header: 'Created Date',
        sortable: true,
        accessorKey: 'createdAt',
        cell: (row: Trip) => (
          <span className="text-text-muted">
            {new Date(row.createdAt).toLocaleDateString()}
          </span>
        ),
      },
      {
        id: 'vehicleDriver',
        header: 'Vehicle & Driver',
        cell: (row: Trip) => (
          <div className="flex flex-col">
            <span className="font-medium text-text-base">
              {row.vehicle?.regNumber || row.vehicleId}
            </span>
            <span className="text-xs text-text-muted mt-0.5">
              {row.driver?.name || row.driverId}
            </span>
          </div>
        ),
      },
      {
        id: 'status',
        header: 'Status',
        sortable: true,
        accessorKey: 'status',
        cell: (row: Trip) => <StatusBadge status={row.status} size="sm" />,
      },
      {
        id: 'actions',
        header: 'Actions',
        cell: (row: Trip) => {
          const statusUpper = (row.status || '').toUpperCase();
          return (
            <div className="flex items-center justify-end gap-2">
              {statusUpper === 'DRAFT' && (
                <>
                  <button
                    onClick={() => onActionClick(row.id, 'dispatch')}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg border border-status-dispatched/30 bg-status-dispatched/10 text-status-dispatched hover:bg-status-dispatched/20 transition-all shadow-sm"
                    title="Dispatch Trip"
                  >
                    <Navigation size={14} strokeWidth={2.5} />
                    <span>Dispatch</span>
                  </button>
                  <button
                    onClick={() => onActionClick(row.id, 'cancel')}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg border border-status-cancelled/30 bg-status-cancelled/10 text-status-cancelled hover:bg-status-cancelled/20 transition-all shadow-sm"
                    title="Cancel Trip"
                  >
                    <XCircle size={14} strokeWidth={2.5} />
                    <span>Cancel</span>
                  </button>
                </>
              )}
              {statusUpper === 'DISPATCHED' && (
                <button
                  onClick={() => onActionClick(row.id, 'complete')}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg border border-emerald-500/30 bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 transition-all shadow-sm"
                  title="Complete Trip"
                >
                  <CheckCircle size={14} strokeWidth={2.5} />
                  <span>Complete</span>
                </button>
              )}
            </div>
          );
        },
      },
    ],
    [onActionClick]
  );

  return (
    <div className="space-y-4">
      {/* Filter panel */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-bg-card border border-border-base rounded-xl p-4 shadow-xs">
        <div className="w-full sm:w-64">
          <label className="block text-[10px] font-bold uppercase text-text-muted mb-1.5">
            Filter by Trip Status
          </label>
          <select
            className="w-full h-9 px-2 bg-bg-surface border border-border-base rounded-lg text-xs font-medium text-text-base outline-none focus-visible:ring-1 focus-visible:ring-status-dispatched cursor-pointer"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
          >
            <option value="All">All Statuses</option>
            <option value="Draft">Draft</option>
            <option value="Dispatched">Dispatched</option>
            <option value="Completed">Completed</option>
            <option value="Cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      {/* DataTable Container */}
      <div className="h-[520px]">
        <DataTable<any>
          columns={columns}
          data={filteredTrips}
          searchKey="searchText"
          searchPlaceholder="Search destination, vehicle, driver..."
          pageSize={8}
          loading={loading}
        />
      </div>
    </div>
  );
});
