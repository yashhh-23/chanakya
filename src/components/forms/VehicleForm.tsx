import React from 'react';
import { EntityForm, ApiFieldError } from './EntityForm';
import { vehicleSchema, VehicleFormValues } from '../../schemas/validation';
import { FormRow, TextInput, NumberInput, SelectBox } from '../ui/FormControls';

interface VehicleFormProps {
  initialValues?: Partial<VehicleFormValues>;
  onSubmit: (data: VehicleFormValues) => Promise<void> | void;
  externalErrors?: ApiFieldError[];
  onCancel?: () => void;
}

const STATUS_OPTIONS = [
  { value: 'AVAILABLE', label: 'Available' },
  { value: 'ON_TRIP', label: 'On Trip' },
  { value: 'DISPATCHED', label: 'Dispatched' },
  { value: 'IN_SHOP', label: 'In Shop' },
  { value: 'SUSPENDED', label: 'Suspended' },
  { value: 'RETIRED', label: 'Retired' },
];

export const VehicleForm: React.FC<VehicleFormProps> = ({
  initialValues,
  onSubmit,
  externalErrors,
  onCancel,
}) => {
  return (
    <EntityForm<VehicleFormValues>
      schema={vehicleSchema}
      onSubmit={onSubmit}
      defaultValues={initialValues || { status: 'AVAILABLE' }}
      externalErrors={externalErrors}
      className="space-y-4"
    >
      {({ register, formState: { errors, isSubmitting, isValid, isDirty } }) => (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormRow label="Registration Number" error={errors.regNumber?.message as string} required id="regNumber">
              <TextInput
                {...register('regNumber')}
                id="regNumber"
                placeholder="e.g. MH-04-EX-8891"
                error={!!errors.regNumber}
              />
            </FormRow>

            <FormRow label="Name/Model" error={errors.name?.message as string} required id="name">
              <TextInput
                {...register('name')}
                id="name"
                placeholder="e.g. Volvo B11R"
                error={!!errors.name}
              />
            </FormRow>

            <FormRow label="Vehicle Type" error={errors.type?.message as string} required id="type">
              <TextInput
                {...register('type')}
                id="type"
                placeholder="e.g. Bus, Truck"
                error={!!errors.type}
              />
            </FormRow>

            <FormRow label="Max Capacity" error={errors.maxCapacity?.message as string} required id="maxCapacity">
              <NumberInput
                {...register('maxCapacity')}
                id="maxCapacity"
                placeholder="e.g. 40"
                error={!!errors.maxCapacity}
              />
            </FormRow>

            <FormRow label="Odometer" error={errors.odometer?.message as string} required id="odometer">
              <NumberInput
                {...register('odometer')}
                id="odometer"
                placeholder="e.g. 15000"
                error={!!errors.odometer}
              />
            </FormRow>

            <FormRow label="Acquisition Cost" error={errors.acquisitionCost?.message as string} required id="acquisitionCost">
              <NumberInput
                {...register('acquisitionCost')}
                id="acquisitionCost"
                placeholder="e.g. 500000"
                error={!!errors.acquisitionCost}
              />
            </FormRow>

            <FormRow label="Region" error={errors.region?.message as string} required id="region">
              <TextInput
                {...register('region')}
                id="region"
                placeholder="e.g. North"
                error={!!errors.region}
              />
            </FormRow>

            <FormRow label="Status" error={errors.status?.message as string} id="status">
              <SelectBox
                {...register('status')}
                id="status"
                options={STATUS_OPTIONS}
                error={!!errors.status}
              />
            </FormRow>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-border-base mt-6">
            {onCancel && (
              <button
                type="button"
                onClick={onCancel}
                className="px-4 py-2 text-sm font-medium text-text-base bg-transparent hover:bg-bg-surface-hover rounded-md transition-colors"
                disabled={isSubmitting}
              >
                Cancel
              </button>
            )}
            <button
              type="submit"
              disabled={isSubmitting || !isValid || (!isDirty && !initialValues)}
              className="px-4 py-2 text-sm font-medium text-white bg-primary-base hover:bg-primary-hover disabled:opacity-50 disabled:cursor-not-allowed rounded-md shadow-sm transition-colors"
            >
              {isSubmitting ? 'Saving...' : 'Save Vehicle'}
            </button>
          </div>
        </>
      )}
    </EntityForm>
  );
};
