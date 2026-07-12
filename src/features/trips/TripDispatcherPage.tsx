import React, { memo, useState, useCallback } from 'react';
import { useData } from '../../contexts/DataContext';
import { LiveBoard } from './LiveBoard';
import { TripTable } from './TripTable';
import { TripForm } from '../../components/forms/TripForm';
import { MapPin, Plus } from 'lucide-react';
import { TripFormValues } from '../../schemas/validation';

export const TripDispatcherPage = memo(function TripDispatcherPage() {
  const { vehicles, drivers, addTrip, dispatchTrip, completeTrip, cancelTrip } = useData();
  const [isCreating, setIsCreating] = useState(false);
  const [submitError, setSubmitError] = useState<{field: string, message: string} | undefined>();

  const handleCreateTrip = useCallback(async (data: TripFormValues) => {
    const result = await addTrip({
      source: data.source,
      destination: data.destination,
      vehicleId: data.vehicleId,
      driverId: data.driverId,
      cargoWeight: data.cargoWeight,
      plannedDistance: data.plannedDistance,
    });

    if (result.success) {
      setIsCreating(false);
      setSubmitError(undefined);
    } else {
      setSubmitError(result.error);
    }
  }, [addTrip]);

  const handleActionClick = useCallback(async (tripId: string, action: 'dispatch' | 'complete' | 'cancel') => {
    if (action === 'dispatch') {
      await dispatchTrip(tripId);
    } else if (action === 'complete') {
      await completeTrip(tripId);
    } else if (action === 'cancel') {
      await cancelTrip(tripId);
    }
  }, [dispatchTrip, completeTrip, cancelTrip]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight font-display text-text-base flex items-center gap-2">
            <MapPin className="text-primary-base" />
            Trip Dispatcher
          </h1>
          <p className="text-sm text-text-muted mt-1">Manage active dispatches and view live board.</p>
        </div>
        
        {!isCreating && (
          <button
            onClick={() => setIsCreating(true)}
            className="flex items-center gap-2 px-4 py-2 bg-primary-base text-white rounded-lg hover:bg-primary-hover transition-colors font-medium shadow-sm"
          >
            <Plus size={18} />
            Create Trip
          </button>
        )}
      </div>

      {isCreating && (
        <div className="bg-bg-card rounded-xl border border-border-base p-6 shadow-sm animate-in fade-in slide-in-from-top-4 duration-300">
          <h2 className="text-lg font-bold font-display mb-6 border-b border-border-base pb-3">New Trip Dispatch</h2>
          <TripForm
            vehicles={vehicles}
            drivers={drivers}
            onSubmit={handleCreateTrip}
            onCancel={() => {
              setIsCreating(false);
              setSubmitError(undefined);
            }}
            externalErrors={submitError ? [submitError] : undefined}
          />
        </div>
      )}

      <LiveBoard />
      
      <div className="mt-8">
        <h2 className="text-xl font-bold tracking-tight font-display text-text-base mb-4">All Trips</h2>
        <TripTable onActionClick={handleActionClick} />
      </div>
    </div>
  );
});
