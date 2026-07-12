/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useMemo, useCallback, memo } from 'react';
import { useData } from '../../contexts/DataContext';
import { useToast } from '../../contexts/ToastContext';
import { DataTable, Column } from '../../components/data-table/DataTable';
import { EntityForm, ApiFieldError } from '../../components/forms/EntityForm';
import { FormRow, TextInput, DateInput, SelectBox } from '../../components/ui/FormControls';
import { fuelLogSchema, expenseSchema, FuelLogFormValues, ExpenseFormValues } from '../../schemas/validation';
import { FuelLog, Expense, VehicleSummary } from '../../types';
import { Fuel, Coins, RefreshCw, Calculator, ClipboardList, AlertCircle, Calendar } from 'lucide-react';
import { SpinnerCircular } from '../../components/ui/StatusAndMetrics';

export const FuelExpensesPage = memo(function FuelExpensesPage() {
  const {
    fuelLogs,
    expenses,
    vehicles,
    vehicleSummaries,
    loading,
    error,
    addFuelLog,
    addExpense,
    refreshData,
  } = useData();
  const { addToast } = useToast();

  const [lastRefreshed, setLastRefreshed] = useState<string>(new Date().toLocaleTimeString());
  const [fuelApiErrors, setFuelApiErrors] = useState<ApiFieldError[]>([]);
  const [expenseApiErrors, setExpenseApiErrors] = useState<ApiFieldError[]>([]);

  // Filter States
  const [fuelVehicleFilter, setFuelVehicleFilter] = useState<string>('ALL');
  const [expenseVehicleFilter, setExpenseVehicleFilter] = useState<string>('ALL');
  const [expenseCategoryFilter, setExpenseCategoryFilter] = useState<string>('ALL');
  const [fuelDateFilter, setFuelDateFilter] = useState<string>('');

  const handleRefresh = useCallback(async () => {
    await refreshData();
    setLastRefreshed(new Date().toLocaleTimeString());
  }, [refreshData]);

  // Handle Fuel Log Submit
  const handleFuelSubmit = useCallback(async (values: FuelLogFormValues, { reset }: any) => {
    setFuelApiErrors([]);
    const result = await addFuelLog({
      vehicleId: values.vehicleId,
      liters: Number(values.liters),
      cost: Number(values.cost),
      date: values.date,
    });

    if (result.success) {
      addToast('Fuel Logged', 'Fuel intake log recorded and operational expense auto-created.', 'success');
      reset();
      setLastRefreshed(new Date().toLocaleTimeString());
    } else if (result.error) {
      setFuelApiErrors([result.error]);
      addToast('Fuel Logging Failed', result.error.message, 'error');
    }
  }, [addFuelLog, addToast]);

  // Handle Other Expense Submit
  const handleExpenseSubmit = useCallback(async (values: ExpenseFormValues, { reset }: any) => {
    setExpenseApiErrors([]);
    const result = await addExpense({
      vehicleId: values.vehicleId,
      category: values.category,
      amount: Number(values.amount),
      description: values.description.trim(),
      date: values.date,
    });

    if (result.success) {
      addToast('Expense Logged', 'Operational cost expense record created successfully.', 'success');
      reset();
      setLastRefreshed(new Date().toLocaleTimeString());
    } else if (result.error) {
      setExpenseApiErrors([result.error]);
      addToast('Expense Logging Failed', result.error.message, 'error');
    }
  }, [addExpense, addToast]);

  // Filtered Fuel Logs
  const filteredFuelLogs = useMemo(() => {
    return fuelLogs.filter((fl) => {
      const matchVehicle = fuelVehicleFilter === 'ALL' || fl.vehicleId === fuelVehicleFilter;
      const matchDate = !fuelDateFilter || fl.date === fuelDateFilter;
      return matchVehicle && matchDate;
    });
  }, [fuelLogs, fuelVehicleFilter, fuelDateFilter]);

  // Filtered Expenses
  const filteredExpenses = useMemo(() => {
    return expenses.filter((exp) => {
      const matchVehicle = expenseVehicleFilter === 'ALL' || exp.vehicleId === expenseVehicleFilter;
      const matchCategory = expenseCategoryFilter === 'ALL' || exp.category === expenseCategoryFilter;
      return matchVehicle && matchCategory;
    });
  }, [expenses, expenseVehicleFilter, expenseCategoryFilter]);

  // Columns for Fuel Logs Table
  const fuelColumns: Column<FuelLog>[] = useMemo(
    () => [
      {
        id: 'vehicle',
        header: 'Vehicle',
        accessorKey: 'vehicleId',
        sortable: true,
        cell: (row) => (
          <div className="flex flex-col">
            <span className="font-bold text-text-base">{row.vehicle?.name || 'Unknown'}</span>
            <span className="font-mono text-[9px] text-text-muted">{row.vehicle?.regNumber || 'N/A'}</span>
          </div>
        ),
      },
      {
        id: 'liters',
        header: 'Intake (L)',
        accessorKey: 'liters',
        sortable: true,
        cell: (row) => <span className="font-mono">{row.liters.toFixed(1)} L</span>,
      },
      {
        id: 'cost',
        header: 'Cost',
        accessorKey: 'cost',
        sortable: true,
        cell: (row) => <span className="font-mono font-bold">${row.cost.toFixed(2)}</span>,
      },
      {
        id: 'date',
        header: 'Date',
        accessorKey: 'date',
        sortable: true,
        cell: (row) => <span className="font-mono text-xs">{row.date}</span>,
      },
    ],
    []
  );

  // Columns for Expenses Table
  const expenseColumns: Column<Expense>[] = useMemo(
    () => [
      {
        id: 'vehicle',
        header: 'Vehicle',
        accessorKey: 'vehicleId',
        sortable: true,
        cell: (row) => (
          <div className="flex flex-col">
            <span className="font-bold text-text-base">{row.vehicle?.name || 'Unknown'}</span>
            <span className="font-mono text-[9px] text-text-muted">{row.vehicle?.regNumber || 'N/A'}</span>
          </div>
        ),
      },
      {
        id: 'category',
        header: 'Category',
        accessorKey: 'category',
        sortable: true,
        cell: (row) => {
          const colors: Record<string, string> = {
            Fuel: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
            Maintenance: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
            Toll: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
            Other: 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20',
          };
          return (
            <span className={`inline-flex px-2 py-0.5 rounded-full text-[9px] font-extrabold border ${colors[row.category] || colors.Other}`}>
              {row.category.toUpperCase()}
            </span>
          );
        },
      },
      {
        id: 'amount',
        header: 'Cost',
        accessorKey: 'amount',
        sortable: true,
        cell: (row) => <span className="font-mono font-bold">${row.amount.toFixed(2)}</span>,
      },
      {
        id: 'description',
        header: 'Description',
        accessorKey: 'description',
        sortable: true,
      },
      {
        id: 'date',
        header: 'Date',
        accessorKey: 'date',
        sortable: true,
        cell: (row) => <span className="font-mono text-xs">{row.date}</span>,
      },
    ],
    []
  );

  // Columns for Vehicle Cost Summary Table
  const summaryColumns: Column<VehicleSummary>[] = useMemo(
    () => [
      {
        id: 'vehicle',
        header: 'Vehicle name',
        accessorKey: 'name',
        sortable: true,
        cell: (row) => (
          <div>
            <span className="font-bold text-text-base block">{row.name}</span>
            <span className="font-mono text-[10px] text-text-muted uppercase tracking-wider">{row.registrationNumber}</span>
          </div>
        ),
      },
      {
        id: 'fuelCost',
        header: 'Fuel Costs',
        accessorKey: 'fuelCost',
        sortable: true,
        cell: (row) => <span className="font-mono">${row.fuelCost.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>,
      },
      {
        id: 'maintenanceCost',
        header: 'Maintenance Costs',
        accessorKey: 'maintenanceCost',
        sortable: true,
        cell: (row) => <span className="font-mono">${row.maintenanceCost.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>,
      },
      {
        id: 'otherCost',
        header: 'Tolls & Other',
        accessorKey: 'otherCost',
        sortable: true,
        cell: (row) => <span className="font-mono">${row.otherCost.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>,
      },
      {
        id: 'totalOperationalCost',
        header: 'Total Operational Cost',
        accessorKey: 'totalOperationalCost',
        sortable: true,
        cell: (row) => (
          <span className="font-mono font-bold text-emerald-400">
            ${row.totalOperationalCost.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </span>
        ),
      },
    ],
    []
  );

  if (loading && fuelLogs.length === 0) {
    return (
      <div className="h-[400px] flex flex-col items-center justify-center gap-3">
        <SpinnerCircular size="lg" />
        <p className="text-sm text-text-muted">Loading fuel logs and expenses...</p>
      </div>
    );
  }

  if (error && fuelLogs.length === 0) {
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
    <div className="space-y-8 select-none">
      {/* Header Panel */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold tracking-tight font-display text-text-base">
            Fuel & Expenses Tracking
          </h2>
          <p className="text-xs text-text-muted mt-0.5">
            Log diesel consumption, manage operational expense sheets, and track vehicle costs.
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
        </div>
      </div>

      {/* Two-Panel Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Left Panel: Fuel Log */}
        <div className="space-y-6">
          <div className="bg-bg-card border border-border-base rounded-xl p-5 shadow-xs">
            <div className="flex items-center gap-2 mb-4">
              <Fuel className="text-emerald-500" size={18} />
              <h3 className="text-sm font-extrabold font-display text-text-base">Log Fuel Intake</h3>
            </div>
            
            <EntityForm<FuelLogFormValues>
              schema={fuelLogSchema}
              onSubmit={handleFuelSubmit}
              externalErrors={fuelApiErrors}
              defaultValues={{
                vehicleId: '',
                liters: '' as any,
                cost: '' as any,
                date: new Date().toISOString().slice(0, 10),
              }}
            >
              {({ register, formState: { errors, isSubmitting } }) => (
                <div className="space-y-4">
                  <FormRow label="Fleet Vehicle" error={errors.vehicleId?.message} required>
                    <SelectBox
                      {...register('vehicleId')}
                      error={!!errors.vehicleId}
                      options={[
                        { value: '', label: 'Select vehicle...' },
                        ...vehicles.map((v) => ({
                          value: v.id || '',
                          label: `${v.name} (${v.regNumber})`,
                        })),
                      ]}
                    />
                  </FormRow>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4">
                    <FormRow label="Liters (L)" error={errors.liters?.message} required>
                      <TextInput type="number" step="0.1" {...register('liters')} placeholder="e.g. 50.0" error={!!errors.liters} />
                    </FormRow>
                    <FormRow label="Total Cost ($)" error={errors.cost?.message} required>
                      <TextInput type="number" step="0.01" {...register('cost')} placeholder="e.g. 120.00" error={!!errors.cost} />
                    </FormRow>
                  </div>

                  <FormRow label="Intake Date" error={errors.date?.message} required>
                    <DateInput {...register('date')} error={!!errors.date} />
                  </FormRow>

                  <div className="flex justify-end pt-2 border-t border-border-base/40">
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="px-4 py-2 text-xs font-bold bg-emerald-600 text-white hover:bg-emerald-500 rounded-lg shadow-sm transition-all"
                    >
                      {isSubmitting ? 'Logging...' : 'Submit Fuel Log'}
                    </button>
                  </div>
                </div>
              )}
            </EntityForm>
          </div>

          {/* Fuel Logs Table */}
          <div className="space-y-4 bg-bg-card border border-border-base rounded-xl p-5 shadow-xs">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-border-base/50">
              <h4 className="text-xs font-bold uppercase text-text-muted">Fuel History</h4>
              
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <select
                  value={fuelVehicleFilter}
                  onChange={(e) => setFuelVehicleFilter(e.target.value)}
                  className="h-8 px-2 bg-bg-surface border border-border-base rounded-lg text-[10px] font-bold text-text-base cursor-pointer"
                >
                  <option value="ALL">All Vehicles</option>
                  {vehicles.map((v) => (
                    <option key={v.id} value={v.id}>{v.regNumber}</option>
                  ))}
                </select>

                <input
                  type="date"
                  value={fuelDateFilter}
                  onChange={(e) => setFuelDateFilter(e.target.value)}
                  className="h-8 px-2 bg-bg-surface border border-border-base rounded-lg text-[10px] font-bold text-text-base cursor-pointer"
                />
              </div>
            </div>

            <div className="h-[280px]">
              {filteredFuelLogs.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-4">
                  <ClipboardList size={24} className="text-text-muted/40 mb-1" />
                  <p className="text-[11px] font-bold text-text-muted">No Fuel Logs registered.</p>
                </div>
              ) : (
                <DataTable<FuelLog>
                  columns={fuelColumns}
                  data={filteredFuelLogs}
                  searchKey="vehicleId"
                  searchPlaceholder="Filter..."
                  pageSize={5}
                />
              )}
            </div>
          </div>
        </div>

        {/* Right Panel: Other Expenses */}
        <div className="space-y-6">
          <div className="bg-bg-card border border-border-base rounded-xl p-5 shadow-xs">
            <div className="flex items-center gap-2 mb-4">
              <Coins className="text-blue-500" size={18} />
              <h3 className="text-sm font-extrabold font-display text-text-base">Log Other Expense</h3>
            </div>

            <EntityForm<ExpenseFormValues>
              schema={expenseSchema}
              onSubmit={handleExpenseSubmit}
              externalErrors={expenseApiErrors}
              defaultValues={{
                vehicleId: '',
                category: 'Toll',
                amount: '' as any,
                description: '',
                date: new Date().toISOString().slice(0, 10),
              }}
            >
              {({ register, formState: { errors, isSubmitting } }) => (
                <div className="space-y-4">
                  <FormRow label="Fleet Vehicle" error={errors.vehicleId?.message} required>
                    <SelectBox
                      {...register('vehicleId')}
                      error={!!errors.vehicleId}
                      options={[
                        { value: '', label: 'Select vehicle...' },
                        ...vehicles.map((v) => ({
                          value: v.id || '',
                          label: `${v.name} (${v.regNumber})`,
                        })),
                      ]}
                    />
                  </FormRow>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4">
                    <FormRow label="Cost Category" error={errors.category?.message} required>
                      <SelectBox
                        {...register('category')}
                        error={!!errors.category}
                        options={[
                          { value: 'Toll', label: 'Toll & Transit Fees' },
                          { value: 'Maintenance', label: 'Maintenance Log' },
                          { value: 'Other', label: 'Other Expense' },
                        ]}
                      />
                    </FormRow>
                    <FormRow label="Amount ($)" error={errors.amount?.message} required>
                      <TextInput type="number" step="0.01" {...register('amount')} placeholder="e.g. 45.00" error={!!errors.amount} />
                    </FormRow>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4">
                    <FormRow label="Description" error={errors.description?.message} required>
                      <TextInput {...register('description')} placeholder="e.g. Toll booth fee" error={!!errors.description} />
                    </FormRow>
                    <FormRow label="Expense Date" error={errors.date?.message} required>
                      <DateInput {...register('date')} error={!!errors.date} />
                    </FormRow>
                  </div>

                  <div className="flex justify-end pt-2 border-t border-border-base/40">
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="px-4 py-2 text-xs font-bold bg-blue-600 text-white hover:bg-blue-500 rounded-lg shadow-sm transition-all"
                    >
                      {isSubmitting ? 'Logging...' : 'Submit Expense Log'}
                    </button>
                  </div>
                </div>
              )}
            </EntityForm>
          </div>

          {/* Expenses Table */}
          <div className="space-y-4 bg-bg-card border border-border-base rounded-xl p-5 shadow-xs">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-border-base/50">
              <h4 className="text-xs font-bold uppercase text-text-muted">Expense Logs</h4>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <select
                  value={expenseVehicleFilter}
                  onChange={(e) => setExpenseVehicleFilter(e.target.value)}
                  className="h-8 px-2 bg-bg-surface border border-border-base rounded-lg text-[10px] font-bold text-text-base cursor-pointer"
                >
                  <option value="ALL">All Vehicles</option>
                  {vehicles.map((v) => (
                    <option key={v.id} value={v.id}>{v.regNumber}</option>
                  ))}
                </select>

                <select
                  value={expenseCategoryFilter}
                  onChange={(e) => setExpenseCategoryFilter(e.target.value)}
                  className="h-8 px-2 bg-bg-surface border border-border-base rounded-lg text-[10px] font-bold text-text-base cursor-pointer"
                >
                  <option value="ALL">All Categories</option>
                  <option value="Fuel">Fuel</option>
                  <option value="Maintenance">Maintenance</option>
                  <option value="Toll">Tolls</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>

            <div className="h-[280px]">
              {filteredExpenses.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-4">
                  <ClipboardList size={24} className="text-text-muted/40 mb-1" />
                  <p className="text-[11px] font-bold text-text-muted">No Expense entries found.</p>
                </div>
              ) : (
                <DataTable<Expense>
                  columns={expenseColumns}
                  data={filteredExpenses}
                  searchKey="description"
                  searchPlaceholder="Filter description..."
                  pageSize={5}
                />
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Summary Panel */}
      <div className="bg-bg-card border border-border-base rounded-xl p-5 shadow-xs space-y-4">
        <div className="flex items-center gap-2 pb-3 border-b border-border-base/50">
          <Calculator className="text-emerald-500 animate-[pulse_2s_infinite]" size={18} />
          <h3 className="text-sm font-extrabold font-display text-text-base">
            Vehicle Operational Cost Aggregations (FR-7.3)
          </h3>
        </div>

        <div className="h-[300px]">
          {vehicleSummaries.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center">
              <p className="text-xs text-text-muted font-semibold">No operational aggregations calculated yet.</p>
            </div>
          ) : (
            <DataTable<VehicleSummary>
              columns={summaryColumns}
              data={vehicleSummaries}
              searchKey="name"
              searchPlaceholder="Filter vehicles by name..."
              pageSize={5}
            />
          )}
        </div>
      </div>
    </div>
  );
});
