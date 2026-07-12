# TransitOps — API Contract & Demo Foundation

This document serves as the single source of truth for the **TransitOps (Chanakya)** team. It defines the database schemas, API endpoints, seed data, acceptance demo workflow, and the integration checklist to keep the Frontend (Person C) and Backend/Database (Person A, B, D) aligned.

---

## 1. Scope & Role-Based Access Control (RBAC)

TransitOps enforces role-scoped navigation and access. All API routes (except login) require an authenticated session (HTTP-only JWT cookie) and are checked against the user's role:

| Role | Accessible Modules | API Access Scope |
| :--- | :--- | :--- |
| **Fleet Manager** | Fleet, Maintenance | Read/Write on Vehicles, Maintenance Logs, Expenses; Read-only on others. |
| **Dispatcher** | Dashboard, Trips | Read/Write on Trips; Read-only on Vehicles, Drivers (Available pool). |
| **Safety Officer** | Drivers, Compliance | Read/Write on Drivers; Read-only on others. |
| **Financial Analyst** | Fuel & Expenses, Analytics | Read/Write on Fuel, Expenses; Read-only on Reports & Analytics. |

*Note: In the demo build, a managed "Driver" is a data entity, not a login account.*

---

## 2. Core Entities & Schema Constraints

Below is the database structure. All field names are case-sensitive and must match exactly across the frontend and database.

### 2.1 User
* **id**: `String` (UUID, Required, Unique, Read-Only)
* **name**: `String` (Required, Editable)
* **email**: `String` (Required, Unique, Editable, Email format)
* **passwordHash**: `String` (Required, Read-Only)
* **role**: `String` (Required, Enum: `Fleet Manager` \| `Dispatcher` \| `Safety Officer` \| `Financial Analyst`, Read-Only)
* **failedLoginCount**: `Int` (Required, Default: `0`, Read-Only)
* **lockedUntil**: `DateTime` (Optional, Read-Only)
* **createdAt**: `DateTime` (Required, Default: `now()`, Read-Only)

### 2.2 Vehicle
* **id**: `String` (UUID, Required, Unique, Read-Only)
* **registrationNumber**: `String` (Required, Unique, Editable, Alphanumeric + hyphens, max 20 chars)
* **name**: `String` (Required, Editable, max 100 chars)
* **type**: `String` (Required, Editable, Enum: `Van` \| `Truck`)
* **maxLoadCapacity**: `Float` (Required, Editable, Positive number)
* **odometer**: `Float` (Required, Editable, Non-negative, Default: `0.0`)
* **acquisitionCost**: `Float` (Required, Editable, Positive number)
* **region**: `String` (Optional, Editable)
* **status**: `String` (Required, Default: `Available`, Enum: `Available` \| `On Trip` \| `In Shop` \| `Retired`)

### 2.3 Driver
* **id**: `String` (UUID, Required, Unique, Read-Only)
* **name**: `String` (Required, Editable, max 100 chars)
* **licenseNumber**: `String` (Required, Unique, Editable)
* **licenseCategory**: `String` (Required, Editable)
* **licenseExpiryDate**: `DateTime` (Required, Editable, Future date on creation)
* **contactNumber**: `String` (Required, Editable, 10–15 digits)
* **safetyScore**: `Float` (Required, Editable, Range: `0.0` - `100.0`, Default: `100.0`)
* **tripCompletionPct**: `Float` (Required, Editable, Range: `0.0` - `100.0`, Default: `0.0`)
* **status**: `String` (Required, Default: `Available`, Enum: `Available` \| `On Trip` \| `Off Duty` \| `Suspended`)

### 2.4 Trip
* **id**: `String` (UUID, Required, Unique, Read-Only)
* **source**: `String` (Required, Editable, max 200 chars)
* **destination**: `String` (Required, Editable, max 200 chars)
* **vehicleId**: `String` (Required, FK to Vehicle, Editable on Draft)
* **driverId**: `String` (Required, FK to Driver, Editable on Draft)
* **cargoWeight**: `Float` (Required, Editable on Draft, Positive number, $\le$ Vehicle max capacity)
* **plannedDistance**: `Float` (Required, Editable on Draft, Positive number)
* **revenue**: `Float` (Optional, Editable, Positive number)
* **status**: `String` (Required, Default: `Draft`, Enum: `Draft` \| `Dispatched` \| `Completed` \| `Cancelled`)
* **startOdometer**: `Float` (Optional, Set automatically on Dispatch)
* **endOdometer**: `Float` (Optional, Required on Complete, $\ge$ startOdometer)
* **fuelConsumed**: `Float` (Optional, Required on Complete, Positive number)
* **createdAt**: `DateTime` (Required, Default: `now()`, Read-Only)

### 2.5 MaintenanceLog
* **id**: `String` (UUID, Required, Unique, Read-Only)
* **vehicleId**: `String` (Required, FK to Vehicle, Read-Only)
* **description**: `String` (Required, Editable)
* **cost**: `Float` (Required, Editable, Positive number)
* **startDate**: `DateTime` (Required, Default: `now()`, Read-Only)
* **endDate**: `DateTime` (Optional, Set automatically on Close)
* **isOpen**: `Boolean` (Required, Default: `true`, Read-Only)

### 2.6 FuelLog
* **id**: `String` (UUID, Required, Unique, Read-Only)
* **vehicleId**: `String` (Required, FK to Vehicle, Read-Only)
* **liters**: `Float` (Required, Editable, Positive number)
* **cost**: `Float` (Required, Editable, Positive number)
* **date**: `DateTime` (Required, Default: `now()`, Editable)

### 2.7 Expense
* **id**: `String` (UUID, Required, Unique, Read-Only)
* **vehicleId**: `String` (Required, FK to Vehicle, Read-Only)
* **category**: `String` (Required, Editable, Enum: `Fuel` \| `Toll` \| `Maintenance` \| `Other`)
* **amount**: `Float` (Required, Editable, Positive number)
* **description**: `String` (Required, Editable)
* **date**: `DateTime` (Required, Default: `now()`, Editable)

---

## 3. API Contract & Response Shapes

### 3.1 Authentication

#### `POST /api/auth/login`
Authenticates user, starts session via cookie, locks account on 5 consecutive failures.
* **Request Body:**
  ```json
  {
    "email": "dispatcher@transitops.com",
    "password": "password123"
  }
  ```
* **Success Response (200 OK):**
  ```json
  {
    "success": true,
    "user": {
      "id": "u-uuid-2",
      "name": "Dana Dispatcher",
      "email": "dispatcher@transitops.com",
      "role": "Dispatcher"
    }
  }
  ```
* **Error Response (401 Unauthorized - Invalid credentials):**
  ```json
  {
    "success": false,
    "message": "Invalid email or password. 4 attempts remaining."
  }
  ```
* **Error Response (403 Forbidden - Account Locked):**
  ```json
  {
    "success": false,
    "message": "Account locked due to too many failed attempts. Try again later."
  }
  ```

#### `POST /api/auth/logout`
Clears session cookie.
* **Success Response (200 OK):**
  ```json
  { "success": true }
  ```

---

### 3.2 Vehicles

#### `GET /api/vehicles`
* **Query Parameters:**
  * `type` (optional): `Van` \| `Truck`
  * `status` (optional): `Available` \| `On Trip` \| `In Shop` \| `Retired`
  * `search` (optional): Search string (matches `registrationNumber` or `name` case-insensitively)
* **Success Response (200 OK):**
  ```json
  [
    {
      "id": "v-uuid-5",
      "registrationNumber": "VAN-05",
      "name": "Nissan NV250 Cargo",
      "type": "Van",
      "maxLoadCapacity": 500.0,
      "odometer": 12000.0,
      "acquisitionCost": 24000.0,
      "region": "East",
      "status": "Available"
    }
  ]
  ```

#### `POST /api/vehicles`
* **Request Body:**
  ```json
  {
    "registrationNumber": "VAN-06",
    "name": "Renault Kangoo",
    "type": "Van",
    "maxLoadCapacity": 650.0,
    "odometer": 0.0,
    "acquisitionCost": 18500.0,
    "region": "North"
  }
  ```
* **Success Response (201 Created):**
  ```json
  {
    "success": true,
    "vehicle": {
      "id": "v-uuid-new",
      "registrationNumber": "VAN-06",
      "name": "Renault Kangoo",
      "type": "Van",
      "maxLoadCapacity": 650.0,
      "odometer": 0.0,
      "acquisitionCost": 18500.0,
      "region": "North",
      "status": "Available"
    }
  }
  ```
* **Validation Error (400 Bad Request):**
  ```json
  {
    "success": false,
    "errors": {
      "registrationNumber": "Registration number already exists"
    }
  }
  ```

#### `POST /api/vehicles/[id]/retire`
Sets vehicle status to `Retired` permanently.
* **Success Response (200 OK):**
  ```json
  {
    "success": true,
    "vehicle": {
      "id": "v-uuid-5",
      "registrationNumber": "VAN-05",
      "status": "Retired"
    }
  }
  ```

---

### 3.3 Drivers

#### `GET /api/drivers`
* **Query Parameters:**
  * `status` (optional): `Available` \| `On Trip` \| `Off Duty` \| `Suspended`
  * `search` (optional): Search string (matches `name` or `licenseNumber`)
* **Success Response (200 OK):**
  ```json
  [
    {
      "id": "d-uuid-1",
      "name": "Alex Driver",
      "licenseNumber": "LIC-ALEX99",
      "licenseCategory": "Class A",
      "licenseExpiryDate": "2028-12-31T00:00:00.000Z",
      "contactNumber": "555-0101",
      "safetyScore": 98.0,
      "tripCompletionPct": 95.0,
      "status": "Available"
    }
  ]
  ```

#### `POST /api/drivers`
* **Request Body:**
  ```json
  {
    "name": "Grace Hopper",
    "licenseNumber": "LIC-GRACE77",
    "licenseCategory": "Class B",
    "licenseExpiryDate": "2027-05-15T00:00:00.000Z",
    "contactNumber": "555-0109"
  }
  ```
* **Success Response (201 Created):**
  ```json
  {
    "success": true,
    "driver": {
      "id": "d-uuid-new",
      "name": "Grace Hopper",
      "licenseNumber": "LIC-GRACE77",
      "status": "Available"
    }
  }
  ```
* **Validation Error (400 Bad Request):**
  ```json
  {
    "success": false,
    "errors": {
      "licenseExpiryDate": "License expiry date cannot be in the past"
    }
  }
  ```

#### `PATCH /api/drivers/[id]/status`
* **Request Body:**
  ```json
  { "status": "Suspended" }
  ```
* **Success Response (200 OK):**
  ```json
  {
    "success": true,
    "driver": {
      "id": "d-uuid-1",
      "status": "Suspended"
    }
  }
  ```

---

### 3.4 Trips

#### `GET /api/trips`
* **Query Parameters:**
  * `status` (optional): `Draft` \| `Dispatched` \| `Completed` \| `Cancelled`
  * *Note: Polled every 15 seconds with `?status=Dispatched` for the Live Board.*
* **Success Response (200 OK):**
  ```json
  [
    {
      "id": "t-uuid-1",
      "source": "Warehouse A",
      "destination": "Terminal B",
      "cargoWeight": 450.0,
      "plannedDistance": 240.0,
      "revenue": 1200.0,
      "status": "Draft",
      "vehicleId": "v-uuid-5",
      "driverId": "d-uuid-1",
      "vehicle": {
        "registrationNumber": "VAN-05",
        "name": "Nissan NV250 Cargo",
        "status": "Available"
      },
      "driver": {
        "name": "Alex Driver",
        "licenseNumber": "LIC-ALEX99",
        "status": "Available"
      }
    }
  ]
  ```

#### `POST /api/trips`
Creates a `Draft` trip. Evaluates cargo weight vs vehicle capacity.
* **Request Body:**
  ```json
  {
    "source": "Warehouse A",
    "destination": "Terminal B",
    "vehicleId": "v-uuid-5",
    "driverId": "d-uuid-1",
    "cargoWeight": 450.0,
    "plannedDistance": 240.0,
    "revenue": 1200.0
  }
  ```
* **Success Response (201 Created):**
  ```json
  {
    "success": true,
    "trip": {
      "id": "t-uuid-1",
      "status": "Draft",
      "cargoWeight": 450.0
    }
  }
  ```
* **Validation Error (400 Bad Request - Capacity Exceeded):**
  ```json
  {
    "success": false,
    "errors": {
      "cargoWeight": "Cargo weight exceeds vehicle capacity"
    }
  }
  ```

#### `POST /api/trips/[id]/dispatch`
Executes transaction. Validates: driver license valid, driver available, vehicle available, weight fits. Flips both vehicle and driver to `On Trip`, captures vehicle odometer.
* **Success Response (200 OK):**
  ```json
  {
    "success": true,
    "trip": {
      "id": "t-uuid-1",
      "status": "Dispatched",
      "startOdometer": 12000.0
    }
  }
  ```
* **Error Response (400 Bad Request - Driver Suspended/Expired):**
  ```json
  {
    "success": false,
    "message": "Driver license is expired"
  }
  ```

#### `POST /api/trips/[id]/complete`
Finishes dispatch. Validates endOdometer $\ge$ startOdometer. Flips vehicle and driver to `Available`, updates vehicle odometer, creates `FuelLog` & `Expense` for fuel.
* **Request Body:**
  ```json
  {
    "endOdometer": 12240.0,
    "fuelConsumed": 40.0
  }
  ```
* **Success Response (200 OK):**
  ```json
  {
    "success": true,
    "trip": {
      "id": "t-uuid-1",
      "status": "Completed",
      "endOdometer": 12240.0
    }
  }
  ```

#### `POST /api/trips/[id]/cancel`
Cancels dispatched trip. Restores vehicle and driver to `Available`.
* **Success Response (200 OK):**
  ```json
  {
    "success": true,
    "trip": {
      "id": "t-uuid-1",
      "status": "Cancelled"
    }
  }
  ```

---

### 3.5 Maintenance

#### `POST /api/maintenance`
Opens a log. Transitions vehicle from `Available` $\rightarrow$ `In Shop`.
* **Request Body:**
  ```json
  {
    "vehicleId": "v-uuid-5",
    "description": "Oil Change",
    "cost": 80.0
  }
  ```
* **Success Response (201 Created):**
  ```json
  {
    "success": true,
    "log": {
      "id": "m-uuid-new",
      "vehicleId": "v-uuid-5",
      "description": "Oil Change",
      "cost": 80.0,
      "isOpen": true
    }
  }
  ```

#### `POST /api/maintenance/[id]/close`
Closes a log. Restores vehicle to `Available` (unless status is `Retired`).
* **Success Response (200 OK):**
  ```json
  {
    "success": true,
    "log": {
      "id": "m-uuid-new",
      "isOpen": false,
      "endDate": "2026-07-12T12:00:00.000Z"
    }
  }
  ```

---

### 3.6 Fuel & Expenses

#### `POST /api/fuel-expenses`
Manually logs a fuel/expense entry.
* **Request Body (Fuel Type):**
  ```json
  {
    "vehicleId": "v-uuid-5",
    "type": "Fuel",
    "liters": 25.0,
    "amount": 37.50,
    "description": "Fuel Refill",
    "date": "2026-07-12T10:00:00.000Z"
  }
  ```
* **Request Body (Other Type):**
  ```json
  {
    "vehicleId": "v-uuid-5",
    "type": "Expense",
    "category": "Toll",
    "amount": 15.00,
    "description": "Highway Toll Card",
    "date": "2026-07-12T11:00:00.000Z"
  }
  ```
* **Success Response (201 Created):**
  ```json
  {
    "success": true,
    "id": "e-uuid-new"
  }
  ```

---

### 3.7 Reports & Analytics

#### `GET /api/reports`
Returns all metrics, fuel efficiency, ROI per vehicle, and total operational cost.
* **Success Response (200 OK):**
  ```json
  {
    "summary": {
      "avgFuelEfficiency": 6.67,
      "totalFleetCost": 1562.50,
      "avgRoi": 0.026,
      "fleetUtilization": 20.0
    },
    "vehicles": [
      {
        "registrationNumber": "VAN-01",
        "name": "Ford Transit 2021",
        "type": "Van",
        "odometer": 15000.0,
        "totalOperationalCost": 132.50,
        "calculatedRoi": 0.0279,
        "status": "Available"
      }
    ]
  }
  ```

---

## 4. Realistic Seed Data Plan

The following records are injected into the database via `npx prisma db seed` (defined in [seed.ts](file:///c:/Users/sanke/Desktop/New%20folder/chanakya/prisma/seed.ts)) to provide a functional and rich dataset for immediate demo and testing.

### 4.1 Users (Passwords: `password123`)
* **Fleet Manager:** `manager@transitops.com`
* **Dispatcher:** `dispatcher@transitops.com`
* **Safety Officer:** `safety@transitops.com`
* **Financial Analyst:** `finance@transitops.com`

### 4.2 Vehicles
| Reg. No | Name/Model | Type | Capacity | Odometer | Cost | Region | Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `VAN-01` | Ford Transit 2021 | Van | 600 kg | 15,000 km | \$25,000 | East | `Available` |
| `TRK-02` | Volvo FH16 Heavy | Truck | 5,000 kg | 85,000 km | \$75,000 | West | `On Trip` |
| `TRK-03` | Scania R500 Flatbed | Truck | 8,000 kg | 120,000 km | \$95,000 | North | `In Shop` |
| `VAN-04` | Mercedes Sprinter 2018 | Van | 800 kg | 300,000 km | \$22,000 | South | `Retired` |
| `VAN-05` | Nissan NV250 Cargo | Van | 500 kg | 12,000 km | \$24,000 | East | `Available` |

### 4.3 Drivers
| Name | License No | Cat | Expiry | Safety Score | Completion % | Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Alex Driver** | LIC-ALEX99 | Class A | `2028-12-31` | 98 | 95% | `Available` |
| **Bob Driver** | LIC-BOB88 | Class A | `2027-06-30` | 92 | 90% | `On Trip` |
| **Charlie Driver** | LIC-CHARLIE77 | Class B | `2025-03-01` (Expired) | 80 | 85% | `Available` |
| **David Driver** | LIC-DAVID66 | Class A | `2026-10-15` | 45 | 70% | `Suspended` |
| **Emma Driver** | LIC-EMMA55 | Class B | `2027-11-20` | 95 | 92% | `Off Duty` |

### 4.4 Trips
* **Trip 1 (Draft - Demo Target):** `Warehouse A` $\rightarrow$ `Terminal B` \| Cargo: 450 kg \| Distance: 240 km \| Vehicle: `VAN-05` \| Driver: `Alex` \| Status: `Draft`.
* **Trip 2 (Dispatched - Active):** `Terminal C` $\rightarrow$ `Port D` \| Cargo: 4,000 kg \| Distance: 500 km \| Vehicle: `TRK-02` \| Driver: `Bob` \| Status: `Dispatched` \| Start Odometer: 84,500 km.
* **Trip 3 (Completed - History):** `Depot X` $\rightarrow$ `Warehouse Y` \| Cargo: 300 kg \| Distance: 100 km \| Vehicle: `VAN-01` \| Driver: `Alex` \| Status: `Completed` \| Start Odometer: 14,900 km \| End Odometer: 15,000 km \| Fuel: 15 L \| Revenue: \$800.

### 4.5 Maintenance Logs
* **Log 1 (Open):** Vehicle: `TRK-03` \| Description: `Engine Overhaul` \| Cost: \$1,200 \| Status: `Open`.
* **Log 2 (Closed):** Vehicle: `VAN-01` \| Description: `Oil Change` \| Cost: \$80 \| Status: `Closed`.

### 4.6 Fuel Logs & Expenses
* **Fuel Log 1 (Trip 3):** Vehicle: `VAN-01` \| Liters: 15 L \| Cost: \$22.50.
* **Fuel Log 2 (Regular):** Vehicle: `VAN-01` \| Liters: 20 L \| Cost: \$30.00.
* **Fuel Log 3 (Active TRK):** Vehicle: `TRK-02` \| Liters: 120 L \| Cost: \$180.00.
* **Expense 1 (Maint Log 2):** Vehicle: `VAN-01` \| Category: `Maintenance` \| Amount: \$80.00.
* **Expense 2 (Fuel Log 1):** Vehicle: `VAN-01` \| Category: `Fuel` \| Amount: \$22.50.
* **Expense 3 (Fuel Log 2):** Vehicle: `VAN-01` \| Category: `Fuel` \| Amount: \$30.00.
* **Expense 4 (Fuel Log 3):** Vehicle: `TRK-02` \| Category: `Fuel` \| Amount: \$180.00.
* **Expense 5 (Tolls):** Vehicle: `TRK-02` \| Category: `Other` \| Amount: \$50.00.

---

## 5. Official Acceptance Demo Workflow

Follow these exact steps when conducting the evaluation/demo of the application:

1. **Login & Role Navigation Check**
   * Log in using email `dispatcher@transitops.com` and password `password123`.
   * Confirm the sidebar navigation displays **Dashboard** and **Trips** (per dispatcher access) but hides **Fleet** and **Drivers**.
   * Log out. Log in as `manager@transitops.com`. Confirm access to **Fleet** and **Maintenance** is restored.
   * Log out. Log in as `dispatcher@transitops.com` again to perform dispatch duties.

2. **Dashboard Overview**
   * Verify the KPI Cards load using seed data metrics:
     * *Active Trips:* 1 (Trip 2 is dispatched)
     * *Vehicles in Maintenance:* 1 (TRK-03 is In Shop)
     * *Drivers on Duty (On Trip):* 1 (Bob)
   * Verify the proportional bar chart/breakdown shows the correct counts.

3. **Verify Blocked Validation 1: Overweight Cargo**
   * Navigate to **Trips** $\rightarrow$ Create Trip.
   * Fill details: Source: `Warehouse A`, Destination: `Terminal B`, Vehicle: `VAN-05` (Capacity: 500 kg), Driver: `Alex`.
   * Enter Cargo Weight: `550` kg.
   * **Verification:** The "Dispatch" button is disabled. An inline warning displays: *"Capacity exceeded by 50 kg — dispatch blocked"*.

4. **Verify Blocked Validation 2: Expired License**
   * Change Driver selection to `Charlie Driver` (License Expired). Reset Cargo Weight to `450` kg.
   * **Verification:** The "Dispatch" button is disabled. An inline warning displays: *"Driver license is expired"*.

5. **Verify Blocked Validation 3: Suspended Status**
   * Change Driver selection to `David Driver` (Status: Suspended).
   * **Verification:** The "Dispatch" button remains disabled. An inline warning displays: *"Driver is suspended"*.

6. **The Success Dispatch Cascade**
   * Change Driver back to `Alex Driver` (Status: Available, valid license) and Vehicle to `VAN-05` (Status: Available).
   * Cargo Weight is `450` kg.
   * Click **Dispatch**.
   * **Verification:**
     * The trip status transitions to `Dispatched`.
     * The vehicle `VAN-05` status transitions from `Available` $\rightarrow$ `On Trip` in the Fleet page.
     * The driver `Alex` status transitions from `Available` $\rightarrow$ `On Trip` in the Drivers page.
     * The trip's `startOdometer` is automatically stamped as `12,000` km (captured from vehicle `VAN-05`).

7. **Live Board Polling**
   * Open the **Live Board** tab.
   * Verify that both `TRK-02` (Trip 2) and `VAN-05` (Trip 1) show up as active dispatched trips.
   * Wait 15 seconds: Verify that a network poll is executed automatically.

8. **Trip Completion Cascade**
   * Locate Trip 1 (`VAN-05` / `Alex`) on the Trips page. Click **Complete**.
   * Enter End Odometer: `12,240` km (representing 240 km driven). Enter Fuel Consumed: `40` L.
   * Click **Complete**.
   * **Verification:**
     * Trip status transitions to `Completed`.
     * Vehicle `VAN-05` status reverts from `On Trip` $\rightarrow$ `Available`.
     * Driver `Alex` status reverts from `On Trip` $\rightarrow$ `Available`.
     * Vehicle `VAN-05` odometer updates from `12,000` $\rightarrow$ `12,240` km.
     * A `FuelLog` entry is automatically created for `VAN-05` with `40` liters.
     * A corresponding `Expense` entry under category `Fuel` is created.

9. **Maintenance Transition**
   * Log in as Fleet Manager (`manager@transitops.com`).
   * Navigate to **Fleet** (confirming `VAN-05` is `Available` with `12,240` km).
   * Navigate to **Maintenance** $\rightarrow$ Log Service Record.
   * Select Vehicle: `VAN-05`, Description: `Brake pad replacement`, Cost: `150`.
   * **Verification:**
     * Maintenance record is created with status `Open`.
     * Vehicle `VAN-05` status transitions from `Available` $\rightarrow$ `In Shop`.
     * Navigate to **Trips** and create a new trip: verify `VAN-05` is no longer selectable in the available vehicle pool.
   * In **Maintenance**, mark the Brake replacement record as **Closed**.
   * **Verification:**
     * Maintenance record transitions to `Closed`.
     * Vehicle `VAN-05` status reverts to `Available`.

10. **Reports & ROI Validation**
    * Log in as Financial Analyst (`finance@transitops.com`).
    * Open **Analytics & Reports**.
    * Verify `VAN-01` metrics:
      * Fuel Efficiency computes to: $100\text{ km} / 15\text{ L} = 6.67\text{ km/L}$.
      * Total Operational Cost computes to: $\$22.50\text{ (fuel)} + \$30.00\text{ (fuel)} + \$80.00\text{ (maintenance)} = \$132.50$.
      * Vehicle ROI computes to: $\frac{\$800\text{ (revenue)} - \$132.50\text{ (cost)}}{\$25,000\text{ (acquisition cost)}} = 0.0267\text{ (2.67\%)}$.

11. **Failed Login Lockout**
    * Log out.
    * Attempt to log in to `dispatcher@transitops.com` with incorrect passwords 5 times.
    * **Verification:** On the 5th attempt, the inline warning displays: *"Account locked due to too many failed attempts. Try again later."* The login button remains disabled.

---

## 6. Development Integration Checklist

Ensure all implementation tasks conform to the following schema definitions and routing guidelines to avoid integration discrepancies:

- [ ] **Exact Table Schemas:** Ensure database models correspond to the capitalization and names specified in Section 2 (e.g. `registrationNumber` instead of `reg_num`, `licenseExpiryDate` instead of `expiry`).
- [ ] **Centralized State Transitions:** All status changes (e.g. `Available` $\leftrightarrow$ `On Trip` \| `Available` $\rightarrow$ `In Shop`) **MUST** call the transactions defined in `src/lib/transitions.ts` to ensure consistency.
- [ ] **Endpoint Names & Verbs:**
  * Login: `POST /api/auth/login`
  * Logout: `POST /api/auth/logout`
  * Vehicles: `GET /api/vehicles`, `POST /api/vehicles`, `POST /api/vehicles/[id]/retire`
  * Drivers: `GET /api/drivers`, `POST /api/drivers`, `PATCH /api/drivers/[id]/status`
  * Trips: `GET /api/trips`, `POST /api/trips`, `POST /api/trips/[id]/dispatch`, `POST /api/trips/[id]/complete`, `POST /api/trips/[id]/cancel`
  * Maintenance: `POST /api/maintenance`, `POST /api/maintenance/[id]/close`
  * Fuel/Expenses: `POST /api/fuel-expenses`
  * Reports: `GET /api/reports`
- [ ] **Validation Standards:** Confirm all input validation rules in Section 6 of the PRD are executed server-side in API route handler validations (e.g., throwing a `400` status with structured keys matching the field names).
- [ ] **Role Mapping Names:** Ensure the roles in the database are EXACTLY: `Fleet Manager`, `Dispatcher`, `Safety Officer`, `Financial Analyst` (case and space-sensitive).
- [ ] **Status String Literals:**
  * Vehicle Statuses: `Available`, `On Trip`, `In Shop`, `Retired`
  * Driver Statuses: `Available`, `On Trip`, `Off Duty`, `Suspended`
  * Trip Statuses: `Draft`, `Dispatched`, `Completed`, `Cancelled`
  * Expense Categories: `Fuel`, `Toll`, `Maintenance`, `Other`
- [ ] **Seeding Reference Match:** Verify local database seeding results match the exact properties defined in the realistic dataset plan to avoid mismatch issues in UI rendering.
