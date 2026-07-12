export type UserRole = 'FLEET_MANAGER' | 'DRIVER' | 'SAFETY_OFFICER' | 'FINANCIAL_ANALYST';

export type VehicleStatus = 'AVAILABLE' | 'ON_TRIP' | 'DISPATCHED' | 'IN_SHOP' | 'SUSPENDED' | 'RETIRED';
export type DriverStatus = 'AVAILABLE' | 'ON_TRIP' | 'OFF_DUTY' | 'SUSPENDED';
export type TripStatus = 'Draft' | 'Dispatched' | 'Completed' | 'Cancelled';

export type OperationalStatus = VehicleStatus | DriverStatus | TripStatus | 'DRAFT' | 'DISPATCHED' | 'ON_TRIP' | 'COMPLETED' | 'CANCELLED';

export interface Vehicle {
  id?: string;
  regNumber: string;
  name: string;
  type: string;
  maxCapacity: number;
  odometer: number;
  acquisitionCost: number;
  region: string;
  status: VehicleStatus;
}

export interface Driver {
  id?: string;
  name: string;
  licenseNumber: string;
  category: string;
  licenseExpiry: string;
  contactNumber: string;
  status: DriverStatus;
  safetyScore?: number;
  tripCompletionPct?: number;
}

export interface User {
  email: string;
  role: UserRole;
  name: string;
}

export interface ToastMessage {
  id: string;
  title: string;
  description?: string;
  type: 'success' | 'error' | 'info' | 'warning';
}

export interface Trip {
  id: string;
  source: string;
  destination: string;
  vehicleId: string;
  driverId: string;
  cargoWeight: number;
  plannedDistance: number;
  status: TripStatus;
  startOdometer?: number | null;
  endOdometer?: number | null;
  fuelConsumed?: number | null;
  revenue?: number | null;
  createdAt: string;

  // UI state fields
  vehicle?: Vehicle;
  driver?: Driver;
  eta?: string;
  blockingReason?: string;
}

export interface MaintenanceLog {
  id: string;
  vehicleId: string;
  description: string;
  cost: number;
  startDate: string;
  endDate?: string | null;
  isOpen: boolean;
  vehicle?: Vehicle;
}

export interface FuelLog {
  id: string;
  vehicleId: string;
  liters: number;
  cost: number;
  date: string;
  vehicle?: Vehicle;
}

export interface Expense {
  id: string;
  vehicleId: string;
  category: string;
  amount: number;
  description: string;
  date: string;
  vehicle?: Vehicle;
}

export interface VehicleSummary {
  vehicleId: string;
  registrationNumber: string;
  name: string;
  fuelCost: number;
  maintenanceCost: number;
  otherCost: number;
  totalOperationalCost: number;
}

