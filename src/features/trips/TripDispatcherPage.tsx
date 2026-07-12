import React, { memo, useState, useCallback } from 'react';
import { useData } from '../../contexts/DataContext';
import { useToast } from '../../contexts/ToastContext';
import { LiveBoard } from './LiveBoard';
import { TripTable } from './TripTable';
import { TripForm } from '../../components/forms/TripForm';
import { MapPin, Plus, Check } from 'lucide-react';
import { TripFormValues } from '../../schemas/validation';
import { Modal } from '../../components/ui/Feedback';
import { FormRow, NumberInput } from '../../components/ui/FormControls';
import { Trip } from '../../types';

export const TripDispatcherPage = memo(function TripDispatcherPage() {
  const { trips, vehicles, drivers, addTrip, dispatchTrip, completeTrip, cancelTrip } = useData();
  const { addToast } = useToast();
  const [isCreating, setIsCreating] = useState(false);
  const [submitError, setSubmitError] = useState<{field: string, message: string} | undefined>();

  // Completion states
  const [completingTrip, setCompletingTrip] = useState<Trip | null>(null);
  const [endOdometer, setEndOdometer] = useState<string>('');
  const [fuelConsumed, setFuelConsumed] = useState<string>('');
  const [completionError, setCompletionError] = useState<string>('');
  const [isSubmittingCompletion, setIsSubmittingCompletion] = useState(false);

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
      addToast('Trip Draft Created', 'Trip is now saved as draft and ready for dispatch.', 'success');
      setIsCreating(false);
      setSubmitError(undefined);
    } else {
      setSubmitError(result.error);
    }
  }, [addTrip, addToast]);

  const handleActionClick = useCallback(async (tripId: string, action: 'dispatch' | 'complete' | 'cancel') => {
    if (action === 'dispatch') {
      const result = await dispatchTrip(tripId);
      if (result.success) {
        addToast('Trip Dispatched', 'Vehicle and driver are now on active transit.', 'success');
      } else {
        addToast('Dispatch Failed', result.error?.message || 'Failed to dispatch trip.', 'error');
      }
    } else if (action === 'complete') {
      const trip = trips.find(t => t.id === tripId);
      if (trip) {
        setCompletingTrip(trip);
        setEndOdometer(trip.startOdometer ? String(trip.startOdometer) : '');
        setFuelConsumed('');
        setCompletionError('');
      }
    } else if (action === 'cancel') {
      const result = await cancelTrip(tripId);
      if (result.success) {
        addToast('Trip Cancelled', 'Dispatched trip cancelled. Vehicle and driver status restored to standby.', 'success');
      } else {
        addToast('Cancellation Failed', result.error?.message || 'Failed to cancel trip.', 'error');
      }
    }
  }, [dispatchTrip, cancelTrip, trips, addToast]);

  const handleCompleteSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!completingTrip) return;

    setCompletionError('');
    setIsSubmittingCompletion(true);

    const endOdoVal = parseFloat(endOdometer);
    const fuelVal = parseFloat(fuelConsumed);

    if (isNaN(endOdoVal) || endOdoVal < (completingTrip.startOdometer || 0)) {
      setCompletionError(`End odometer must be greater than or equal to start odometer (${completingTrip.startOdometer || 0} km).`);
      setIsSubmittingCompletion(false);
      return;
    }

    if (isNaN(fuelVal) || fuelVal <= 0) {
      setCompletionError('Fuel consumed must be a positive number greater than 0.');
      setIsSubmittingCompletion(false);
      return;
    }

    const result = await completeTrip(completingTrip.id, {
      endOdometer: endOdoVal,
      fuelConsumed: fuelVal
    });

    setIsSubmittingCompletion(false);

    if (result.success) {
      addToast(
        'Trip Completed',
        `Odometer updated to ${endOdoVal} km. Fuel log created for ${fuelVal}L.`,
        'success'
      );
      setCompletingTrip(null);
    } else {
      setCompletionError(result.error?.message || 'Failed to complete trip.');
    }
  }, [completingTrip, endOdometer, fuelConsumed, completeTrip, addToast]);

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

      {/* Complete Trip Modal */}
      <Modal
        isOpen={!!completingTrip}
        onClose={() => setCompletingTrip(null)}
        title="Complete Dispatched Trip"
        size="md"
      >
        {completingTrip && (
          <form onSubmit={handleCompleteSubmit} className="space-y-4">
            <div className="p-3 bg-bg-surface border border-border-base rounded-lg text-xs text-text-muted">
              <span className="font-bold text-text-base block mb-1">Route Context:</span>
              {completingTrip.source} &rarr; {completingTrip.destination}
              <span className="block mt-1">Dispatched Odometer: <strong>{completingTrip.startOdometer || 0} km</strong></span>
            </div>

            {completionError && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-500 rounded-lg text-xs font-semibold">
                {completionError}
              </div>
            )}

            <FormRow label="Ending Odometer (km)" required>
              <NumberInput
                value={endOdometer}
                onChange={(e) => setEndOdometer(e.target.value)}
                min={completingTrip.startOdometer || 0}
                step="1"
                placeholder="e.g. 12240"
              />
            </FormRow>

            <FormRow label="Fuel Consumed (Liters)" required>
              <NumberInput
                value={fuelConsumed}
                onChange={(e) => setFuelConsumed(e.target.value)}
                min="0.1"
                step="0.1"
                placeholder="e.g. 45.5"
              />
            </FormRow>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-border-base">
              <button
                type="button"
                onClick={() => setCompletingTrip(null)}
                className="px-4 py-2 border border-border-base hover:bg-bg-base/50 text-text-base text-xs font-bold rounded-lg transition-all"
                disabled={isSubmittingCompletion}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-status-inShop text-white hover:bg-opacity-95 text-xs font-bold rounded-lg shadow-sm transition-all flex items-center gap-1.5"
                disabled={isSubmittingCompletion}
              >
                <Check size={14} />
                {isSubmittingCompletion ? 'Completing...' : 'Complete Trip'}
              </button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
});
