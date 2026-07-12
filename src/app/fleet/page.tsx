'use client';

import React, { useState, useMemo } from 'react';
import { Plus, Search, Filter } from 'lucide-react';
import { DataTable, Column } from '../../components/data-table/DataTable';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { Modal } from '../../components/ui/Feedback';
import { VehicleForm } from '../../components/forms/VehicleForm';
import { TextInput, SelectBox } from '../../components/ui/FormControls';
import { Vehicle, VehicleStatus } from '../../types';
import { EmptyState } from '../../components/ui/StatusAndMetrics';

// Mock seed data
const MOCK_VEHICLES: Vehicle[] = [
  { id: '1', regNumber: 'MH-04-EX-8891', name: 'Volvo B11R', type: 'Bus', maxCapacity: 40, odometer: 15000, acquisitionCost: 5000000, region: 'North', status: 'AVAILABLE' },
  { id: '2', regNumber: 'KA-01-HG-1122', name: 'Scania Metrolink', type: 'Bus', maxCapacity: 45, odometer: 42000, acquisitionCost: 6500000, region: 'South', status: 'ON_TRIP' },
  { id: '3', regNumber: 'DL-01-AB-1234', name: 'Tata Marcopolo', type: 'Bus', maxCapacity: 35, odometer: 85000, acquisitionCost: 3500000, region: 'Central', status: 'IN_SHOP' },
];

export default function FleetPage() {
  const [vehicles, setVehicles] = useState<Vehicle[]>(MOCK_VEHICLES);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | undefined>();
  
  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const columns: Column<Vehicle>[] = useMemo(() => [
    { id: 'regNumber', header: 'Reg. No.', accessorKey: 'regNumber', sortable: true },
    { id: 'name', header: 'Name/Model', accessorKey: 'name', sortable: true },
    { id: 'type', header: 'Type', accessorKey: 'type', sortable: true },
    { id: 'maxCapacity', header: 'Capacity', accessorKey: 'maxCapacity', sortable: true },
    { id: 'odometer', header: 'Odometer', accessorKey: 'odometer', sortable: true },
    { id: 'acquisitionCost', header: 'Acquisition Cost', accessorKey: 'acquisitionCost', sortable: true, cell: (row) => `₹${row.acquisitionCost.toLocaleString()}` },
    { id: 'region', header: 'Region', accessorKey: 'region', sortable: true },
    { id: 'status', header: 'Status', accessorKey: 'status', sortable: true, cell: (row) => <StatusBadge status={row.status.replace('_', ' ')} size="sm" /> },
  ], []);

  const filteredData = useMemo(() => {
    return vehicles.filter(v => {
      const matchSearch = v.regNumber.toLowerCase().includes(searchQuery.toLowerCase()) || v.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchType = typeFilter ? v.type === typeFilter : true;
      const matchStatus = statusFilter ? v.status === statusFilter : true;
      return matchSearch && matchType && matchStatus;
    });
  }, [vehicles, searchQuery, typeFilter, statusFilter]);

  const handleAddEdit = async (data: any) => {
    if (editingVehicle) {
      setVehicles(prev => prev.map(v => v.id === editingVehicle.id ? { ...v, ...data } : v));
    } else {
      setVehicles(prev => [...prev, { ...data, id: Date.now().toString() }]);
    }
    setIsModalOpen(false);
    setEditingVehicle(undefined);
  };

  const handleRowClick = (vehicle: Vehicle) => {
    setEditingVehicle(vehicle);
    setIsModalOpen(true);
  };

  const uniqueTypes = useMemo(() => Array.from(new Set(vehicles.map(v => v.type))), [vehicles]);

  return (
    <div className="flex flex-col h-full space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-display text-text-base">Vehicle Registry</h1>
          <p className="text-sm text-text-muted mt-1">Manage fleet vehicles and track their current status.</p>
        </div>
        <button
          onClick={() => { setEditingVehicle(undefined); setIsModalOpen(true); }}
          className="flex items-center justify-center gap-2 px-4 py-2 bg-primary-base hover:bg-primary-hover text-white rounded-md text-sm font-medium transition-colors w-full sm:w-auto shadow-sm"
        >
          <Plus className="w-4 h-4" />
          Add Vehicle
        </button>
      </div>

      {/* Filters Bar */}
      <div className="flex flex-col sm:flex-row gap-4 items-center bg-bg-surface p-4 rounded-lg border border-border-base shadow-xs">
        <div className="relative w-full sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
          <TextInput
            placeholder="Search by Reg. No or Name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex w-full sm:w-auto items-center gap-4 ml-auto">
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Filter className="w-4 h-4 text-text-muted hidden sm:block" />
            <SelectBox
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              options={[{ value: '', label: 'All Types' }, ...uniqueTypes.map(t => ({ value: t, label: t }))]}
              className="w-full sm:w-40"
            />
          </div>
          <div className="w-full sm:w-auto">
            <SelectBox
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              options={[
                { value: '', label: 'All Statuses' },
                { value: 'AVAILABLE', label: 'Available' },
                { value: 'ON_TRIP', label: 'On Trip' },
                { value: 'DISPATCHED', label: 'Dispatched' },
                { value: 'IN_SHOP', label: 'In Shop' },
                { value: 'SUSPENDED', label: 'Suspended' },
                { value: 'RETIRED', label: 'Retired' },
              ]}
              className="w-full sm:w-40"
            />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden bg-bg-surface rounded-xl border border-border-base shadow-xs flex flex-col">
        {vehicles.length === 0 ? (
          <div className="flex-1 flex items-center justify-center p-8">
            <EmptyState
              title="No vehicles found"
              description="Get started by adding your first vehicle to the registry."
              icon={<Plus className="w-8 h-8 text-text-muted" />}
              action={{
                label: 'Add Vehicle',
                onClick: () => { setEditingVehicle(undefined); setIsModalOpen(true); }
              }}
            />
          </div>
        ) : filteredData.length === 0 ? (
          <div className="flex-1 flex items-center justify-center p-8">
            <EmptyState
              title="No results match your criteria"
              description="Try adjusting your filters or search query."
              icon={<Search className="w-8 h-8 text-text-muted" />}
              action={{
                label: 'Clear Filters',
                onClick: () => { setSearchQuery(''); setTypeFilter(''); setStatusFilter(''); }
              }}
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <DataTable
              columns={columns}
              data={filteredData}
              onRowClick={handleRowClick}
            />
          </div>
        )}
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingVehicle ? 'Edit Vehicle' : 'Add New Vehicle'}
        size="lg"
      >
        <div className="p-6">
          <VehicleForm
            initialValues={editingVehicle as any}
            onSubmit={handleAddEdit}
            onCancel={() => setIsModalOpen(false)}
          />
        </div>
      </Modal>
    </div>
  );
}