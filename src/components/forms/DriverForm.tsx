import React, { useMemo } from 'react';
import { EntityForm, ApiFieldError } from './EntityForm';
import { driverSchema, DriverFormValues } from '../../schemas/validation';
import { FormRow, TextInput, DateInput, NumberInput, SelectBox } from '../ui/FormControls';
import { AlertTriangle } from 'lucide-react';

interface DriverFormProps {
  initialValues?: Partial<DriverFormValues>;
  onSubmit: (data: DriverFormValues) => Promise<void> | void;
  externalErrors?: ApiFieldError[];
  onCancel?: () => void;
}

const STATUS_OPTIONS = [
  { value: 'AVAILABLE', label: 'Available' },
  { value: 'ON_TRIP', label: 'On Trip' },
  { value: 'SUSPENDED', label: 'Suspended' },
];

export const DriverForm: React.FC<DriverFormProps> = ({
  initialValues,
  onSubmit,
  externalErrors,
  onCancel,
}) => {
  return (
    <EntityForm<DriverFormValues>
      schema={driverSchema}
      onSubmit={onSubmit}
      defaultValues={initialValues || { status: 'AVAILABLE' }}
      externalErrors={externalErrors}
      className="space-y-4"
    >
      {({ register, watch, formState: { errors, isSubmitting, isValid, isDirty } }) => {
        const licenseExpiry = watch('licenseExpiry');
        
        const isExpired = useMemo(() => {
          if (!licenseExpiry) return false;
          const selectedDate = new Date(licenseExpiry);
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          return selectedDate <= today;
        }, [licenseExpiry]);

        return (
          <>
            {isExpired && (
              <div className="flex items-center gap-2 p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <p>License has expired. Driver cannot be assigned to trips.</p>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormRow label="Name" error={errors.name?.message as string} required id="name">
                <TextInput
                  {...register('name')}
                  id="name"
                  placeholder="e.g. Rahul Sharma"
                  error={!!errors.name}
                />
              </FormRow>

              <FormRow label="License Number" error={errors.licenseNumber?.message as string} required id="licenseNumber">
                <TextInput
                  {...register('licenseNumber')}
                  id="licenseNumber"
                  placeholder="e.g. DL-14-2020-00123"
                  error={!!errors.licenseNumber}
                />
              </FormRow>

              <FormRow label="Category" error={errors.category?.message as string} required id="category">
                <TextInput
                  {...register('category')}
                  id="category"
                  placeholder="e.g. HMV"
                  error={!!errors.category}
                />
              </FormRow>

              <FormRow label="License Expiry" error={errors.licenseExpiry?.message as string} required id="licenseExpiry">
                <DateInput
                  {...register('licenseExpiry')}
                  id="licenseExpiry"
                  error={!!errors.licenseExpiry || isExpired}
                />
              </FormRow>

              <FormRow label="Contact Number" error={errors.contactNumber?.message as string} required id="contactNumber">
                <TextInput
                  {...register('contactNumber')}
                  id="contactNumber"
                  placeholder="e.g. 9876543210"
                  error={!!errors.contactNumber}
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

              <FormRow label="Safety Score (Optional)" error={errors.safetyScore?.message as string} id="safetyScore">
                <NumberInput
                  {...register('safetyScore')}
                  id="safetyScore"
                  placeholder="0 - 100"
                  error={!!errors.safetyScore}
                  min={0}
                  max={100}
                />
              </FormRow>

              <FormRow label="Trip Completion % (Optional)" error={errors.tripCompletionPct?.message as string} id="tripCompletionPct">
                <NumberInput
                  {...register('tripCompletionPct')}
                  id="tripCompletionPct"
                  placeholder="0 - 100"
                  error={!!errors.tripCompletionPct}
                  min={0}
                  max={100}
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
                {isSubmitting ? 'Saving...' : 'Save Driver'}
              </button>
            </div>
          </>
        );
      }}
    </EntityForm>
  );
};
