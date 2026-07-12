# TransitOps Backend API Documentation

This document outlines the API endpoints that have been implemented so far. Frontend developers (Person C & D) should use these endpoints to connect the UI.

## Vehicles

### `GET /api/vehicles`
Returns a list of vehicles.
- **Query Parameters:**
  - `type` (optional): Filter by vehicle type.
  - `status` (optional): Filter by status (e.g., `Available`, `On Trip`, `In Shop`).
  - `search` (optional): Search by registration number or name (case-insensitive).
- **Response:** `200 OK` with JSON array of vehicles.

### `POST /api/vehicles`
Registers a new vehicle.
- **Body:** JSON object containing `registrationNumber`, `name`, `type`, `maxLoadCapacity`, `odometer` (optional), `acquisitionCost`, `region` (optional), `status` (optional).
- **Response:** `201 Created` on success, or `400 Bad Request` if registration number is not unique or fields are missing.

---

## Drivers

### `GET /api/drivers`
Returns a list of drivers.
- **Query Parameters:**
  - `status` (optional): Filter by status.
  - `search` (optional): Search by name or license number.
- **Response:** `200 OK` with JSON array of drivers.

### `POST /api/drivers`
Registers a new driver.
- **Body:** JSON object containing `name`, `licenseNumber`, `licenseCategory`, `licenseExpiryDate`, `contactNumber`, `status` (optional).
- **Response:** `201 Created` on success, or `400 Bad Request` for invalid input (e.g., past expiry date, duplicate license).

---

## Trips & Live Board

### `GET /api/trips`
Returns a list of trips, ordered by creation date descending.
- **Query Parameters:**
  - `status` (optional): Filter by status. 
  - *Note: For the **Live Board**, poll this endpoint every 15 seconds with `?status=Dispatched` to get active deliveries.*
- **Response:** `200 OK` with JSON array of trips (includes nested `vehicle` and `driver` objects).

### `POST /api/trips`
Creates a new `Draft` trip.
- **Body:** JSON object containing `source`, `destination`, `vehicleId`, `driverId`, `cargoWeight`, `plannedDistance`, `revenue` (optional).
- **Response:** `201 Created` on success. Validates that the cargo weight does not exceed vehicle capacity.

### `POST /api/trips/[id]/dispatch`
Dispatches a draft trip.
- **Body:** None.
- **Response:** `200 OK` on success.
- **Business Logic:** Validates that the vehicle and driver are `Available` and license is not expired. Flips both vehicle and driver statuses to `On Trip` and captures the vehicle's current odometer.

### `POST /api/trips/[id]/complete`
Completes a dispatched trip.
- **Body:** JSON object containing `endOdometer` (number) and `fuelConsumed` (number).
- **Response:** `200 OK` on success.
- **Business Logic:** Validates `endOdometer >= startOdometer`. Reverts vehicle and driver statuses to `Available`, updates the vehicle's odometer, and automatically creates a `FuelLog` entry for the fuel consumed.

### `POST /api/trips/[id]/cancel`
Cancels a dispatched trip.
- **Body:** None.
- **Response:** `200 OK` on success.
- **Business Logic:** Reverts vehicle and driver statuses back to `Available`.
