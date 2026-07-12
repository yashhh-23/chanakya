/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useMemo, useCallback, memo } from 'react';
import { useData } from '../../contexts/DataContext';
import { useToast } from '../../contexts/ToastContext';
import { DataTable, Column } from '../../components/data-table/DataTable';
import { StatusPill, MetricCard, SpinnerCircular } from '../../components/ui/StatusAndMetrics';
import { Modal } from '../../components/ui/Feedback';
import { EntityForm, ApiFieldError } from '../../components/forms/EntityForm';
import { FormRow, TextInput, DateInput, SelectBox } from '../../components/ui/FormControls';
import { maintenanceSchema, MaintenanceFormValues } from '../../schemas/validation';
import { MaintenanceLog } from '../../types';
import { Wrench, Plus, RefreshCw, ClipboardList, CheckCircle2, DollarSign, AlertCircle, Clock } from 'lucide-react';

export const MaintenancePage = memo(function MaintenancePage() {
  const {
    maintenanceLogs,
    vehicles,
    loading,
    error,
    addMaintenance,
    closeMaintenanceLog,
    refreshData,
  } = useData();
  const { addToast } = useToast();

  // State controls
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [apiErrors, setApiErrors] = useState<ApiFieldError[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [lastRefreshed, setLastRefreshed] = useState<string>(new Date().toLocaleTimeString());

  // Statistics
  const stats = useMemo(() => {
    const total = maintenanceLogs.length;
    const openLogs = maintenanceLogs.filter((log) => log.isOpen).length;
    const totalCost = maintenanceLogs.reduce((sum, log) => sum + log.cost, 0);
    return { total, openLogs, totalCost };
  }, [maintenanceLogs]);

  // Filtered maintenance list
  const filteredLogs = useMemo(() => {
    return maintenanceLogs.filter((log) => {
      if (statusFilter === 'OPEN') return log.isOpen;
      if (statusFilter === 'CLOSED') return !log.isOpen;
      return true;
    });
  }, [maintenanceLogs, statusFilter]);

  // Filter eligible vehicles for maintenance picker (AVAILABLE only)
  const eligibleVehicles = useMemo(() => {
    return vehicles.filter((v) => v.status === 'AVAILABLE');
  }, [vehicles]);

  const handleRefresh = useCallback(async () => {
    await refreshData();
    setLastRefreshed(new Date().toLocaleTimeString());
  }, [refreshData]);

  // Handle Maintenance Logging
  const handleLogMaintenance = useCallback(async (values: MaintenanceFormValues) => {
    setApiErrors([]);
    const result = await addMaintenance({
      vehicleId: values.vehicleId,
      description: values.description.trim(),
      cost: Number(values.cost),
      date: values.date,
    });

    if (result.success) {
      addToast(
        'Maintenance Logged',
        'Active maintenance record registered and vehicle transitioned to In Shop.',
        'success'
      );
      setIsModalOpen(false);
      setLastRefreshed(new Date().toLocaleTimeString());
    } else if (result.error) {
      setApiErrors([result.error]);
      addToast('Logging Failed', result.error.message, 'error');
    }
  }, [addMaintenance, addToast]);

  // Handle Maintenance Closure
  const handleCloseMaintenance = useCallback(async (id: string) => {
    const result = await closeMaintenanceLog(id);
    if (result.success) {
      addToast(
        'Maintenance Closed',
        'Service record closed. Vehicle transitioned back to Available.',
        'success'
      );
      setLastRefreshed(new Date().toLocaleTimeString());
    } else if (result.error) {
      addToast('Closure Failed', result.error.message, 'error');
    }
  }, [closeMaintenanceLog, addToast]);

  // Table Columns
  const columns: Column<MaintenanceLog>[] = useMemo(
    () => [
      {
        id: 'vehicle',
        header: 'Vehicle',
        accessorKey: 'vehicleId',
        sortable: true,
        cell: (row) => (
          <div>
            <span className="font-bold text-text-base block">
              {row.vehicle?.name || 'Unknown Vehicle'}
            </span>
            <span className="font-mono text-[10px] font-semibold text-text-muted uppercase tracking-wider">
              {row.vehicle?.regNumber || 'N/A'}
            </span>
          </div>
        ),
      },
      {
        id: 'description',
        header: 'Service Description',
        accessorKey: 'description',
        sortable: true,
        cell: (row) => <span className="text-text-base font-medium">{row.description}</span>,
      },
      {
        id: 'cost',
        header: 'Cost',
        accessorKey: 'cost',
        sortable: true,
        cell: (row) => (
          <span className="font-mono font-bold text-text-base">
            ${row.cost.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </span>
        ),
      },
      {
        id: 'startDate',
        header: 'Start Date',
        accessorKey: 'startDate',
        sortable: true,
        cell: (row) => <span className="font-mono text-xs">{row.startDate}</span>,
      },
      {
        id: 'endDate',
        header: 'End Date',
        accessorKey: 'endDate',
        sortable: true,
        cell: (row) => (
          <span className="font-mono text-xs text-text-muted">{row.endDate || '—'}</span>
        ),
      },
      {
        id: 'isOpen',
        header: 'Status',
        accessorKey: 'isOpen',
        sortable: true,
        cell: (row) => {
          return row.isOpen ? (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-500 border border-amber-500/20">
              <Clock size={10} />
              <span>OPEN</span>
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
              <CheckCircle2 size={10} />
              <span>CLOSED</span>
            </span>
          );
        },
      },
      {
        id: 'actions',
        header: 'Actions',
        accessorKey: 'id',
        sortable: false,
        cell: (row) => {
          if (!row.isOpen) return null;
          return (
            <button
              onClick={() => handleCloseMaintenance(row.id)}
              className="px-2.5 py-1 text-[11px] font-bold rounded-lg border border-emerald-500/30 hover:border-emerald-500 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 transition-all"
            >
              Close Record
            </button>
          );
        },
      },
    ],
    [handleCloseMaintenance]
  );

  if (loading && maintenanceLogs.length === 0) {
    return (
      <div className="h-[400px] flex flex-col items-center justify-center gap-3">
        <SpinnerCircular size="lg" />
        <p className="text-sm text-text-muted">Loading maintenance schedule...</p>
      </div>
    );
  }

  if (error && maintenanceLogs.length === 0) {
    return (
      <div className="h-[400px] flex flex-col items-center justify-center gap-3 border border-red-500/20 bg-red-500/5 rounded-xl p-6">
        <AlertCircle size={32} className="text-red-500" />
        <h3 className="text-sm font-bold text-text-base">System Error</h3>
        <p className="text-xs text-text-muted text-center max-w-sm">{error}</p>
        <button
          onClick={handleRefresh}
          className="mt-2 px-3 py-1.5 text-xs font-bold bg-bg-surface border border-border-base text-text-base rounded-lg hover:bg-bg-base/40 flex items-center gap-1.5"
        >
          <RefreshCw size={12} />
          <span>Retry Connection</span>
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 select-none">
      {/* Header Panel */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold tracking-tight font-display text-text-base">
            Fleet Maintenance
          </h2>
          <p className="text-xs text-text-muted mt-0.5">
            Manage service schedules, transition fleet status, and audit active repairs.
          </p>
        </div>

        <div className="flex items-center gap-2.5 w-full sm:w-auto">
          <span className="text-[10px] font-bold text-text-muted mr-1.5">
            Last updated: {lastRefreshed}
          </span>
          <button
            onClick={handleRefresh}
            className="p-2 border border-border-base bg-bg-surface hover:bg-bg-base/50 text-text-muted rounded-lg transition-all"
            title="Refresh Data"
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
            <span>Log Service Record</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <MetricCard
          label="Total Service Logs"
          value={stats.total}
          icon={<ClipboardList size={16} />}
        />
        <MetricCard
          label="Vehicles In Shop (Open)"
          value={stats.openLogs}
          icon={<Wrench size={16} className="text-amber-500" />}
        />
        <MetricCard
          label="Accumulated Cost"
          value={`$${stats.totalCost.toLocaleString(undefined, { maximumFractionDigits: 0 })}`}
          icon={<DollarSign size={16} className="text-emerald-500" />}
        />
      </div>

      {/* Filter panel */}
      <div className="bg-bg-card border border-border-base rounded-xl p-4 shadow-xs flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <label className="text-[10px] font-bold uppercase text-text-muted">
            Filter Status
          </label>
          <div className="flex rounded-lg border border-border-base p-0.5 bg-bg-surface">
            {['ALL', 'OPEN', 'CLOSED'].map((f) => (
              <button
                key={f}
                onClick={() => setStatusFilter(f)}
                className={`px-3 py-1 text-[10px] font-bold rounded-md transition-all ${
                  statusFilter === f
                    ? 'bg-muted-base text-text-base border border-border-base/50 shadow-sm'
                    : 'text-text-muted hover:text-text-base border border-transparent'
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Service Table */}
      <div className="h-[400px]">
        {filteredLogs.length === 0 ? (
          <div className="h-full border border-dashed border-border-base rounded-xl flex flex-col items-center justify-center gap-2 p-8 text-center bg-bg-card/30">
            <ClipboardList size={28} className="text-text-muted/60" />
            <h3 className="text-sm font-bold text-text-base">No Records Found</h3>
            <p className="text-xs text-text-muted max-w-xs">
              There are no service logs registered matching the status filter.
            </p>
          </div>
        ) : (
          <DataTable<MaintenanceLog>
            columns={columns}
            data={filteredLogs}
            searchKey="description"
            searchPlaceholder="Search logs by description..."
            pageSize={8}
          />
        )}
      </div>

      {/* Log Maintenance Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setApiErrors([]);
        }}
        title="Log Service Record"
        size="lg"
      >
        <EntityForm<MaintenanceFormValues>
          schema={maintenanceSchema}
          onSubmit={handleLogMaintenance}
          externalErrors={apiErrors}
          defaultValues={{
            vehicleId: '',
            description: '',
            cost: '' as any,
            date: new Date().toISOString().slice(0, 10),
          }}
        >
          {({ register, formState: { errors, isSubmitting } }) => (
            <div className="space-y-4">
              <FormRow label="Assigned Fleet Vehicle" error={errors.vehicleId?.message} required>
                {eligibleVehicles.length === 0 ? (
                  <div className="p-3 border border-dashed border-amber-500/20 bg-amber-500/5 rounded-lg text-xs font-semibold text-amber-500 text-center">
                    No eligible vehicles available on standby duty.
                  </div>
                ) : (
                  <SelectBox
                    {...register('vehicleId')}
                    error={!!errors.vehicleId}
                    options={[
                      { value: '', label: 'Select available vehicle...' },
                      ...eligibleVehicles.map((v) => ({
                        value: v.id || '',
                        label: `${v.name} (${v.regNumber}) — Odo: ${v.odometer} km`,
                      })),
                    ]}
                  />
                )}
              </FormRow>

              <FormRow label="Service Type / Description" error={errors.description?.message} required>
                <TextInput
                  {...register('description')}
                  placeholder="e.g. Brake Pads Replacement, Engine Tuneup"
                  error={!!errors.description}
                />
              </FormRow>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-5">
                <FormRow label="Maintenance Cost ($)" error={errors.cost?.message} required>
                  <TextInput
                    type="number"
                    step="0.01"
                    {...register('cost')}
                    placeholder="e.g. 350.00"
                    error={!!errors.cost}
                  />
                </FormRow>

                <FormRow label="Service Start Date" error={errors.date?.message} required>
                  <DateInput {...register('date')} error={!!errors.date} />
                </FormRow>
              </div>

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
                  disabled={isSubmitting || eligibleVehicles.length === 0}
                  className="h-9 px-4 text-xs font-bold bg-status-dispatched text-white hover:bg-opacity-95 rounded-lg shadow-sm shadow-status-dispatched/20 transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? 'Logging...' : 'Transition to In Shop'}
                </button>
              </div>
            </div>
          )}
        </EntityForm>
      </Modal>
    </div>
  );
});
