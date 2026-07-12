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
import {Plus, Users, UserCheck, Navigation, AlertTriangle, RefreshCw, Edit, ShieldAlert} from 'lucide-react';

export const DriverDirectoryPage = memo(function DriverDirectoryPage() {
  const {drivers, addDriver, updateDriver} = useData();
  const {addToast} = useToast();

  // Modal Control
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDriver, setEditingDriver] = useState<Driver | null>(null);
  const [apiErrors, setApiErrors] = useState<ApiFieldError[]>([]);

  // Filter States
  const [filterCategory, setFilterCategory] = useState<string>('ALL');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');

  // Driver directory list statistics
  const driverStats = useMemo(() => {
    const total = drivers.length;
    const available = drivers.filter((d) => d.status === 'AVAILABLE').length;
    const onTrip = drivers.filter((d) => d.status === 'ON_TRIP').length;
    const suspended = drivers.filter((d) => d.status === 'SUSPENDED').length;
    return {total, available, onTrip, suspended};
  }, [drivers]);

  // Unique categories and statuses for filter dropdowns
  const driverCategories = useMemo(() => {
    const categories = new Set(drivers.map((d) => d.category));
    return ['ALL', ...Array.from(categories)];
  }, [drivers]);

  const driverStatuses = useMemo(() => {
    const statuses = new Set(drivers.map((d) => d.status));
    return ['ALL', ...Array.from(statuses)];
  }, [drivers]);

  // Filtered driver list
  const filteredDrivers = useMemo(() => {
    return drivers.filter((d) => {
      const matchCategory = filterCategory === 'ALL' || d.category === filterCategory;
      const matchStatus = filterStatus === 'ALL' || d.status === filterStatus;
      return matchCategory && matchStatus;
    });
  }, [drivers, filterCategory, filterStatus]);

  // Handle Register Driver
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

  // Handle Update Driver & Status Change
  const handleUpdateDriver = useCallback(async (values: DriverFormValues) => {
    if (!editingDriver || !editingDriver.id) return;
    setApiErrors([]);

    const updatedData: Partial<Driver> = {
      name: values.name.trim(),
      licenseNumber: values.licenseNumber.trim().toUpperCase(),
      category: values.category,
      licenseExpiry: values.licenseExpiry,
      contactNumber: values.contactNumber.trim(),
      status: values.status as DriverStatus,
    };

    const result = await updateDriver(editingDriver.id, updatedData);

    if (result.success) {
      addToast(
        'Driver Updated',
        `Operator ${values.name} profile and duty status updated successfully.`,
        'success'
      );
      setEditingDriver(null);
    } else if (result.error) {
      setApiErrors([result.error]);
      addToast('Update Failed', result.error.message, 'error');
    }
  }, [editingDriver, updateDriver, addToast]);

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
          const now = new Date();
          now.setHours(0, 0, 0, 0);
          const isExpired = expDate < now;
          const isExpiringSoon = !isExpired && expDate.getTime() - now.getTime() < 30 * 24 * 60 * 60 * 1000;
          return (
            <div className="flex items-center gap-1.5">
              <span className={`font-medium ${isExpired ? 'text-red-500 font-bold' : isExpiringSoon ? 'text-status-inshop font-bold' : ''}`}>
                {row.licenseExpiry}
                {isExpired && ' (Expired)'}
                {isExpiringSoon && ' (Expiring soon)'}
              </span>
              {isExpired && (
                <span title="Expired License - Compliance Block">
                  <ShieldAlert size={14} className="text-red-500" />
                </span>
              )}
            </div>
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
      {
        id: 'actions',
        header: 'Actions',
        accessorKey: 'id',
        sortable: false,
        cell: (row) => (
          <button
            onClick={() => {
              setEditingDriver(row);
              setApiErrors([]);
            }}
            className="p-1.5 hover:bg-bg-base rounded-md text-text-muted hover:text-text-base transition-colors flex items-center gap-1.5 text-xs font-semibold border border-transparent hover:border-border-base/60"
            title="Edit Operator & Duty Status"
          >
            <Edit size={14} />
            <span>Manage</span>
          </button>
        ),
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
        
        <div className="flex items-center gap-2.5 w-full sm:w-auto">
          <button
            onClick={() => {
              setFilterCategory('ALL');
              setFilterStatus('ALL');
            }}
            className="p-2 border border-border-base bg-bg-surface hover:bg-bg-base/50 text-text-muted rounded-lg transition-all"
            title="Reset Filters"
          >
            <RefreshCw size={16} />
          </button>
          
          <button
            onClick={() => {
              setIsModalOpen(true);
              setApiErrors([]);
            }}
            className="flex items-center justify-center gap-2 h-9 px-4 w-full sm:w-auto text-xs font-bold bg-status-dispatched text-white hover:bg-opacity-95 shadow-sm shadow-status-dispatched/20 rounded-lg transition-all"
          >
            <Plus size={16} />
            <span>Register Driver</span>
          </button>
        </div>
      </div>

      {/* Filter panel */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-bg-card border border-border-base rounded-xl p-4 shadow-xs">
        <div>
          <label className="block text-[10px] font-bold uppercase text-text-muted mb-1.5">Filter by Classification</label>
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="w-full h-9 px-2 bg-bg-surface border border-border-base rounded-lg text-xs font-medium text-text-base outline-none focus-visible:ring-1 focus-visible:ring-status-dispatched cursor-pointer"
          >
            {driverCategories.map((c) => (
              <option key={c} value={c}>{c === 'ALL' ? 'All Classifications' : c}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-[10px] font-bold uppercase text-text-muted mb-1.5">Filter by Duty Status</label>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="w-full h-9 px-2 bg-bg-surface border border-border-base rounded-lg text-xs font-medium text-text-base outline-none focus-visible:ring-1 focus-visible:ring-status-dispatched cursor-pointer"
          >
            {driverStatuses.map((s) => (
              <option key={s} value={s}>{s === 'ALL' ? 'All Duty Statuses' : s}</option>
            ))}
          </select>
        </div>
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
          data={filteredDrivers}
          searchKey="name"
          searchPlaceholder="Search operator by name or license..."
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

      {/* Driver Edit Modal */}
      <Modal
        isOpen={!!editingDriver}
        onClose={() => {
          setEditingDriver(null);
          setApiErrors([]);
        }}
        title="Manage Commercial Operator & Duty Status"
        size="lg"
      >
        {editingDriver && (
          <EntityForm<DriverFormValues>
            schema={driverSchema}
            onSubmit={handleUpdateDriver}
            externalErrors={apiErrors}
            defaultValues={{
              name: editingDriver.name,
              licenseNumber: editingDriver.licenseNumber,
              category: editingDriver.category,
              licenseExpiry: editingDriver.licenseExpiry,
              contactNumber: editingDriver.contactNumber || '',
              status: editingDriver.status,
            }}
          >
            {({register, formState: {errors, isSubmitting}}) => (
              <div className="space-y-4">
                <div className="p-3 bg-bg-surface border border-border-base rounded-lg text-xs text-text-muted">
                  Update operator credentials or duty status below. Changing duty status to <strong className="text-status-available">AVAILABLE</strong> or <strong className="text-status-ontrip">ON_TRIP</strong> will run automated compliance checks against license expiration and suspension history.
                </div>

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

                <FormRow label="Operational Duty Status" error={errors.status?.message} required>
                  <SelectBox
                    {...register('status')}
                    error={!!errors.status}
                    options={[
                      {value: 'AVAILABLE', label: 'Available (Standby Duty)'},
                      {value: 'ON_TRIP', label: 'On Active Transit'},
                      {value: 'OFF_DUTY', label: 'Off Duty'},
                      {value: 'SUSPENDED', label: 'Suspended'},
                    ]}
                  />
                </FormRow>

                <div className="flex items-center justify-end gap-3 pt-5 border-t border-border-base mt-6">
                  <button
                    type="button"
                    onClick={() => setEditingDriver(null)}
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
                    {isSubmitting ? 'Updating...' : 'Save Profile & Status'}
                  </button>
                </div>

              </div>
            )}
          </EntityForm>
        )}
      </Modal>

    </div>
  );
});
