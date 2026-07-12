/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {useState, useMemo, useCallback, memo} from 'react';
import {useData} from '../../contexts/DataContext';
import {useToast} from '../../contexts/ToastContext';
import {DataTable, Column} from '../../components/data-table/DataTable';
import {StatusPill} from '../../components/ui/StatusAndMetrics';
import {Modal} from '../../components/ui/Feedback';
import {EntityForm, ApiFieldError} from '../../components/forms/EntityForm';
import {
  FormRow,
  TextInput,
  NumberInput,
  SelectBox
} from '../../components/ui/FormControls';
import {vehicleSchema, VehicleFormValues} from '../../schemas/validation';
import {Vehicle, VehicleStatus} from '../../types';
import {Plus, Download, Filter, RefreshCw} from 'lucide-react';

export const VehicleRegistryPage = memo(function VehicleRegistryPage() {
  const {vehicles, addVehicle} = useData();
  const {addToast} = useToast();

  // Dialog Controls
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Filters state
  const [filterType, setFilterType] = useState<string>('ALL');
  const [filterRegion, setFilterRegion] = useState<string>('ALL');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');

  // Server error container for form
  const [apiErrors, setApiErrors] = useState<ApiFieldError[]>([]);

  // Unique types, regions, statuses for filter list
  const vehicleTypes = useMemo(() => {
    const types = new Set(vehicles.map((v) => v.type));
    return ['ALL', ...Array.from(types)];
  }, [vehicles]);

  const vehicleRegions = useMemo(() => {
    const regions = new Set(vehicles.map((v) => v.region));
    return ['ALL', ...Array.from(regions)];
  }, [vehicles]);

  const vehicleStatuses = useMemo(() => {
    const statuses = new Set(vehicles.map((v) => v.status));
    return ['ALL', ...Array.from(statuses)];
  }, [vehicles]);

  // Handle Form Submission
  const handleRegisterVehicle = useCallback(async (values: VehicleFormValues) => {
    setApiErrors([]);
    
    const newVehicle: Vehicle = {
      regNumber: values.regNumber.trim().toUpperCase(),
      name: values.name.trim(),
      type: values.type,
      maxCapacity: Number(values.maxCapacity),
      odometer: Number(values.odometer),
      acquisitionCost: Number(values.acquisitionCost),
      region: values.region,
      status: values.status as VehicleStatus,
    };

    const result = await addVehicle(newVehicle);
    
    if (result.success) {
      addToast(
        'Vehicle Registered',
        `${newVehicle.name} (${newVehicle.regNumber}) registered successfully onto ${newVehicle.region}.`,
        'success'
      );
      setIsModalOpen(false);
    } else if (result.error) {
      setApiErrors([result.error]);
      addToast('Registration Failed', result.error.message, 'error');
    }
  }, [addVehicle, addToast]);

  // Filter core vehicle database
  const filteredVehicles = useMemo(() => {
    return vehicles.filter((v) => {
      const matchType = filterType === 'ALL' || v.type === filterType;
      const matchRegion = filterRegion === 'ALL' || v.region === filterRegion;
      const matchStatus = filterStatus === 'ALL' || v.status === filterStatus;
      return matchType && matchRegion && matchStatus;
    });
  }, [vehicles, filterType, filterRegion, filterStatus]);

  // Table Columns Definition
  const columns: Column<Vehicle>[] = useMemo(
    () => [
      {
        id: 'regNumber',
        header: 'Registration',
        accessorKey: 'regNumber',
        sortable: true,
        cell: (row) => (
          <span className="font-mono font-bold tracking-wider text-text-base bg-bg-base px-2 py-1 rounded-md border border-border-base/50">
            {row.regNumber}
          </span>
        ),
      },
      {
        id: 'name',
        header: 'Name',
        accessorKey: 'name',
        sortable: true,
      },
      {
        id: 'type',
        header: 'Classification',
        accessorKey: 'type',
        sortable: true,
      },
      {
        id: 'maxCapacity',
        header: 'Max Payload',
        accessorKey: 'maxCapacity',
        sortable: true,
        cell: (row) => <span>{row.maxCapacity.toLocaleString()} kg</span>,
      },
      {
        id: 'odometer',
        header: 'Odometer',
        accessorKey: 'odometer',
        sortable: true,
        cell: (row) => <span className="font-mono">{row.odometer.toLocaleString()} km</span>,
      },
      {
        id: 'acquisitionCost',
        header: 'CapEx Cost',
        accessorKey: 'acquisitionCost',
        sortable: true,
        cell: (row) => <span>${row.acquisitionCost.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>,
      },
      {
        id: 'region',
        header: 'Region Hub',
        accessorKey: 'region',
        sortable: true,
      },
      {
        id: 'status',
        header: 'Status',
        accessorKey: 'status',
        sortable: true,
        cell: (row) => <StatusPill status={row.status} size="sm" />,
      },
    ],
    []
  );

  return (
    <div className="space-y-6 select-none">
      
      {/* Top action block */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold tracking-tight font-display text-text-base">Vehicle Registry</h2>
          <p className="text-xs text-text-muted mt-0.5">Asset manager directory of high-capacity cargo trucks and transport vans.</p>
        </div>
        
        <div className="flex items-center gap-2.5 w-full sm:w-auto">
          <button
            onClick={() => {
              setFilterType('ALL');
              setFilterRegion('ALL');
              setFilterStatus('ALL');
            }}
            className="p-2 border border-border-base bg-bg-surface hover:bg-bg-base/50 text-text-muted rounded-lg transition-all"
            title="Reset Filters"
          >
            <RefreshCw size={16} />
          </button>
          
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center justify-center gap-2 h-9 px-4 text-xs font-bold bg-status-dispatched text-white hover:bg-opacity-95 shadow-sm shadow-status-dispatched/20 rounded-lg transition-all"
          >
            <Plus size={16} />
            <span>Add Vehicle</span>
          </button>
        </div>
      </div>

      {/* Filter panel */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-bg-card border border-border-base rounded-xl p-4 shadow-xs">
        <div>
          <label className="block text-[10px] font-bold uppercase text-text-muted mb-1.5">Filter by Classification</label>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="w-full h-9 px-2 bg-bg-surface border border-border-base rounded-lg text-xs font-medium text-text-base outline-none focus-visible:ring-1 focus-visible:ring-status-dispatched cursor-pointer"
          >
            {vehicleTypes.map((t) => (
              <option key={t} value={t}>{t === 'ALL' ? 'All Classifications' : t}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-[10px] font-bold uppercase text-text-muted mb-1.5">Filter by Hub Region</label>
          <select
            value={filterRegion}
            onChange={(e) => setFilterRegion(e.target.value)}
            className="w-full h-9 px-2 bg-bg-surface border border-border-base rounded-lg text-xs font-medium text-text-base outline-none focus-visible:ring-1 focus-visible:ring-status-dispatched cursor-pointer"
          >
            {vehicleRegions.map((r) => (
              <option key={r} value={r}>{r === 'ALL' ? 'All Regions' : r}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-[10px] font-bold uppercase text-text-muted mb-1.5">Filter by Operational Status</label>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="w-full h-9 px-2 bg-bg-surface border border-border-base rounded-lg text-xs font-medium text-text-base outline-none focus-visible:ring-1 focus-visible:ring-status-dispatched cursor-pointer"
          >
            {vehicleStatuses.map((s) => (
              <option key={s} value={s}>{s === 'ALL' ? 'All Statuses' : s}</option>
            ))}
          </select>
        </div>
      </div>

      {/* DataTable Container */}
      <div className="h-[480px]">
        <DataTable<Vehicle>
          columns={columns}
          data={filteredVehicles}
          searchKey="name"
          searchPlaceholder="Search vehicles by name..."
          pageSize={8}
        />
      </div>

      {/* Register Vehicle Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setApiErrors([]);
        }}
        title="Register Fleet Asset"
        size="lg"
      >
        <EntityForm<VehicleFormValues>
          schema={vehicleSchema}
          onSubmit={handleRegisterVehicle}
          externalErrors={apiErrors}
          defaultValues={{
            regNumber: '',
            name: '',
            type: 'Truck',
            maxCapacity: 1500,
            odometer: 0,
            acquisitionCost: 100000,
            region: 'West-Zone',
            status: 'AVAILABLE',
          }}
        >
          {({register, formState: {errors, isSubmitting}}) => (
            <div className="space-y-4">
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-5">
                <FormRow label="Registration Number" error={errors.regNumber?.message} required>
                  <TextInput
                    {...register('regNumber')}
                    placeholder="e.g. MH-04-EX-8891"
                    error={!!errors.regNumber}
                  />
                </FormRow>

                <FormRow label="Vehicle Name / Model" error={errors.name?.message} required>
                  <TextInput
                    {...register('name')}
                    placeholder="e.g. Tata Ultra T.7"
                    error={!!errors.name}
                  />
                </FormRow>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-5">
                <FormRow label="Vehicle Classification Type" error={errors.type?.message} required>
                  <SelectBox
                    {...register('type')}
                    error={!!errors.type}
                    options={[
                      {value: 'Truck', label: 'Truck'},
                      {value: 'Heavy Truck', label: 'Heavy Truck'},
                      {value: 'Cargo Van', label: 'Cargo Van'},
                      {value: 'Light Cargo Van', label: 'Light Cargo Van'},
                    ]}
                  />
                </FormRow>

                <FormRow label="Payload capacity (kg)" error={errors.maxCapacity?.message} required>
                  <NumberInput
                    {...register('maxCapacity')}
                    placeholder="e.g. 3500"
                    error={!!errors.maxCapacity}
                    min="1"
                  />
                </FormRow>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-5">
                <FormRow label="Odometer Reading (km)" error={errors.odometer?.message} required>
                  <NumberInput
                    {...register('odometer')}
                    placeholder="e.g. 45000"
                    error={!!errors.odometer}
                    min="0"
                  />
                </FormRow>

                <FormRow label="Acquisition Cost (CapEx USD)" error={errors.acquisitionCost?.message} required>
                  <NumberInput
                    {...register('acquisitionCost')}
                    placeholder="e.g. 1850000"
                    error={!!errors.acquisitionCost}
                    min="1"
                  />
                </FormRow>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-5">
                <FormRow label="Assigned Region Hub" error={errors.region?.message} required>
                  <SelectBox
                    {...register('region')}
                    error={!!errors.region}
                    options={[
                      {value: 'West-Zone', label: 'West-Zone'},
                      {value: 'North-Zone', label: 'North-Zone'},
                      {value: 'South-Zone', label: 'South-Zone'},
                      {value: 'East-Zone', label: 'East-Zone'},
                    ]}
                  />
                </FormRow>

                <FormRow label="Operational Status" error={errors.status?.message} required>
                  <SelectBox
                    {...register('status')}
                    error={!!errors.status}
                    options={[
                      {value: 'AVAILABLE', label: 'Available'},
                      {value: 'ON_TRIP', label: 'On Trip'},
                      {value: 'DISPATCHED', label: 'Dispatched'},
                      {value: 'IN_SHOP', label: 'In Shop'},
                      {value: 'SUSPENDED', label: 'Suspended'},
                      {value: 'RETIRED', label: 'Retired'},
                    ]}
                  />
                </FormRow>
              </div>

              {/* Action row in modal form */}
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
                  {isSubmitting ? 'Registering...' : 'Confirm Registration'}
                </button>
              </div>

            </div>
          )}
        </EntityForm>
      </Modal>

    </div>
  );
});

