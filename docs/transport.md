# PRODUCT REQUIREMENT DOCUMENT (PRD): TRANSITOPS SMART TRANSPORT OPERATIONS PLATFORM

## 1. Business Context & Target Audience

### 1.1 Business Context

Modern logistics operations frequently experience severe inefficiencies caused by a reliance on fragmented manual processes, offline spreadsheets, and paper logbooks. This technological debt introduces significant operational vulnerabilities, including:

- Systemic vehicle scheduling conflicts resulting in low asset utilization.
- Unmonitored preventative maintenance cycles, causing premature asset failure.
- Regulatory compliance risks, such as drivers operating with expired commercial driver's licenses.
- Inaccurate expense tracking, making it difficult to compute the total cost of ownership (Fuel + Tolls + Maintenance) and determine the exact return on investment (ROI) of fleet assets.

The TransitOps platform resolves these operational challenges by offering a centralized, digital system to manage the entire transport operations lifecycle. By implementing automated state validation rules at both the API and database levels, the platform eliminates scheduling conflicts, ensures strict safety compliance, and delivers real-time financial and operational insights.

### 1.2 Target Personas & User Classes

The system is built to support four distinct roles, with interfaces and permissions tailored to each user class:

| Persona / User Class | Operational Core Focus | Key Responsibilities |
| :--- | :--- | :--- |
| **Fleet Manager** | Asset Lifecycle & Service Schedules | Manages vehicle registration, monitors lifecycle status, schedules preventative maintenance, and tracks overall fleet utilization. |
| **Driver** | Operational Execution & Fuel Logging | Views assigned dispatches, executes active trips, records vehicle odometer readings, and logs fuel receipts. |
| **Safety Officer** | Operator Compliance & Driver Safety | Monitors driver safety scores, validates commercial license compliance, monitors upcoming license expirations, and manages driver suspensions. |
| **Financial Analyst** | Cost Auditing & Fleet Optimization | Analyzes operating expenditures (fuel, maintenance, tolls), evaluates vehicle ROI, and exports comprehensive data reports. |

## 2. Core Functional Requirements

The platform is divided into eight primary functional modules, designed to support rapid implementation within the constraints of an 8-hour development cycle:

```text
┌────────────────────────────────────────────────────────────────────────┐
│                          TRANSITOPS ECOSYSTEM                          │
├────────────────────────────────────────────────────────────────────────┤
│  1. Authentication & Role-Based Access Control (RBAC)                  │
│  2. Live Operations KPI Dashboard & Analytics Summary                  │
│  3. Master Vehicle Registry & Lifecycle State Engine                   │
│  4. Driver Onboarding, Profile Directory & License Compliance          │
│  5. Dispatch Engine & Transactional Trip Lifecycle Validation          │
│  6. Garage Operations & Auto-Locking Maintenance Logs                  │
│  7. Financial Ledger, Expense Allocations & Fuel Logging               │
│  8. Dynamic CSV Reporting Engine & Automated Document Watchdog         │
└────────────────────────────────────────────────────────────────────────┘
```

### 2.1 Authentication & Authorization

- **Secure Login**: Access to system resources requires validation via a verified email address and a cryptographically salted/hashed password.
- **Role-Based Access Control (RBAC)**: Supports four explicit user roles: `FLEET_MANAGER`, `DRIVER`, `SAFETY_OFFICER`, and `FINANCIAL_ANALYST`.
- **Route & Endpoint Protection**: Frontend routes must check user sessions before loading, and backend endpoints must validate JWT claims to block unauthorized state modifications.

### 2.2 Live Operations Dashboard

- **Interactive KPI Grid**: Displays real-time metrics, including: Active Vehicles, Available Vehicles, Vehicles in Maintenance, Active Trips, Pending Trips, Drivers On Duty, and Fleet Utilization Rate (%).
- **Dynamic Views & Filters**: Allows filtering metrics instantly by vehicle type (e.g., Van, Truck, Semi), status, and operational region.
- **System Health Indicators**: Displays automated alert banners for vehicles undergoing maintenance or drivers with commercial licenses expiring within 30 days.

### 2.3 Master Vehicle Registry

- **Registry Profiles**: Tracks asset records containing: Registration Number (strictly unique), Vehicle Name/Model, Vehicle Type (e.g., Van, Truck, Semi), Maximum Load Capacity (in kg), Current Odometer (in km), Acquisition Cost, and Status.
- **Lifecycle State Tracking**: Vehicles must exist in one of four states: `Available`, `On Trip`, `In Shop`, or `Retired`.

### 2.4 Driver Profile Management

- **Compliance Directory**: Tracks driver profiles with fields including: Name, License Number (strictly unique), License Category (e.g., Class A CDL), License Expiry Date, Contact Number, Safety Score (0-100), and Status.
- **State Assignment**: Drivers must exist in one of four states: `Available`, `On Trip`, `Off Duty`, or `Suspended`.

### 2.5 Dispatch & Trip Management

- **Creation Interface**: Trip creation form containing: Source Location, Destination, Cargo Weight (in kg), Planned Distance (in km), Driver Selection, and Vehicle Selection.
- **Lifecycle Flow**: Standard trip state transitions: Draft $\rightarrow$ Dispatched $\rightarrow$ Completed or Cancelled.
- **Validation Checkpoint**: Block dispatch requests if cargo weight exceeds the selected vehicle's maximum load capacity, or if the selected driver has an expired license.

### 2.6 Maintenance & Garage Operations

- **Service Records**: Enables logging maintenance entries containing: Vehicle ID, Service Date, Description, and Repair Cost.
- **Status Automation**: Opening a maintenance ticket automatically shifts the vehicle's status to `In Shop`, removing it from the driver's dispatch selection pool. Closing the ticket returns the vehicle's status to `Available`.

### 2.7 Fuel & Expense Tracking

- **Financial Ledger**: Tracks operational expenses with fields including: Type (e.g., Fuel, Toll, Maintenance), Cost, Date, and Description.
- **Auto-Aggregation**: Computes total run costs per vehicle dynamically as trip logs, fuel charges, and maintenance tickets are recorded.

### 2.8 CSV Reporting Engine

- **Dynamic Table Filtering**: Users can search, sort, and filter data tables by column values.
- **CSV Data Export**: One-click download utility that generates client-side CSV files containing aggregated operational and financial performance metrics.

## 3. Technical Stack & Open-Source Adaptations

To accelerate development during the 8-hour hackathon, the platform utilizes a modern, unified TypeScript stack:

### 3.1 Technology Stack Selection

- **Frontend**: Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS v4, and Shadcn UI.
- **Backend**: Node.js v20+ and Express.js (TypeScript).
- **Database & ORM**: PostgreSQL 16 and Prisma ORM.
- **State Management & Forms**: Zustand and React Hook Form.
- **Data Visualization**: Recharts (fully compatible with Tailwind v4 styling).
- **Caching**: Redis 7 (optional; used for JWT session invalidation and rate-limiting).

### 3.2 Open-Source Integration & Adaptation Blueprint

Rather than building core modules from scratch, TransitOps utilizes and adapts proven architectural patterns from established public repositories:

| Reference Repository | Blueprint Integration Layer | Adaptable Design Patterns & Utilities |
| :--- | :--- | :--- |
| [Sanjayt215/Fleet-Nimble](https://github.com/Sanjayt215/Fleet-Nimble) [cite: 11] | Core Backend API & DB Interface | Adapt Express router architectures, JWT authorization layers, and parameterized Prisma query patterns. |
| [arhamkhnz/next-shadcn-admin-dashboard](https://github.com/arhamkhnz/next-shadcn-admin-dashboard) [cite: 25] | Responsive UI Shell & Data Tables | Adopt layout presets, collapsible sidebars, theme controllers (light/dark mode), and TanStack Table filters. |
| [Ahmed-Maher77/driver-scheduling-system](https://github.com/Ahmed-Maher77/driver-scheduling-system) [cite: 6] | Dispatch Constraints & Validation | Adapt backend validation logic, conflict checks, and animated table transitions. |
| [fatemeGheysari/Vehicle-Management-System-VMS](https://github.com/fatemeGheysari/Vehicle-Management-System-VMS) [cite: 8] | Service Records & Maintenance Logic | Adapt maintenance schemas, service invoice tracking, and cost calculation workflows. |
| [shubhendusangam/transport-management-system](https://github.com/shubhendusangam/transport-management-system) [cite: 15] | Financial Reporting & CSV Pipelines | Adapt multi-category expense aggregation utilities and local development seeding strategies. |

## 4. Entity-Relationship Model & Prisma Database Schema

TransitOps uses PostgreSQL to ensure strict data consistency, schema enforcement, and transaction safety. Below is the complete Prisma schema definition:

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

enum Role {
  FLEET_MANAGER
  DRIVER
  SAFETY_OFFICER
  FINANCIAL_ANALYST
}

enum VehicleStatus {
  AVAILABLE
  ON_TRIP
  IN_SHOP
  RETIRED
}

enum DriverStatus {
  AVAILABLE
  ON_TRIP
  OFF_DUTY
  SUSPENDED
}

enum TripStatus {
  DRAFT
  DISPATCHED
  COMPLETED
  CANCELLED
}

enum ExpenseCategory {
  FUEL
  TOLL
  MAINTENANCE
  OTHER
}

model User {
  id        String   @id @default(uuid())
  email     String   @unique
  password  String
  name      String
  role      Role
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@map("users")
}

model Vehicle {
  id              String           @id @default(uuid())
  regNumber       String           @unique
  name            String
  type            String
  maxCapacity     Float
  odometer        Float
  acquisitionCost Float
  status          VehicleStatus    @default(AVAILABLE)
  region          String
  trips           Trip[]
  maintenanceLogs MaintenanceLog[]
  fuelLogs        FuelLog[]
  expenses        Expense[]
  documents       Document[]
  createdAt       DateTime         @default(now())
  updatedAt       DateTime         @updatedAt

  @@map("vehicles")
}

model Driver {
  id            String       @id @default(uuid())
  name          String
  licenseNumber String       @unique
  category      String
  licenseExpiry DateTime
  contactNumber String
  safetyScore   Float        @default(100.0)
  status        DriverStatus @default(AVAILABLE)
  trips         Trip[]
  documents     Document[]
  createdAt     DateTime     @default(now())
  updatedAt     DateTime     @updatedAt

  @@map("drivers")
}

model Trip {
  id            String     @id @default(uuid())
  source        String
  destination   String
  cargoWeight   Float
  plannedDist   Float
  revenue       Float      @default(0.0)
  status        TripStatus @default(DRAFT)
  vehicleId     String
  vehicle       Vehicle    @relation(fields: [vehicleId], references: [id], onDelete: Restrict)
  driverId      String
  driver        Driver     @relation(fields: [driverId], references: [id], onDelete: Restrict)
  startOdometer Float?
  endOdometer   Float?
  fuelConsumed  Float?
  createdAt     DateTime   @default(now())
  updatedAt     DateTime   @updatedAt

  @@map("trips")
}

model MaintenanceLog {
  id          String    @id @default(uuid())
  vehicleId   String
  vehicle     Vehicle   @relation(fields: [vehicleId], references: [id], onDelete: Cascade)
  description String
  cost        Float
  startDate   DateTime  @default(now())
  endDate     DateTime?
  isOpen      Boolean   @default(true)
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt

  @@map("maintenance_logs")
}

model FuelLog {
  id        String   @id @default(uuid())
  vehicleId String
  vehicle   Vehicle  @relation(fields: [vehicleId], references: [id], onDelete: Cascade)
  liters    Float
  cost      Float
  date      DateTime @default(now())
  createdAt DateTime @default(now())

  @@map("fuel_logs")
}

model Expense {
  id          String          @id @default(uuid())
  vehicleId   String
  vehicle     Vehicle         @relation(fields: [vehicleId], references: [id], onDelete: Cascade)
  category    ExpenseCategory
  amount      Float
  description String?
  date        DateTime        @default(now())
  createdAt   DateTime        @default(now())

  @@map("expenses")
}

model Document {
  id         String   @id @default(uuid())
  title      String
  fileUrl    String
  expiryDate DateTime?
  vehicleId  String?
  vehicle    Vehicle? @relation(fields: [vehicleId], references: [id], onDelete: Cascade)
  driverId   String?
  driver     Driver?  @relation(fields: [driverId], references: [id], onDelete: Cascade)
  createdAt  DateTime @default(now())

  @@map("documents")
}
```

## 5. State Machine Dynamics & Concurrency Rules

The platform manages the states of vehicles, drivers, and dispatches using strict deterministic transition matrices. No state changes are processed in isolation; a change in one entity triggers automated updates across dependent entities to ensure consistency.

### 5.1 State Transitions Flowchart

```text
┌────────────────────────────────────────────────────────────────────────┐
│                        VEHICLE STATE LIFECYCLE                         │
│                                                                        │
│       ┌───────────────┐   Trip Dispatched    ┌───────────────┐         │
│       │               ├─────────────────────►│               │         │
│       │   AVAILABLE   │                      │    ON TRIP    │         │
│       │               │◄─────────────────────┤               │         │
│       └────┬─────▲────┘     Trip Completed   └───────────────┘         │
│            │     │                                                     │
│Maintenance │     │ Maintenance                                         │
│   Opened   │     │ Closed                                              │
│            ▼     │                                                     │
│       ┌────┴─────┴────┐                      ┌───────────────┐         │
│       │    IN SHOP    ├─────────────────────►│    RETIRED    │         │
│       └───────────────┘    Asset Retired     └───────────────┘         │
└────────────────────────────────────────────────────────────────────────┘
```

### 5.2 Transition Matrix and Rules

The table below maps the valid states, events, and automated cascades across the system:

| Target Model | Initial State | Trigger Event | Destination State | Validation Guards Enforced | Cascading Database Updates |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Trip** | Draft | Dispatch | Dispatched | Target vehicle status must be `Available`. Target driver status must be `Available` and hold a valid, unexpired license. Cargo weight must not exceed the vehicle's max capacity. | Updates both vehicle and driver statuses to `On Trip`. Captures the starting odometer reading from the vehicle profile. |
| **Trip** | Dispatched | Complete | Completed | Final odometer reading must be greater than or equal to the start odometer. Fuel consumed (in liters) must be recorded. | Updates the vehicle's odometer to the final value. Sets both the vehicle and driver statuses back to `Available`. Recalculates metrics. |
| **Trip** | Dispatched | Cancel | Cancelled | None. | Sets both the vehicle and driver statuses back to `Available`. |
| **Vehicle** | Available | Open Service | In Shop | Vehicle must not be assigned to an active trip. | Sets vehicle status to `In Shop`, immediately excluding it from future dispatch pools. |
| **Vehicle** | In Shop | Close Service | Available | Log must record the final maintenance cost. | Sets `isOpen` to `false`. Returns vehicle status to `Available` (unless its status has been set to `Retired`). |

### 5.3 Row-Level Concurrency Locking

To prevent race conditions—such as two dispatchers trying to assign the same available vehicle or driver simultaneously—the dispatch transaction must implement explicit database-level row locks using PostgreSQL's `SELECT ... FOR UPDATE` directive.

```sql
-- Step 1: Initialize transaction block
BEGIN;

-- Step 2: Lock the vehicle and driver records to block concurrent edits
SELECT id, status, "maxCapacity", odometer 
FROM vehicles 
WHERE id = 'v-uuid-101' 
FOR UPDATE;

SELECT id, status, "licenseExpiry" 
FROM drivers 
WHERE id = 'd-uuid-202' 
FOR UPDATE;

-- Step 3: Enforce business logic rules at the application/API layer
-- -> Confirm vehicle.status === 'AVAILABLE'
-- -> Confirm driver.status === 'AVAILABLE'
-- -> Confirm cargoWeight <= vehicle.maxCapacity
-- -> Confirm driver.licenseExpiry > CURRENT_TIMESTAMP

-- Step 4: Write the new dispatched trip record
INSERT INTO trips (id, source, destination, "cargoWeight", "plannedDist", status, "vehicleId", "driverId", "startOdometer")
VALUES ('t-uuid-303', 'Warehouse A', 'Terminal B', 450.0, 120.0, 'DISPATCHED', 'v-uuid-101', 'd-uuid-202', 12000.0);

-- Step 5: Transition locked asset statuses to block other bookings
UPDATE vehicles SET status = 'ON_TRIP' WHERE id = 'v-uuid-101';
UPDATE drivers SET status = 'ON_TRIP' WHERE id = 'd-uuid-202';

-- Step 6: Commit transaction, releasing all row locks
COMMIT;
```

## 6. Financial Formulations & Reporting Metrics

The reporting engine calculates operational performance and financial return metrics using PostgreSQL aggregation queries.

### 6.1 Formula Definitions

- **Fleet Utilization Rate (%)**: Measures the percentage of active, deployed assets:
  $$\text{FleetUtilizationRate} = \left(\frac{V_{\text{OnTrip}}}{V_{\text{Total}} - V_{\text{Retired}}}\right) \times 100$$

- **Fuel Efficiency (km/L)**: Evaluates fuel economy across completed trips:
  $$\text{FuelEfficiency} = \frac{\sum\text{DistanceCompleted}}{\sum\text{FuelConsumed}}$$

- **Total Operational Cost ($)**: Accumulates total expenses for a specific vehicle:
  $$\text{TotalOperationalCost} = \sum\text{Cost}_{\text{Fuel}} + \sum\text{Cost}_{\text{Maintenance}} + \sum\text{Cost}_{\text{Other}}$$

- **Vehicle Return on Investment (ROI)**: Measures the net profitability of an asset relative to its acquisition cost:
  $$\text{VehicleROI} = \frac{\text{Revenue} - \left(\sum\text{Cost}_{\text{Fuel}} + \sum\text{Cost}_{\text{Maintenance}} + \sum\text{Cost}_{\text{Other}}\right)}{\text{AcquisitionCost}}$$

### 6.2 Data Table Export Module

The frontend includes a utility to export fleet performance records to CSV. This module uses the client-side parsing library PapaParse to format data in the browser, reducing server-side processing load:

```typescript
import Papa from "papaparse";

export interface VehicleReportItem {
  regNumber: string;
  name: string;
  type: string;
  odometer: number;
  totalOperationalCost: number;
  calculatedROI: number;
  status: string;
}

export const generateFleetCSVExport = (data: VehicleReportItem[], filename: string) => {
  const formattedData = data.map((vehicle) => ({
    "Registration Number": vehicle.regNumber,
    "Model Name": vehicle.name,
    "Vehicle Type": vehicle.type,
    "Current Odometer (km)": vehicle.odometer,
    "Total Operational Cost ($)": vehicle.totalOperationalCost,
    "Calculated ROI": vehicle.calculatedROI.toFixed(4),
    "Current Status": vehicle.status,
  }));

  const csvContent = Papa.unparse(formattedData);
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const downloadLink = document.createElement("a");
  
  downloadLink.href = URL.createObjectURL(blob);
  downloadLink.setAttribute("download", `${filename}_export.csv`);
  document.body.appendChild(downloadLink);
  downloadLink.click();
  document.body.removeChild(downloadLink);
};
```

## 7. Compliance Verification & Automation Workers

To support the Safety Officer, TransitOps includes automated workers to monitor licensing and document compliance.

### 7.1 Automated Licensing Warning Worker

This scheduled worker runs daily to check for upcoming license expirations and send automated warning alerts:

```typescript
import { PrismaClient } from "@prisma/client";
import nodemailer from "nodemailer";

const prisma = new PrismaClient();

export const checkExpiringLicenses = async () => {
  const thirtyDaysFromNow = new Date();
  thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

  // Identify drivers with licenses expiring within a 30-day window
  const expiringDrivers = await prisma.driver.findMany({
    where: {
      licenseExpiry: {
        lte: thirtyDaysFromNow,
        gte: new Date(),
      },
    },
  });

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || "smtp.mailtrap.io",
    port: parseInt(process.env.SMTP_PORT || "2525"),
    auth: {
      user: process.env.SMTP_USER || "test_user",
      pass: process.env.SMTP_PASS || "test_password",
    },
  });

  for (const driver of expiringDrivers) {
    await transporter.sendMail({
      from: '"TransitOps Compliance" <compliance@transitops.co>',
      to: "safety-officer@transitops.co",
      subject: `COMPLIANCE ALERT: License Expiration for ${driver.name}`,
      text: `Driver ${driver.name} (License No: ${driver.licenseNumber}) has an expiring license on ${driver.licenseExpiry.toDateString()}. Please review their profile to prevent automatic dispatch suspension.`,
    });
  }
};
```

## 8. Frontend Interface Layout & Visual Hierarchy

The application interface is fully responsive, leveraging a layout built with Tailwind CSS and Shadcn UI components.

### 8.1 Administrative Dashboard Layout

The dashboard layout is designed to present operations cleanly:

```text
┌────────────────────────────────────────────────────────────────────────┐
│  TransitOps  │ User Profile: Safety Officer (RBAC Badge)  │ [☀️ / 🌙]    │
├──────────────┴─────────────────────────────────────────────────────────┤
│                                                                        │
│  Filter Bar: [Vehicle Type: Semi / Van ▾] [Status: Available ▾]        │
│                                                                        │
│  ┌───────────────────────┐ ┌───────────────────┐ ┌──────────────────┐  │
│  │ Drivers On Duty       │ │ Pending Trips     │ │ Vehicles in Shop │  │
│  │          24           │ │         3         │ │        5         │  │
│  └───────────────────────┘ └───────────────────┘ └──────────────────┘  │
│                                                                        │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │ Driver and Compliance Registry (Safety Officer View)             │  │
│  │ Search: [ Smith     ]                                            │  │
│  │ ┌──────────────────────────────────────────────────────────────┐ │  │
│  │ │ Name       │ License No│ Expiry Date│ Safety Score│ Status   │ │  │
│  │ ├────────────┼───────────┼────────────┼─────────────┼──────────┤ │  │
│  │ │ John Smith │ DL-980122 │ 2026-10-15 │ 98.5 (Good) │ On Trip  │ │  │
│  │ │ Jane Doe   │ DL-778901 │ 2025-04-02 │ 55.0 (Alert)│ Active   │ │  │
│  │ └────────────┴───────────┴────────────┴─────────────┴──────────┘ │  │
│  └──────────────────────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────────────────┘
```

### 8.2 Color-Coded Status and Visual Indicators

- **Green Indicators**: Assigned to assets in the `AVAILABLE` or `Draft` states.
- **Amber Indicators**: Assigned to assets in the `ON_TRIP` or `DISPATCHED` states.
- **Red Indicators**: Highlight urgent exceptions, such as assets `IN_SHOP`, `SUSPENDED`, `RETIRED`, or `CANCELLED`.

**Dark Mode Capability**: Built using native Tailwind CSS utility styles that automatically inherit user system preferences or toggle cleanly using a global client-side theme provider.

## 9. Implementation Strategy & 8-Hour Hackathon Agile Plan

To complete development, testing, and deployment within an 8-hour hackathon, developers will follow a structured hourly schedule:

```text
  Hour 0:00 ── Hour 1:00 ── Hour 2:00 ── Hour 3:00 ── Hour 4:00 ── Hour 5:00 ── Hour 6:00 ── Hour 7:00 ── Hour 8:00
  │            │            │            │            │            │            │            │            │
  ▼            ▼            ▼            ▼            ▼            ▼            ▼            ▼            ▼
┌────────────┬────────────┬────────────┬────────────┬────────────┬────────────┬────────────┬────────────┬────────────┐
│ Setup Core │ DB Schema  │ API CRUD & │ Validation │ Responsive │ Asset Lists│ Operations │ Financials │ End-To-End │
│ Containers │ Generation │ Role-Based │ Engine &   │ Shell &    │ & Form     │ & State    │ & Data     │ Quality    │
│ (Docker)   │ & Seeding  │ Token Auth │ Lock Tests │ Components │ Generation │ Logging    │ Export     │ Validation │
└────────────┴────────────┴────────────┴────────────┴────────────┴────────────┴────────────┴────────────┴────────────┘
```

### 9.1 Hourly Task Distribution

- **Hour 1 (0:00 - 1:00): Infrastructure Launch**
  - Set up the core database and optional Redis containers using a single Docker Compose script.
  - Initialize the project folders for the frontend (Next.js) and backend (Express/Prisma).
  - Verify database connection strings.

- **Hour 2 (1:00 - 2:00): Database Migration & Schema Seeding**
  - Push the Prisma database schema definition to build the tables.
  - Execute seed files to populate mock records, creating test assets, drivers, and users across all RBAC roles.

- **Hour 3 (2:00 - 3:00): Core API CRUD and Access Tokens**
  - Write Express routers to handle CRUD operations for vehicles and drivers.
  - Implement the JWT authentication system, generating tokens containing user role permissions.

- **Hour 4 (3:00 - 4:00): Concurrency Locking & Validation Layer**
  - Implement the database transaction function (`tx.$transaction`) for dispatches.
  - Add vehicle load capacity and driver license validation guards.
  - Run concurrent database execution scripts to test that row locks successfully block double-booking.

- **Hour 5 (4:00 - 5:00): Admin Shell Integration**
  - Connect the Next.js frontend application with the dashboard layout.
  - Implement frontend API routing and add persistent user session storage.

- **Hour 6 (5:00 - 6:00): Management Lists & Onboarding Forms**
  - Build interactive TanStack tables featuring client-side search, sorting, and filter controls.
  - Build driver registration and vehicle onboarding forms using client-side validation logic.

- **Hour 7 (6:00 - 7:00): Garage Logs & Operational Sub-ledgers**
  - Implement maintenance creation and resolution routes.
  - Add expense logging and fuel tracking APIs, connecting entries to their associated vehicles.

- **Hour 8 (7:00 - 8:00): Analytics Visualizations & Reports Export**
  - Connect Recharts components to visualize fleet utilization metrics and fuel consumption patterns.
  - Implement the client-side PapaParse CSV exporter.
  - Execute end-to-end verification tests to confirm state transitions and business validations function correctly.

## 10. Local Infrastructure & Docker Architecture

The local development environment runs inside a unified Docker container infrastructure:

```yaml
version: '3.8'

services:
  database:
    image: postgres:16-alpine
    container_name: transitops-postgres
    environment:
      POSTGRES_USER: dev_operator
      POSTGRES_PASSWORD: DefaultSecurePassword99
      POSTGRES_DB: transitops_engine
    ports:
      - "5432:5432"
    volumes:
      - pg_storage:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U dev_operator -d transitops_engine"]
      interval: 5s
      timeout: 5s
      retries: 5

  caching:
    image: redis:7-alpine
    container_name: transitops-redis
    ports:
      - "6379:6379"
    volumes:
      - redis_storage:/data
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 5s
      timeout: 5s
      retries: 5

volumes:
  pg_storage:
  redis_storage:
```

## 11. Core Verification Walkthrough Scenarios

This testing checklist validates that the system's operational logic, state cascades, and validation guards function correctly during a standard delivery lifecycle.

```text
┌──────────────────────────────────────────────────────────────────────────────────────┐
│                            OPERATIONAL WORKFLOW VALIDATION                           │
│                                                                                      │
│  [Step 1] Register Van-05 ──► [Step 2] Register Driver Alex ──► [Step 3] Create Trip │
│           (Capacity: 500kg)              (Valid License)             (Weight: 450kg) │
│                                                                                      │
│                                                                             │        │
│                                                                             ▼        │
│  [Step 6] Open Maintenance ◄── [Step 5] Complete Trip ◄── [Step 4] Dispatch          │
│           (Status: In Shop)              (Status: Available)        (Status: On Trip)│
└──────────────────────────────────────────────────────────────────────────────────────┘
```

### Step 1: Vehicle Onboarding

- **Action**: Register vehicle `Van-05` via `POST /api/vehicles`.
- **Payload**:
  ```json
  {
    "regNumber": "VAN-05",
    "name": "Ford Transit",
    "type": "Van",
    "maxCapacity": 500.0,
    "odometer": 12000.0,
    "acquisitionCost": 35000.0,
    "region": "Midwest"
  }
  ```
- **Expected API Response**: `201 Created`.
- **Database Verification**: A vehicle record is created with `status = "AVAILABLE"`.

### Step 2: Driver Onboarding

- **Action**: Onboard driver `Alex` via `POST /api/drivers`.
- **Payload**:
  ```json
  {
    "name": "Alex",
    "licenseNumber": "LIC-ALEX99",
    "category": "Class B CDL",
    "licenseExpiry": "2027-12-31T00:00:00.000Z",
    "contactNumber": "555-0199"
  }
  ```
- **Expected API Response**: `201 Created`.
- **Database Verification**: A driver record is created with `status = "AVAILABLE"`.

### Step 3: Trip Initialization

- **Action**: Create a new trip draft via `POST /api/trips`.
- **Payload**:
  ```json
  {
    "source": "Warehouse A",
    "destination": "Terminal B",
    "cargoWeight": 450.0,
    "plannedDist": 240.0,
    "vehicleId": "[ID_OF_VAN_05]",
    "driverId": "[ID_OF_ALEX]"
  }
  ```
- **Expected API Response**: `201 Created`.
- **Database Verification**: A trip record is created with `status = "DRAFT"`.

### Step 4: Dispatch Execution

- **Action**: Execute the dispatch transition via `POST /api/trips/[TRIP_ID]/dispatch`.
- **Expected Validation Process**:
  - Verify cargo weight ($450.0\text{ kg}$) does not exceed maximum capacity ($500.0\text{ kg}$).
  - Verify Alex's license is active and unexpired.
  - Check that both the vehicle and driver status are currently set to `AVAILABLE`.
- **Expected API Response**: `200 OK`.
- **Database Verification**:
  - Trip status transitions to `DISPATCHED`.
  - Both vehicle and driver statuses are atomically updated to `ON_TRIP`.
  - The trip's start odometer is set to $12000.0$.

### Step 5: Trip Completion

- **Action**: Log completion details via `POST /api/trips/[TRIP_ID]/complete`.
- **Payload**:
  ```json
  {
    "endOdometer": 12240.0,
    "fuelConsumed": 40.0,
    "revenue": 1200.0
  }
  ```
- **Expected Validation Process**: Verify that `endOdometer` ($12240.0$) is greater than or equal to `startOdometer` ($12000.0$).
- **Expected API Response**: `200 OK`.
- **Database Verification**:
  - Vehicle odometer is updated to $12240.0\text{ km}$.
  - Both the vehicle and driver statuses return to `AVAILABLE`.
  - The trip status transitions to `COMPLETED`.
  - A new `FuelLog` entry is created with $40.0\text{ liters}$.
  - The vehicle's calculated fuel efficiency is updated to $6.0\text{ km/L}$ ($240\text{ km} / 40\text{ L}$).

### Step 6: Preventative Maintenance Lock

- **Action**: Create a maintenance entry via `POST /api/maintenance`.
- **Payload**:
  ```json
  {
    "vehicleId": "[ID_OF_VAN_05]",
    "description": "Oil Change & Brake Service",
    "cost": 150.0
  }
  ```
- **Expected API Response**: `201 Created`.
- **Database Verification**:
  - A `MaintenanceLog` record is created.
  - Vehicle status automatically transitions to `IN_SHOP`.
  - Querying the active vehicles pool for a new dispatch verifies that 'Van-05' is successfully filtered out of the selection list.