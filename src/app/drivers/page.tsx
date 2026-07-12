'use client';

import React, { useState, useMemo } from 'react';
import { Plus, Search, Filter } from 'lucide-react';
import { DataTable, Column } from '../../components/data-table/DataTable';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { Modal } from '../../components/ui/Feedback';
import { DriverForm } from '../../components/forms/DriverForm';
import { TextInput, SelectBox } from '../../components/ui/FormControls';
import { Driver } from '../../types';
import { EmptyState } from '../../components/ui/StatusAndMetrics';

// Mock seed data
const MOCK_DRIVERS: Driver[] = [
  { id: '1', name: 'Rahul Sharma', licenseNumber: 'DL-14-2020-00123', category: 'HMV', licenseExpiry: '2028-12-31', contactNumber: '9876543210', status: 'AVAILABLE', safetyScore: 98, tripCompletionPct: 100 },
  { id: '2', name: 'Amit Singh', licenseNumber: 'KA-01-2019-00456', category: 'LMV', licenseExpiry: '2025-05-15', contactNumber: '8765432109', status: 'ON_TRIP', safetyScore: 85, tripCompletionPct: 92 },
  { id: '3', name: 'Suresh Kumar', licenseNumber: 'MH-04-2015-00789', category: 'HMV', licenseExpiry: '2023-10-10', contactNumber: '7654321098', status: 'SUSPENDED', safetyScore: 65, tripCompletionPct: 75 },
];

export default function DriversPage() {
  const [drivers, setDrivers] = useState<Driver[]>(MOCK_DRIVERS);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDriver, setEditingDriver] = useState<Driver | undefined>();
  
  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const columns: Column<Driver>[] = useMemo(() => [
    { id: 'name', header: 'Name', accessorKey: 'name', sortable: true },
    { id: 'licenseNumber', header: 'License No.', accessorKey: 'licenseNumber', sortable: true },
    { id: 'category', header: 'Category', accessorKey: 'category', sortable: true },
    { 
      id: 'licenseExpiry', 
      header: 'Expiry Date', 
      accessorKey: 'licenseExpiry', 
      sortable: true,
      cell: (row) => {
        const isExpired = new Date(row.licenseExpiry) < new Date();
        return (
          <span className={isExpired ? 'text-red-600 font-medium' : ''}>
            {new Date(row.licenseExpiry).toLocaleDateString()}
          </span>
        );
      }
    },
    { id: 'contactNumber', header: 'Contact', accessorKey: 'contactNumber', sortable: false },
    { id: 'safetyScore', header: 'Safety Score', accessorKey: 'safetyScore', sortable: true, cell: (row) => row.safetyScore ? `${row.safetyScore}/100` : '-' },
    { id: 'tripCompletionPct', header: 'Trip Completion %', accessorKey: 'tripCompletionPct', sortable: true, cell: (row) => row.tripCompletionPct ? `${row.tripCompletionPct}%` : '-' },
    { id: 'status', header: 'Status', accessorKey: 'status', sortable: true, cell: (row) => {
        const isExpired = new Date(row.licenseExpiry) < new Date();
        if (isExpired) return <StatusBadge status="EXPIRED" size="sm" />;
        return <StatusBadge status={row.status.replace('_', ' ')} size="sm" />;
      } 
    },
  ], []);

  const filteredData = useMemo(() => {
    return drivers.filter(d => {
      const matchSearch = d.name.toLowerCase().includes(searchQuery.toLowerCase()) || d.licenseNumber.toLowerCase().includes(searchQuery.toLowerCase());
      const matchCategory = categoryFilter ? d.category === categoryFilter : true;
      const matchStatus = statusFilter ? d.status === statusFilter : true;
      return matchSearch && matchCategory && matchStatus;
    });
  }, [drivers, searchQuery, categoryFilter, statusFilter]);

  const handleAddEdit = async (data: any) => {
    if (editingDriver) {
      setDrivers(prev => prev.map(d => d.id === editingDriver.id ? { ...d, ...data } : d));
    } else {
      setDrivers(prev => [...prev, { ...data, id: Date.now().toString() }]);
    }
    setIsModalOpen(false);
    setEditingDriver(undefined);
  };

  const handleRowClick = (driver: Driver) => {
    setEditingDriver(driver);
    setIsModalOpen(true);
  };

  const uniqueCategories = useMemo(() => Array.from(new Set(drivers.map(d => d.category))), [drivers]);

  return (
    <div className="flex flex-col h-full space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-display text-text-base">Driver Management</h1>
          <p className="text-sm text-text-muted mt-1">Manage driver records, licenses, and performance metrics.</p>
        </div>
        <button
          onClick={() => { setEditingDriver(undefined); setIsModalOpen(true); }}
          className="flex items-center justify-center gap-2 px-4 py-2 bg-primary-base hover:bg-primary-hover text-white rounded-md text-sm font-medium transition-colors w-full sm:w-auto shadow-sm"
        >
          <Plus className="w-4 h-4" />
          Add Driver
        </button>
      </div>

      {/* Filters Bar */}
      <div className="flex flex-col sm:flex-row gap-4 items-center bg-bg-surface p-4 rounded-lg border border-border-base shadow-xs">
        <div className="relative w-full sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
          <TextInput
            placeholder="Search by Name or License..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex w-full sm:w-auto items-center gap-4 ml-auto">
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Filter className="w-4 h-4 text-text-muted hidden sm:block" />
            <SelectBox
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              options={[{ value: '', label: 'All Categories' }, ...uniqueCategories.map(c => ({ value: c, label: c }))]}
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
                { value: 'SUSPENDED', label: 'Suspended' },
              ]}
              className="w-full sm:w-40"
            />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden bg-bg-surface rounded-xl border border-border-base shadow-xs flex flex-col">
        {drivers.length === 0 ? (
          <div className="flex-1 flex items-center justify-center p-8">
            <EmptyState
              title="No drivers found"
              description="Get started by adding your first driver to the system."
              icon={<Plus className="w-8 h-8 text-text-muted" />}
              action={{
                label: 'Add Driver',
                onClick: () => { setEditingDriver(undefined); setIsModalOpen(true); }
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
                onClick: () => { setSearchQuery(''); setCategoryFilter(''); setStatusFilter(''); }
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
        title={editingDriver ? 'Edit Driver' : 'Add New Driver'}
        size="lg"
      >
        <div className="p-6">
          <DriverForm
            initialValues={editingDriver as any}
            onSubmit={handleAddEdit}
            onCancel={() => setIsModalOpen(false)}
          />
        </div>
      </Modal>
    </div>
  );
}