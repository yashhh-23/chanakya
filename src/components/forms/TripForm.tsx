import React, { useMemo } from 'react';
import { EntityForm, ApiFieldError } from './EntityForm';
import { tripSchema, TripFormValues } from '../../schemas/validation';
import { FormRow, TextInput, NumberInput, SelectBox } from '../ui/FormControls';
import { Vehicle, Driver } from '../../types';
import { AlertCircle } from 'lucide-react';

interface TripFormProps {
  initialValues?: Partial<TripFormValues>;
  onSubmit: (data: TripFormValues) => Promise<void> | void;
  externalErrors?: ApiFieldError[];
  onCancel?: () => void;
  vehicles: Vehicle[];
  drivers: Driver[];
}

export const TripForm: React.FC<TripFormProps> = ({
  initialValues,
  onSubmit,
  externalErrors,
  onCancel,
  vehicles,
  drivers,
}) => {
  const availableVehicles = useMemo(() => vehicles.filter(v => v.status === 'AVAILABLE'), [vehicles]);
  
  const eligibleDrivers = useMemo(() => drivers.filter(d => {
    if (d.status !== 'AVAILABLE') return false;
    const expiry = new Date(d.licenseExpiry);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return expiry > today;
  }), [drivers]);

  const vehicleOptions = availableVehicles.map(v => ({
    value: v.id!,
    label: `${v.regNumber} (${v.type}) - Cap: ${v.maxCapacity}kg`,
  }));

  const driverOptions = eligibleDrivers.map(d => ({
    value: d.id!,
    label: `${d.name} (${d.category})`,
  }));

  return (
    <EntityForm<TripFormValues>
      schema={tripSchema}
      onSubmit={onSubmit}
      defaultValues={initialValues}
      externalErrors={externalErrors}
      className="space-y-4"
    >
      {({ register, watch, formState: { errors, isSubmitting, isValid, isDirty } }) => {
        const selectedVehicleId = watch('vehicleId');
        const cargoWeight = watch('cargoWeight');
        
        const selectedVehicle = vehicles.find(v => v.id === selectedVehicleId);
        
        let capacityError = '';
        if (selectedVehicle && cargoWeight && Number(cargoWeight) > selectedVehicle.maxCapacity) {
          const exceeded = Number(cargoWeight) - selectedVehicle.maxCapacity;
          capacityError = `Capacity exceeded by ${exceeded.toFixed(1)} kg — dispatch blocked`;
        }

        const isFormValid = isValid && !capacityError && availableVehicles.length > 0 && eligibleDrivers.length > 0;

        return (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormRow label="Source" error={errors.source?.message as string} required id="source">
                <TextInput
                  {...register('source')}
                  id="source"
                  placeholder="Enter source location"
                  error={!!errors.source}
                />
              </FormRow>

              <FormRow label="Destination" error={errors.destination?.message as string} required id="destination">
                <TextInput
                  {...register('destination')}
                  id="destination"
                  placeholder="Enter destination"
                  error={!!errors.destination}
                />
              </FormRow>

              <FormRow label="Vehicle" error={errors.vehicleId?.message as string} required id="vehicleId">
                {availableVehicles.length === 0 ? (
                  <div className="flex items-center gap-2 p-2 bg-status-cancelled/10 text-status-cancelled rounded-md text-sm border border-status-cancelled/20">
                    <AlertCircle size={16} />
                    <span>No available vehicles.</span>
                  </div>
                ) : (
                  <SelectBox
                    {...register('vehicleId')}
                    id="vehicleId"
                    options={[{ value: '', label: 'Select a vehicle' }, ...vehicleOptions]}
                    error={!!errors.vehicleId}
                  />
                )}
              </FormRow>

              <FormRow label="Driver" error={errors.driverId?.message as string} required id="driverId">
                {eligibleDrivers.length === 0 ? (
                  <div className="flex items-center gap-2 p-2 bg-status-cancelled/10 text-status-cancelled rounded-md text-sm border border-status-cancelled/20">
                    <AlertCircle size={16} />
                    <span>No eligible drivers available.</span>
                  </div>
                ) : (
                  <SelectBox
                    {...register('driverId')}
                    id="driverId"
                    options={[{ value: '', label: 'Select a driver' }, ...driverOptions]}
                    error={!!errors.driverId}
                  />
                )}
              </FormRow>

              <FormRow label="Cargo Weight (kg)" error={capacityError || (errors.cargoWeight?.message as string)} required id="cargoWeight">
                <NumberInput
                  {...register('cargoWeight')}
                  id="cargoWeight"
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                  error={!!errors.cargoWeight || !!capacityError}
                />
              </FormRow>

              <FormRow label="Planned Distance (km)" error={errors.plannedDistance?.message as string} required id="plannedDistance">
                <NumberInput
                  {...register('plannedDistance')}
                  id="plannedDistance"
                  min="0"
                  step="0.1"
                  placeholder="0.0"
                  error={!!errors.plannedDistance}
                />
              </FormRow>
            </div>

            <div className="flex justify-end gap-3 pt-6 mt-6 border-t border-border-base">
              {onCancel && (
                <button
                  type="button"
                  onClick={onCancel}
                  className="px-4 py-2 rounded-lg text-sm font-medium transition-colors border border-border-base bg-bg-base text-text-base hover:bg-bg-card"
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
              )}
              <button
                type="submit"
                className="px-4 py-2 rounded-lg text-sm font-medium transition-colors border border-text-base bg-text-base text-bg-base hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                disabled={isSubmitting || !isDirty || !isFormValid}
              >
                {isSubmitting ? 'Dispatching...' : 'Dispatch Trip'}
              </button>
            </div>
          </>
        );
      }}
    </EntityForm>
  );
};
