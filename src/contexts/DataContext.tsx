"use client";

import {createContext, useContext, useState, ReactNode, useCallback, useMemo, useEffect} from 'react';
import {Vehicle, Driver, Trip, VehicleStatus, DriverStatus, TripStatus} from '../types';

interface ApiFieldResult {
  success: boolean;
  error?: {field: string; message: string};
}

interface DataContextType {
  vehicles: Vehicle[];
  drivers: Driver[];
  trips: Trip[];
  loading: boolean;
  error: string | null;
  refreshData: () => Promise<void>;
  addVehicle: (vehicle: Vehicle) => Promise<ApiFieldResult>;
  addDriver: (driver: Driver) => Promise<ApiFieldResult>;
  updateDriver: (id: string, driver: Partial<Driver>) => Promise<ApiFieldResult>;
  changeDriverStatus: (id: string, status: DriverStatus) => Promise<ApiFieldResult>;
  stats: {
    activeFleetCount: number;
    driversOnDutyCount: number;
    vehiclesInShopCount: number;
    todayTripsCount: number;
    fleetUtilizationPercent: number;
  };
}

const DataContext = createContext<DataContextType | undefined>(undefined);

type ApiVehicle = {
  id: string;
  registrationNumber: string;
  name: string;
  type: string;
  maxLoadCapacity: number;
  odometer: number;
  acquisitionCost: number;
  region?: string | null;
  status: string;
};

type ApiDriver = {
  id: string;
  name: string;
  licenseNumber: string;
  licenseCategory: string;
  licenseExpiryDate: string;
  contactNumber: string;
  safetyScore?: number;
  tripCompletionPct?: number;
  status: string;
};

type ApiTrip = {
  id: string;
  source: string;
  destination: string;
  status: string;
  createdAt: string;
  fuelConsumed?: number | null;
  revenue?: number | null;
  vehicle?: ApiVehicle;
  driver?: ApiDriver;
};

const statusToUi = <T extends string>(status: string, fallback: T): T => {
  const normalized = status.trim().replace(/[\s-]+/g, '_').toUpperCase();
  return normalized as T || fallback;
};

const vehicleStatusToApi = (status: VehicleStatus) => ({
  AVAILABLE: 'Available',
  ON_TRIP: 'On Trip',
  DISPATCHED: 'Dispatched',
  IN_SHOP: 'In Shop',
  SUSPENDED: 'Suspended',
  RETIRED: 'Retired',
}[status]);

const driverStatusToApi = (status: DriverStatus) => ({
  AVAILABLE: 'Available',
  ON_TRIP: 'On Trip',
  OFF_DUTY: 'Off Duty',
  SUSPENDED: 'Suspended',
}[status]);

const mapVehicle = (vehicle: ApiVehicle): Vehicle => ({
  id: vehicle.id,
  regNumber: vehicle.registrationNumber,
  name: vehicle.name,
  type: vehicle.type,
  maxCapacity: Number(vehicle.maxLoadCapacity),
  odometer: Number(vehicle.odometer),
  acquisitionCost: Number(vehicle.acquisitionCost),
  region: vehicle.region || 'HQ',
  status: statusToUi<VehicleStatus>(vehicle.status, 'AVAILABLE'),
});

const mapDriver = (driver: ApiDriver): Driver => ({
  id: driver.id,
  name: driver.name,
  licenseNumber: driver.licenseNumber,
  category: driver.licenseCategory,
  licenseExpiry: new Date(driver.licenseExpiryDate).toISOString().slice(0, 10),
  contactNumber: driver.contactNumber,
  safetyScore: driver.safetyScore,
  tripCompletionPct: driver.tripCompletionPct,
  status: statusToUi<DriverStatus>(driver.status, 'AVAILABLE'),
});

const mapTrip = (trip: ApiTrip): Trip => ({
  id: trip.id,
  vehicleReg: trip.vehicle?.registrationNumber || 'Unassigned',
  driverName: trip.driver?.name || 'Unassigned',
  route: `${trip.source} -> ${trip.destination}`,
  status: statusToUi<TripStatus>(trip.status, 'DRAFT'),
  date: new Date(trip.createdAt).toISOString().slice(0, 10),
  fuelConsumption: trip.fuelConsumed ?? undefined,
  cost: trip.revenue ?? undefined,
});

async function readJson<T>(url: string): Promise<T> {
  const response = await fetch(url, {cache: 'no-store'});
  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(payload?.error || `Request failed: ${response.status}`);
  }

  // Handle ApiResponse wrapped payloads { success: true, data: T }
  if (payload && typeof payload === 'object' && payload.success === true && 'data' in payload) {
    return payload.data as T;
  }

  return payload as T;
}

export function DataProvider({children}: {children: ReactNode}) {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refreshData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const [vehicleRows, driverRows, tripRows] = await Promise.all([
        readJson<ApiVehicle[]>('/api/vehicles'),
        readJson<ApiDriver[]>('/api/drivers'),
        readJson<ApiTrip[]>('/api/trips'),
      ]);

      setVehicles(vehicleRows.map(mapVehicle));
      setDrivers(driverRows.map(mapDriver));
      setTrips(tripRows.map(mapTrip));
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unable to load operations data.';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refreshData();
  }, [refreshData]);

  const addVehicle = useCallback(async (newVehicle: Vehicle): Promise<ApiFieldResult> => {
    try {
      const response = await fetch('/api/vehicles', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({
          registrationNumber: newVehicle.regNumber,
          name: newVehicle.name,
          type: newVehicle.type,
          maxLoadCapacity: newVehicle.maxCapacity,
          odometer: newVehicle.odometer,
          acquisitionCost: newVehicle.acquisitionCost,
          region: newVehicle.region,
          status: vehicleStatusToApi(newVehicle.status),
        }),
      });
      const payload = await response.json().catch(() => null);

      if (!response.ok) {
        const errMsg = payload?.details?.[0]?.message || payload?.error || 'Vehicle registration failed.';
        const errField = payload?.details?.[0]?.field || 'regNumber';
        return {success: false, error: {field: errField, message: errMsg}};
      }

      const vehicleData = payload?.success && payload?.data ? payload.data : payload;
      setVehicles((prev) => [mapVehicle(vehicleData as ApiVehicle), ...prev]);
      return {success: true};
    } catch (err) {
      return {success: false, error: {field: 'regNumber', message: err instanceof Error ? err.message : 'Vehicle registration failed.'}};
    }
  }, []);

  const addDriver = useCallback(async (newDriver: Driver): Promise<ApiFieldResult> => {
    try {
      const response = await fetch('/api/drivers', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({
          name: newDriver.name,
          licenseNumber: newDriver.licenseNumber,
          licenseCategory: newDriver.category,
          licenseExpiryDate: newDriver.licenseExpiry,
          contactNumber: newDriver.contactNumber,
          status: driverStatusToApi(newDriver.status),
        }),
      });
      const payload = await response.json().catch(() => null);

      if (!response.ok) {
        const errMsg = payload?.details?.[0]?.message || payload?.error || 'Driver registration failed.';
        const errField = payload?.details?.[0]?.field || 'licenseNumber';
        return {success: false, error: {field: errField, message: errMsg}};
      }

      const driverData = payload?.success && payload?.data ? payload.data : payload;
      setDrivers((prev) => [mapDriver(driverData as ApiDriver), ...prev]);
      return {success: true};
    } catch (err) {
      return {success: false, error: {field: 'licenseNumber', message: err instanceof Error ? err.message : 'Driver registration failed.'}};
    }
  }, []);

  const updateDriver = useCallback(async (id: string, updated: Partial<Driver>): Promise<ApiFieldResult> => {
    try {
      const bodyPayload: any = {};
      if (updated.name !== undefined) bodyPayload.name = updated.name;
      if (updated.licenseNumber !== undefined) bodyPayload.licenseNumber = updated.licenseNumber;
      if (updated.category !== undefined) bodyPayload.licenseCategory = updated.category;
      if (updated.licenseExpiry !== undefined) bodyPayload.licenseExpiryDate = updated.licenseExpiry;
      if (updated.contactNumber !== undefined) bodyPayload.contactNumber = updated.contactNumber;
      if (updated.safetyScore !== undefined) bodyPayload.safetyScore = updated.safetyScore;
      if (updated.status !== undefined) bodyPayload.status = driverStatusToApi(updated.status);

      const response = await fetch(`/api/drivers/${id}`, {
        method: 'PATCH',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(bodyPayload),
      });
      const payload = await response.json().catch(() => null);

      if (!response.ok) {
        const errMsg = payload?.details?.[0]?.message || payload?.error || 'Driver update failed.';
        const errField = payload?.details?.[0]?.field || 'licenseNumber';
        return {success: false, error: {field: errField, message: errMsg}};
      }

      const driverData = payload?.success && payload?.data ? payload.data : payload;
      setDrivers((prev) => prev.map((d) => (d.id === id ? mapDriver(driverData as ApiDriver) : d)));
      return {success: true};
    } catch (err) {
      return {success: false, error: {field: 'licenseNumber', message: err instanceof Error ? err.message : 'Driver update failed.'}};
    }
  }, []);

  const changeDriverStatus = useCallback(async (id: string, status: DriverStatus): Promise<ApiFieldResult> => {
    try {
      const response = await fetch(`/api/drivers/${id}/status`, {
        method: 'PATCH',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({
          status: driverStatusToApi(status),
        }),
      });
      const payload = await response.json().catch(() => null);

      if (!response.ok) {
        const errMsg = payload?.details?.[0]?.message || payload?.error || 'Failed to change status.';
        const errField = payload?.details?.[0]?.field || 'status';
        return {success: false, error: {field: errField, message: errMsg}};
      }

      const driverData = payload?.success && payload?.data ? payload.data : payload;
      setDrivers((prev) => prev.map((d) => (d.id === id ? mapDriver(driverData as ApiDriver) : d)));
      return {success: true};
    } catch (err) {
      return {success: false, error: {field: 'status', message: err instanceof Error ? err.message : 'Failed to change status.'}};
    }
  }, []);

  const stats = useMemo(() => {
    const activeFleetCount = vehicles.filter((v) => v.status !== 'RETIRED').length;
    const driversOnDutyCount = drivers.filter((d) => d.status === 'AVAILABLE' || d.status === 'ON_TRIP').length;
    const vehiclesInShopCount = vehicles.filter((v) => v.status === 'IN_SHOP').length;
    const todayTripsCount = trips.filter((t) => t.status === 'DISPATCHED' || t.status === 'ON_TRIP').length;
    const activeVehiclesCount = vehicles.filter((v) => v.status === 'ON_TRIP' || v.status === 'DISPATCHED').length;
    const fleetUtilizationPercent = activeFleetCount > 0 ? Math.round((activeVehiclesCount / activeFleetCount) * 100) : 0;

    return {
      activeFleetCount,
      driversOnDutyCount,
      vehiclesInShopCount,
      todayTripsCount,
      fleetUtilizationPercent,
    };
  }, [vehicles, drivers, trips]);

  const value = useMemo(() => ({
    vehicles,
    drivers,
    trips,
    loading,
    error,
    refreshData,
    addVehicle,
    addDriver,
    updateDriver,
    changeDriverStatus,
    stats,
  }), [vehicles, drivers, trips, loading, error, refreshData, addVehicle, addDriver, updateDriver, changeDriverStatus, stats]);

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

export function useData() {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
}
