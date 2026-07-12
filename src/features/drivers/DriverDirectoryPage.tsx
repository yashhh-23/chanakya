/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {useState, useMemo, useCallback, memo} from 'react';
import {useData} from '../../contexts/DataContext';
import {useToast} from '../../contexts/ToastContext';
import {DataTable, Column} from '../../components/data-table/DataTable';
import {StatusPill, MetricCard} from '../../components/ui/StatusAndMetrics';
import {Modal} from '../../components/ui/Feedback';
import {EntityForm, ApiFieldError} from '../../components/forms/EntityForm';
import {
  FormRow,
  TextInput,
  DateInput,
  SelectBox
} from '../../components/ui/FormControls';
import {driverSchema, DriverFormValues} from '../../schemas/validation';
import {Driver, DriverStatus} from '../../types';
import {Plus, Users, UserCheck, Navigation, AlertTriangle} from 'lucide-react';

export const DriverDirectoryPage = memo(function DriverDirectoryPage() {
  const {drivers, addDriver} = useData();
  const {addToast} = useToast();

  // Modal Control
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [apiErrors, setApiErrors] = useState<ApiFieldError[]>([]);

  // Driver directory list statistics
  const driverStats = useMemo(() => {
    const total = drivers.length;
    const available = drivers.filter((d) => d.status === 'AVAILABLE').length;
    const onTrip = drivers.filter((d) => d.status === 'ON_TRIP').length;
    const suspended = drivers.filter((d) => d.status === 'SUSPENDED').length;
    return {total, available, onTrip, suspended};
  }, [drivers]);

  // Handle Form Submission
  const handleRegisterDriver = useCallback(async (values: DriverFormValues) => {
    setApiErrors([]);

    const newDriver: Driver = {
      name: values.name.trim(),
      licenseNumber: values.licenseNumber.trim().toUpperCase(),
      category: values.category,
      licenseExpiry: values.licenseExpiry,
      contactNumber: values.contactNumber.trim(),
      status: values.status as DriverStatus,
    };

    const result = await addDriver(newDriver);

    if (result.success) {
      addToast(
        'Driver Registered',
        `${newDriver.name} (${newDriver.licenseNumber}) registered successfully as ${newDriver.category}.`,
        'success'
      );
      setIsModalOpen(false);
    } else if (result.error) {
      setApiErrors([result.error]);
      addToast('Registration Failed', result.error.message, 'error');
    }
  }, [addDriver, addToast]);

  // Table Columns Definition
  const columns: Column<Driver>[] = useMemo(
    () => [
      {
        id: 'name',
        header: 'Driver Name',
        accessorKey: 'name',
        sortable: true,
        cell: (row) => (
          <div className="flex items-center gap-2.5">
            <div className="h-7 w-7 rounded-full bg-status-dispatched/10 flex items-center justify-center font-bold text-status-dispatched text-xs">
              {row.name.charAt(0)}
            </div>
            <span className="font-bold text-text-base">{row.name}</span>
          </div>
        ),
      },
      {
        id: 'licenseNumber',
        header: 'License Key',
        accessorKey: 'licenseNumber',
        sortable: true,
        cell: (row) => (
          <span className="font-mono font-bold text-text-base bg-bg-base px-2 py-0.5 rounded border border-border-base/50">
            {row.licenseNumber}
          </span>
        ),
      },
      {
        id: 'category',
        header: 'Classification',
        accessorKey: 'category',
        sortable: true,
      },
      {
        id: 'licenseExpiry',
        header: 'Expiry Date',
        accessorKey: 'licenseExpiry',
        sortable: true,
        cell: (row) => {
          const expDate = new Date(row.licenseExpiry);
          const isExpiringSoon = expDate.getTime() - new Date().getTime() < 30 * 24 * 60 * 60 * 1000;
          return (
            <span className={`font-medium ${isExpiringSoon ? 'text-status-inshop font-bold' : ''}`}>
              {row.licenseExpiry}
              {isExpiringSoon && ' (Expiring soon)'}
            </span>
          );
        },
      },
      {
        id: 'contactNumber',
        header: 'Mobile Contact',
        accessorKey: 'contactNumber',
        sortable: true,
        cell: (row) => <span className="font-mono">{row.contactNumber}</span>,
      },
      {
        id: 'status',
        header: 'Duty Status',
        accessorKey: 'status',
        sortable: true,
        cell: (row) => <StatusPill status={row.status} size="sm" />,
      },
    ],
    []
  );

  return (
    <div className="space-y-6 select-none">
      
      {/* Upper header section */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold tracking-tight font-display text-text-base">Driver Directory</h2>
          <p className="text-xs text-text-muted mt-0.5">Personnel manager database of commercial licensed operators and dispatch crew.</p>
        </div>
        
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center justify-center gap-2 h-9 px-4 w-full sm:w-auto text-xs font-bold bg-status-dispatched text-white hover:bg-opacity-95 shadow-sm shadow-status-dispatched/20 rounded-lg transition-all"
        >
          <Plus size={16} />
          <span>Register Driver</span>
        </button>
      </div>

      {/* Grid of driver statistics cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <MetricCard
          label="Total Operators"
          value={driverStats.total}
          icon={<Users size={16} />}
        />
        <MetricCard
          label="Available Standby"
          value={driverStats.available}
          icon={<UserCheck size={16} className="text-status-available" />}
        />
        <MetricCard
          label="Active Transiting"
          value={driverStats.onTrip}
          icon={<Navigation size={16} className="text-status-ontrip" />}
        />
        <MetricCard
          label="Credentials Suspended"
          value={driverStats.suspended}
          icon={<AlertTriangle size={16} className="text-status-inshop" />}
        />
      </div>

      {/* DataTable listing drivers */}
      <div className="h-[400px]">
        <DataTable<Driver>
          columns={columns}
          data={drivers}
          searchKey="name"
          searchPlaceholder="Search operator by name..."
          pageSize={8}
        />
      </div>

      {/* Driver Registration Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setApiErrors([]);
        }}
        title="Register Commercial Operator"
        size="lg"
      >
        <EntityForm<DriverFormValues>
          schema={driverSchema}
          onSubmit={handleRegisterDriver}
          externalErrors={apiErrors}
          defaultValues={{
            name: '',
            licenseNumber: '',
            category: 'Class A CDL',
            licenseExpiry: '',
            contactNumber: '',
            status: 'AVAILABLE',
          }}
        >
          {({register, formState: {errors, isSubmitting}}) => (
            <div className="space-y-4">
              
              <FormRow label="Full Operator Name" error={errors.name?.message} required>
                <TextInput
                  {...register('name')}
                  placeholder="e.g. Rohan Sharma"
                  error={!!errors.name}
                />
              </FormRow>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-5">
                <FormRow label="Commercial License Number" error={errors.licenseNumber?.message} required>
                  <TextInput
                    {...register('licenseNumber')}
                    placeholder="e.g. MH0420150089221"
                    error={!!errors.licenseNumber}
                  />
                </FormRow>

                <FormRow label="License Classification" error={errors.category?.message} required>
                  <SelectBox
                    {...register('category')}
                    error={!!errors.category}
                    options={[
                      {value: 'Class A CDL', label: 'Class A CDL (Heavy Combinations)'},
                      {value: 'Class B CDL', label: 'Class B CDL (Heavy Rigid)'},
                      {value: 'Heavy Rigid License', label: 'Heavy Rigid License'},
                      {value: 'Light Rigid License', label: 'Light Rigid License'},
                    ]}
                  />
                </FormRow>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-5">
                <FormRow label="License Expiry Date" error={errors.licenseExpiry?.message} required>
                  <DateInput
                    {...register('licenseExpiry')}
                    error={!!errors.licenseExpiry}
                  />
                </FormRow>

                <FormRow label="Mobile Phone Contact" error={errors.contactNumber?.message} required>
                  <TextInput
                    {...register('contactNumber')}
                    placeholder="e.g. +919876543210"
                    error={!!errors.contactNumber}
                  />
                </FormRow>
              </div>

              <FormRow label="Initial Assignment Status" error={errors.status?.message} required>
                <SelectBox
                  {...register('status')}
                  error={!!errors.status}
                  options={[
                    {value: 'AVAILABLE', label: 'Available (Standby Duty)'},
                    {value: 'ON_TRIP', label: 'On Active Transit'},
                    {value: 'SUSPENDED', label: 'Suspended'},
                  ]}
                />
              </FormRow>

              {/* Action layout in driver registration modal */}
              <div className="flex items-center justify-end gap-3 pt-5 border-t border-border-base mt-6">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  disabled={isSubmitting}
                  className="h-9 px-4 text-xs font-bold border border-border-base hover:bg-bg-base/50 text-text-base rounded-lg transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="h-9 px-4 text-xs font-bold bg-status-dispatched text-white hover:bg-opacity-95 rounded-lg shadow-sm shadow-status-dispatched/20 transition-all flex items-center gap-2"
                >
                  {isSubmitting ? 'Registering...' : 'Register Crew Member'}
                </button>
              </div>

            </div>
          )}
        </EntityForm>
      </Modal>

    </div>
  );
});

