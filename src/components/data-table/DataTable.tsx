/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {useState, useMemo, ReactNode, useCallback} from 'react';
import {ArrowUpDown, ChevronLeft, ChevronRight, CheckSquare, Square, MinusSquare} from 'lucide-react';
import {Skeleton} from '../ui/StatusAndMetrics';

export interface Column<T> {
  id: string;
  header: string;
  accessorKey?: keyof T;
  cell?: (row: T) => ReactNode;
  sortable?: boolean;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  loading?: boolean;
  onRowClick?: (row: T) => void;
  searchPlaceholder?: string;
  searchKey?: keyof T;
  enableSelection?: boolean;
  selectedRows?: T[];
  onSelectedRowsChange?: (rows: T[]) => void;
  // External pagination override optional
  pageSize?: number;
}

export function DataTable<T extends Record<string, any>>({
  columns,
  data,
  loading = false,
  onRowClick,
  searchPlaceholder = 'Search records...',
  searchKey,
  enableSelection = false,
  selectedRows = [],
  onSelectedRowsChange,
  pageSize = 10,
}: DataTableProps<T>) {
  // Sorting State
  const [sortField, setSortField] = useState<keyof T | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  // Search State
  const [searchQuery, setSearchQuery] = useState('');

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);

  // Sorting Handler
  const handleSort = useCallback((field: keyof T) => {
    setSortField((currentField) => {
      if (currentField === field) {
        setSortDirection((prevDir) => (prevDir === 'asc' ? 'desc' : 'asc'));
        return field;
      }
      setSortDirection('asc');
      return field;
    });
    setCurrentPage(1);
  }, []);

  // Filter & Sort Data
  const filteredAndSortedData = useMemo(() => {
    let result = [...data];

    // Filter
    if (searchQuery && searchKey) {
      result = result.filter((row) => {
        const val = row[searchKey];
        if (val === undefined || val === null) return false;
        return String(val).toLowerCase().includes(searchQuery.toLowerCase());
      });
    }

    // Sort
    if (sortField) {
      result.sort((a, b) => {
        const valA = a[sortField];
        const valB = b[sortField];

        if (valA === undefined || valA === null) return 1;
        if (valB === undefined || valB === null) return -1;

        if (typeof valA === 'number' && typeof valB === 'number') {
          return sortDirection === 'asc' ? valA - valB : valB - valA;
        }

        const strA = String(valA).toLowerCase();
        const strB = String(valB).toLowerCase();

        return sortDirection === 'asc'
          ? strA.localeCompare(strB)
          : strB.localeCompare(strA);
      });
    }

    return result;
  }, [data, searchQuery, searchKey, sortField, sortDirection]);

  // Pagination Logic
  const totalItems = filteredAndSortedData.length;
  const totalPages = Math.ceil(totalItems / pageSize);
  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return filteredAndSortedData.slice(startIndex, startIndex + pageSize);
  }, [filteredAndSortedData, currentPage, pageSize]);

  // Selection Logic
  const isAllSelected = useMemo(() => {
    if (paginatedData.length === 0) return false;
    return paginatedData.every((row) => selectedRows.includes(row));
  }, [paginatedData, selectedRows]);

  const isSomeSelected = useMemo(() => {
    if (selectedRows.length === 0) return false;
    return selectedRows.some((row) => paginatedData.includes(row)) && !isAllSelected;
  }, [selectedRows, paginatedData, isAllSelected]);

  const toggleSelectAll = useCallback(() => {
    if (!onSelectedRowsChange) return;
    
    if (isAllSelected) {
      // Remove all paginated rows from selection
      const newSelection = selectedRows.filter((row) => !paginatedData.includes(row));
      onSelectedRowsChange(newSelection);
    } else {
      // Add all paginated rows that aren't already selected
      const uniqueNewRows = paginatedData.filter((row) => !selectedRows.includes(row));
      onSelectedRowsChange([...selectedRows, ...uniqueNewRows]);
    }
  }, [isAllSelected, paginatedData, selectedRows, onSelectedRowsChange]);

  const toggleSelectRow = useCallback((row: T) => {
    if (!onSelectedRowsChange) return;

    if (selectedRows.includes(row)) {
      onSelectedRowsChange(selectedRows.filter((r) => r !== row));
    } else {
      onSelectedRowsChange([...selectedRows, row]);
    }
  }, [selectedRows, onSelectedRowsChange]);

  const startIdx = (currentPage - 1) * pageSize + 1;
  const endIdx = Math.min(currentPage * pageSize, totalItems);

  return (
    <div className="flex flex-col gap-4 w-full h-full bg-bg-card border border-border-base rounded-xl overflow-hidden shadow-xs">
      
      {/* Table Toolbar */}
      {searchKey && (
        <div className="flex items-center px-5 py-4 border-b border-border-base bg-bg-base/20">
          <div className="relative w-full max-w-sm">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-text-muted">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              placeholder={searchPlaceholder}
              className="w-full h-9 pl-9 pr-4 text-xs font-medium bg-bg-surface border border-border-base rounded-lg outline-none focus-visible:ring-1 focus-visible:ring-status-dispatched text-text-base placeholder:text-text-muted/60"
            />
          </div>
        </div>
      )}

      {/* Main Table Area */}
      <div className="flex-1 overflow-x-auto">
        <table className="w-full border-collapse text-left text-sm text-text-base">
          
          {/* Sticky Header */}
          <thead className="sticky top-0 bg-bg-surface border-b border-border-base z-10 select-none">
            <tr>
              {enableSelection && (
                <th className="px-5 py-3.5 w-12 text-center">
                  <button
                    type="button"
                    onClick={toggleSelectAll}
                    disabled={loading || paginatedData.length === 0}
                    className="p-1 rounded-md text-text-muted hover:bg-border-base/50 transition-colors inline-block align-middle"
                    aria-label={isAllSelected ? 'Deselect all rows' : 'Select all rows'}
                  >
                    {isAllSelected ? (
                      <CheckSquare size={16} className="text-status-dispatched" />
                    ) : isSomeSelected ? (
                      <MinusSquare size={16} className="text-status-dispatched" />
                    ) : (
                      <Square size={16} />
                    )}
                  </button>
                </th>
              )}

              {columns.map((col) => (
                <th
                  key={col.id}
                  className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-text-muted"
                >
                  {col.sortable && col.accessorKey ? (
                    <button
                      type="button"
                      onClick={() => handleSort(col.accessorKey!)}
                      className="inline-flex items-center gap-1.5 hover:text-text-base transition-colors"
                    >
                      <span>{col.header}</span>
                      <ArrowUpDown size={12} className={sortField === col.accessorKey ? 'text-status-dispatched' : 'text-text-muted/40'} />
                    </button>
                  ) : (
                    <span>{col.header}</span>
                  )}
                </th>
              ))}
            </tr>
          </thead>

          {/* Table Body */}
          <tbody className="divide-y divide-border-base/70">
            {loading ? (
              // Skeleton rows loading state
              Array.from({length: 5}).map((_, rIdx) => (
                <tr key={rIdx} className="hover:bg-border-base/10">
                  {enableSelection && (
                    <td className="px-5 py-4 w-12 text-center">
                      <Skeleton variant="circle" width={16} height={16} className="mx-auto" />
                    </td>
                  )}
                  {columns.map((col) => (
                    <td key={col.id} className="px-5 py-4">
                      <Skeleton variant="rect" height={16} width="80%" />
                    </td>
                  ))}
                </tr>
              ))
            ) : paginatedData.length === 0 ? (
              // Empty State
              <tr>
                <td
                  colSpan={columns.length + (enableSelection ? 1 : 0)}
                  className="px-5 py-12 text-center text-xs font-medium text-text-muted"
                >
                  No records found matching current query criteria.
                </td>
              </tr>
            ) : (
              // Actual Rows
              paginatedData.map((row, rIdx) => {
                const isSelected = selectedRows.includes(row);
                return (
                  <tr
                    key={row.id || row.regNumber || row.licenseNumber || rIdx}
                    onClick={() => onRowClick && onRowClick(row)}
                    className={`hover:bg-border-base/30 transition-all duration-150 ${
                      onRowClick ? 'cursor-pointer' : ''
                    } ${isSelected ? 'bg-status-dispatched/5 dark:bg-status-dispatched/10' : ''}`}
                  >
                    {enableSelection && (
                      <td
                        className="px-5 py-4 w-12 text-center"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button
                          type="button"
                          onClick={() => toggleSelectRow(row)}
                          className="p-1 rounded-md text-text-muted hover:bg-border-base/50 transition-colors inline-block align-middle"
                          aria-label={isSelected ? 'Deselect row' : 'Select row'}
                        >
                          {isSelected ? (
                            <CheckSquare size={16} className="text-status-dispatched" />
                          ) : (
                            <Square size={16} />
                          )}
                        </button>
                      </td>
                    )}

                    {columns.map((col) => {
                      const value = col.accessorKey ? row[col.accessorKey] : undefined;
                      return (
                        <td key={col.id} className="px-5 py-4 text-xs font-medium text-text-base whitespace-nowrap">
                          {col.cell ? col.cell(row) : value !== undefined ? String(value) : null}
                        </td>
                      );
                    })}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      {!loading && totalItems > 0 && (
        <div className="flex items-center justify-between px-5 py-4 border-t border-border-base bg-bg-base/10 select-none">
          <span className="text-[11px] font-semibold text-text-muted">
            Showing <strong className="text-text-base">{startIdx}</strong> to{' '}
            <strong className="text-text-base">{endIdx}</strong> of{' '}
            <strong className="text-text-base">{totalItems}</strong> records
          </span>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-1.5 rounded-lg border border-border-base text-text-muted hover:bg-border-base/50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              aria-label="Previous page"
            >
              <ChevronLeft size={16} />
            </button>
            
            <div className="flex items-center gap-1">
              {Array.from({length: totalPages}).map((_, pageIdx) => {
                const pg = pageIdx + 1;
                // Only show a small subset of pages if there are many, but for simple demos this works perfectly
                return (
                  <button
                    key={pg}
                    onClick={() => setCurrentPage(pg)}
                    className={`h-7 px-2.5 rounded-md text-[11px] font-bold border transition-all ${
                      currentPage === pg
                        ? 'bg-primary-base text-primary-foreground border-primary-base'
                        : 'border-border-base text-text-muted hover:bg-border-base/50'
                    }`}
                  >
                    {pg}
                  </button>
                );
              })}
            </div>

            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="p-1.5 rounded-lg border border-border-base text-text-muted hover:bg-border-base/50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              aria-label="Next page"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
