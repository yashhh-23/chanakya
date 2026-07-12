export type UserRole = 'FLEET_MANAGER' | 'DRIVER' | 'SAFETY_OFFICER' | 'FINANCIAL_ANALYST';

export type VehicleStatus = 'AVAILABLE' | 'ON_TRIP' | 'DISPATCHED' | 'IN_SHOP' | 'SUSPENDED' | 'RETIRED';
export type DriverStatus = 'AVAILABLE' | 'ON_TRIP' | 'OFF_DUTY' | 'SUSPENDED';
export type TripStatus = 'DRAFT' | 'DISPATCHED' | 'ON_TRIP' | 'COMPLETED' | 'CANCELLED';

export type OperationalStatus = VehicleStatus | DriverStatus | TripStatus;

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
  vehicleReg: string;
  driverName: string;
  route: string;
  status: TripStatus;
  date: string;
  fuelConsumption?: number;
  cost?: number;
}
