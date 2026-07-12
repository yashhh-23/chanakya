<img src="https://r2cdn.perplexity.ai/pplx-full-logo-primary-dark%402x.png" style="height:64px;margin-right:32px"/>

# TransitOps — Final Product Requirements Document (PRD)

**Project:** Smart Transport Operations Platform
**Version:** 3.0 (Gap-Fixed — Hackathon Compliant)
**Format:** Hackathon build, 9:00–17:00 (8 hours), team of 4
**Reference mockup:** Excalidraw — 6 screens (Auth, Dashboard, Vehicle Registry, Drivers \& Safety, Trip Dispatcher, Maintenance)
**Date:** July 12, 2026

> **What changed from v2.0:** Six gaps were fixed to ensure full compliance with hackathon rules and the problem statement. Key fixes: database set to **PostgreSQL (local)**, Git workflow added, Screens 6 \& 7 wireframes added, driver-role decision documented, filter/sort added to Trip and Maintenance, full input validation added, and Live Board polling specified.

***

## 1. Overview

TransitOps is a centralized platform for logistics/transport operators to manage the full lifecycle of fleet operations — vehicle registry, driver compliance, trip dispatch, maintenance, and fuel/expense tracking — replacing manual spreadsheets and logbooks with a rule-enforced, auditable system.

The product is fundamentally a **state machine with RBAC on top**: vehicles and drivers move through defined statuses, trips and maintenance records are the triggers, and a small set of hard business rules gate every transition. Judged correctness will hinge on whether these rules are actually enforced in the running app, not just described in the UI.

Business drivers this solves: vehicle scheduling conflicts and low asset utilization, unmonitored maintenance cycles, drivers operating on expired licenses, and inaccurate expense/ROI tracking.

***

## 2. Objective \& Success Criteria

**Hackathon objective:** ship a working, demoable app that satisfies the Mandatory Deliverables (Section 10) end-to-end, using the example workflow (Section 9) as the acceptance test.

**Success criteria for the demo:**

- A judge can log in as each of the 4 roles and see role-scoped navigation exactly as specified.
- A judge can register a vehicle, add a driver, create and dispatch a trip, watch statuses cascade automatically, log maintenance, and see it reflected on the dashboard — without errors.
- At least one deliberately-blocked action is demonstrable live (e.g., overweight cargo, suspended driver, duplicate reg number) to prove validation is real, not cosmetic.

***

## 3. Explicit Non-Goals (Scope Exclusions)

Confirmed against the organizers' reference mockup (no map/live-tracking screen appears anywhere in the 6 reference screens or the nav):

- Live GPS / map-based vehicle tracking, or real-time location telemetry of any kind.
- Route optimization / turn-by-turn navigation.
- A full permissions-matrix editor for RBAC (roles are hard-coded, see Section 4).
- External API dependencies / cloud infra beyond what runs on a laptop.

Treat the "Live Board" on the Trip Dispatcher screen as a **polling-based, auto-refreshing list of trip statuses** — not a map.

**Optional / stretch — build only after Section 10's checklist is fully green:**

- PDF export.
- Vehicle/driver document management with expiry tracking.
- Automated license-expiry email reminders.
- Dashboard "expiring soon" alert banners.
- Dark mode.

***

## 4. User Roles \& RBAC

Roles and scoped access, taken directly from the reference mockup's login-screen footer:


| Role | Scoped Access | Responsibilities |
| :-- | :-- | :-- |
| Fleet Manager | Fleet, Maintenance | Oversees fleet assets, maintenance, vehicle lifecycle |
| Dispatcher | Dashboard, Trips | Creates trips, assigns vehicle/driver, monitors active deliveries |
| Safety Officer | Drivers, Compliance | Tracks license validity, safety scores, driver status |
| Financial Analyst | Fuel \& Expenses, Analytics | Reviews costs, fuel consumption, profitability |

**Dispatcher vs. Driver note:** The problem statement lists "Driver" as a target user. In this build, `Driver` is a **managed data entity** with a license, safety score, and status, not a login account. The login role is `Dispatcher`, who creates and assigns trips. During the demo/presentation, explain that the reference mockup explicitly shows Dispatcher, and a separate Driver login would require a larger scope.

**RBAC implementation note:** Role is fixed per account (set at creation). Treat the mockup's dropdown as a demo convenience. Every role requires authentication; unauthenticated users cannot reach any module.

***

## 5. Functional Requirements

### 5.1 Authentication (Screen 0)

- FR-1.1: Email + password login.
- FR-1.2: RBAC enforced on every route; nav items and page access scoped per Section 4 table.
- FR-1.3: Invalid credential error state shown inline.
- FR-1.4: Account lockout after 5 failed login attempts (counter resets on success).
- FR-1.5: "Forgot password" link present (stub acceptable for demo).
- FR-1.6: "Remember me" session persistence.


### 5.2 Dashboard (Screen 1)

- FR-2.1: KPI cards — Active Vehicles, Available Vehicles, Vehicles in Maintenance, Active Trips, Pending Trips, Drivers on Duty, Fleet Utilization (%).
- FR-2.2: Filters — Vehicle Type, Status, Region.
- FR-2.3: Recent Trips table — Trip ID, Vehicle, Driver, Status, ETA.
- FR-2.4: Vehicle Status breakdown bar (Available / On Trip / In Shop / Retired) as proportional bars.
- FR-2.5 *(stretch)*: Alert banner for vehicles in maintenance or drivers with licenses expiring within 30 days.


### 5.3 Vehicle Registry (Screen 2)

- FR-3.1: Master list — Reg. No. (unique), Name/Model, Type, Capacity, Odometer, Acquisition Cost, Status.
- FR-3.2: Add Vehicle action; registration number uniqueness enforced with inline error.
- FR-3.3: Search by reg. no. or name; filter by Type and Status; sort by any column header.
- FR-3.4: Retired/In Shop vehicles hidden from the Trip Dispatcher's vehicle picker.


### 5.4 Driver Management (Screen 3)

- FR-4.1: Profiles — Name, License No. (unique), Category, Expiry, Contact, Trip Completion %, Safety Score, Status.
- FR-4.2: Status toggle control — Available / On Trip / Off Duty / Suspended.
- FR-4.3: Expired license flagged visually inline in the table (e.g., "03/2025 EXPIRED").
- FR-4.4: Rule enforced: expired license or Suspended status blocks trip assignment.
- FR-4.5: Search by name or license number; filter by Status; sort by any column header.


### 5.5 Trip Dispatcher (Screen 4)

- FR-5.1: Visual trip lifecycle stepper — Draft → Dispatched → Completed / Cancelled.
- FR-5.2: Create Trip form — Source, Destination, Vehicle (Available only, capacity shown inline), Driver (Available only), Cargo Weight, Planned Distance.
- FR-5.3: Live capacity validation — cargo weight vs. selected vehicle's max load; Dispatch button disabled with inline error if exceeded ("Capacity exceeded by 200 kg — dispatch blocked").
- FR-5.4: **Live Board** — polling-based auto-refresh every **15 seconds**. Displays route, assigned vehicle/driver, status badge, and ETA or blocking reason.
- FR-5.5: On Complete: capture odometer + fuel log → feeds Expenses → vehicle \& driver revert to Available.
- FR-5.6: Trip table supports filter by Status and sort by created date and destination.


### 5.6 Maintenance (Screen 5)

- FR-6.1: Log Service Record form — Vehicle, Service Type/Description, Cost, Date, Status.
- FR-6.2: Service Log table — Vehicle, Service, Cost, Status.
- FR-6.3: Creating an active record automatically transitions vehicle Available → In Shop.
- FR-6.4: Closing a record transitions vehicle In Shop → Available (unless Retired).
- FR-6.5: In Shop vehicles are removed from the dispatch pool.
- FR-6.6: Maintenance table supports filter by Status and Vehicle; sort by date and cost.


### 5.7 Fuel \& Expenses (Screen 6)

**Wireframe spec:** Two-panel page. Left panel = fuel log form + fuel log table. Right panel = expense form + expense table. Bottom = auto-computed cost summary card per vehicle. Use the same dark card + table pattern as Screens 2–5.

- FR-7.1: Fuel logs — liters, cost, date, vehicle; search/filter by vehicle and date range.
- FR-7.2: Other expenses — category (Fuel / Toll / Maintenance / Other), cost, date, description; filter by category and vehicle.
- FR-7.3: Auto-computed total operational cost (Fuel + Maintenance + Other) per vehicle shown as a summary row below each table.
- FR-7.4: Sort both tables by date and cost.


### 5.8 Reports \& Analytics (Screen 7)

**Wireframe spec:** Top row = 4 metric summary cards (Avg Fuel Efficiency, Total Fleet Cost, Avg ROI, Fleet Utilization %). Below = tabbed view with tabs: "Fleet Report" (table + CSV export), "Fuel Efficiency" (bar chart per vehicle), "Operational Cost" (stacked bar by cost category), "Vehicle ROI" (bar chart). All charts use Recharts. Consistent dark theme.

- FR-8.1: Fuel Efficiency (Distance / Fuel) — see formula in Section 15.
- FR-8.2: Fleet Utilization.
- FR-8.3: Operational Cost per vehicle.
- FR-8.4: Vehicle ROI = (Revenue − (Maintenance + Fuel + Other)) / Acquisition Cost.
- FR-8.5: CSV export (mandatory); PDF export (optional, cut first if time-constrained).
- FR-8.6: Dynamic table search/sort/filter on report tables.

***

## 6. Input Validation Specification

All validation errors must be shown **inline** below the relevant field, not as an alert/toast alone. The submit/dispatch button must be disabled while any required field is empty or invalid.


| Field | Rule | Error Message |
| :-- | :-- | :-- |
| Email (login) | Valid email format | "Enter a valid email address" |
| Password (login) | Non-empty | "Password is required" |
| Vehicle Reg. No. | Non-empty; alphanumeric + hyphens only; max 20 chars; unique in DB | "Registration number already exists" / "Invalid format" |
| Vehicle Name | Non-empty; max 100 chars | "Vehicle name is required" |
| Max Load Capacity | Positive number > 0 | "Capacity must be a positive number" |
| Odometer | Non-negative number ≥ 0 | "Odometer must be 0 or greater" |
| Acquisition Cost | Positive number > 0 | "Cost must be a positive number" |
| Driver Name | Non-empty; max 100 chars | "Driver name is required" |
| License Number | Non-empty; unique in DB | "License number already exists" |
| License Expiry Date | Valid date; must not be in the past on creation | "License expiry date cannot be in the past" |
| Contact Number | 10–15 digits; optional country code prefix | "Enter a valid contact number" |
| Safety Score | Number between 0–100 | "Safety score must be between 0 and 100" |
| Trip Source / Destination | Non-empty; max 200 chars | "Field is required" |
| Cargo Weight | Positive number > 0; must not exceed selected vehicle capacity | "Cargo weight exceeds vehicle capacity" |
| Planned Distance | Positive number > 0 | "Distance must be a positive number" |
| End Odometer (trip complete) | Must be ≥ start odometer | "End odometer must be ≥ start odometer" |
| Fuel Consumed (trip complete) | Positive number > 0 | "Fuel consumed must be a positive number" |
| Maintenance Cost | Positive number > 0 | "Cost must be a positive number" |
| Fuel Log — Liters | Positive number > 0 | "Liters must be a positive number" |
| Fuel Log — Cost | Positive number > 0 | "Cost must be a positive number" |


***

## 7. Mandatory Business Rules

| ID | Rule | Source |
| :-- | :-- | :-- |
| BR-1 | Vehicle registration number must be unique. | Both drafts |
| BR-2 | Retired or In Shop vehicles never appear in dispatch selection. | Both drafts |
| BR-3 | Expired license or Suspended driver status blocks trip assignment. | Both drafts |
| BR-4 | A driver or vehicle already On Trip cannot be assigned to another trip. | Both drafts |
| BR-5 | Cargo weight must not exceed vehicle's max load capacity — dispatch blocked with inline error if exceeded. | Both drafts |
| BR-6 | Dispatching a trip sets both vehicle and driver to On Trip, and captures the vehicle's current odometer as the trip's start odometer. | Both drafts |
| BR-7 | Completing a trip requires an end odometer ≥ start odometer and a fuel-consumed value; reverts vehicle and driver to Available, updates vehicle odometer, and creates a fuel log entry. | Both drafts |
| BR-8 | Cancelling a dispatched trip restores both vehicle and driver to Available. | Both drafts |
| BR-9 | Creating an active maintenance record sets vehicle to In Shop. | Both drafts |
| BR-10 | Closing maintenance restores vehicle to Available (unless Retired). | Both drafts |
| BR-11 | Account locks after 5 failed login attempts. | Both drafts |

**Implementation guidance:** implement BR-4, BR-6 through BR-10 as a single centralized transition function per entity type rather than scattering status writes across endpoints.

**Optional hardening:** wrap the dispatch transition in a Postgres transaction with `SELECT ... FOR UPDATE` if concurrent booking is a risk during demo.

***

## 8. Data Model

### Entities

- **User** — id, name, email, password_hash, role, failed_login_count, locked_until
- **Vehicle** — id, registration_number (unique), name, type, max_load_capacity, odometer, acquisition_cost, region, status
- **Driver** — id, name, license_number (unique), license_category, license_expiry_date, contact_number, safety_score, trip_completion_pct, status
- **Trip** — id, source, destination, vehicle_id (FK), driver_id (FK), cargo_weight, planned_distance, revenue, status, start_odometer, end_odometer, fuel_consumed, created_at
- **MaintenanceLog** — id, vehicle_id (FK), description/service_type, cost, start_date, end_date, is_open
- **FuelLog** — id, vehicle_id (FK), liters, cost, date
- **Expense** — id, vehicle_id (FK), category, amount, description, date
- **Document** *(optional/stretch entity)* — id, title, file_url, expiry_date, vehicle_id, driver_id


### Relationships

- Vehicle 1—N Trip, Vehicle 1—N MaintenanceLog, Vehicle 1—N FuelLog, Vehicle 1—N Expense
- Driver 1—N Trip
- User is standalone (auth/RBAC only)


### State Diagrams

**Vehicle:** `Available ⇄ OnTrip` · `Available ⇄ InShop` · `Available → Retired`
**Driver:** `Available ⇄ OnTrip` · `Available ⇄ OffDuty` · `Available/OnTrip → Suspended`
**Trip:** `Draft → Dispatched → Completed` · `Dispatched → Cancelled`

***

## 9. Example Acceptance Workflow

1. Register vehicle **Van-05**, reg. no. `VAN-05`, max capacity 500 kg, odometer 12,000 km, status = Available.
2. Register driver **Alex**, license `LIC-ALEX99`, valid/unexpired, status = Available.
3. Create trip: Warehouse A → Terminal B, cargo weight 450 kg, planned distance 240 km → Draft.
4. Dispatch the trip. System validates: 450 kg ≤ 500 kg capacity, Alex's license is unexpired, both vehicle and driver are Available → all pass → Dispatch succeeds.
5. Vehicle and driver both flip to On Trip; trip's start odometer is captured as 12,000.
6. Complete the trip: end odometer 12,240, fuel consumed 40 L, revenue 1,200. System checks 12,240 ≥ 12,000 → passes.
7. Vehicle odometer updates to 12,240; a fuel log entry (40 L) is created; vehicle and driver revert to Available; fuel efficiency computes to 240 km / 40 L = 6.0 km/L.
8. Create a maintenance record on Van-05 → vehicle flips to In Shop and disappears from the dispatch pool immediately.
9. Reports update operational cost and fuel efficiency using the latest trip and fuel data.
10. Attempt to create a trip with cargo exceeding vehicle capacity → Dispatch button disabled, inline error shown, trip remains blocked.
11. Attempt 5 failed logins on any account → account locks.

***

## 10. Mandatory Deliverables Checklist

- [ ] Responsive web interface
- [ ] Authentication with RBAC
- [ ] Login error state + 5-attempt lockout
- [ ] CRUD for Vehicles and Drivers, with validation
- [ ] Trip management with all validations
- [ ] Automatic status transitions
- [ ] Live Board with 15-second polling
- [ ] Maintenance workflow
- [ ] Fuel \& expense tracking with cost aggregation
- [ ] Dashboard with KPIs and filters
- [ ] Basic charts/visual analytics
- [ ] CSV export of reports
- [ ] Filter + sort on all data tables
- [ ] Every team member has committed their own code to the repo

**Stretch:** dashboard expiry alert banners → document management → license-expiry email reminders → PDF export → dark mode toggle → row-level concurrency locking.

***

## 11. Technical Stack

> **Important:** The hackathon rules require a **local relational database (MySQL or PostgreSQL)**. SQLite is not acceptable. **PostgreSQL (local) via Prisma** is the mandatory default.


| Layer | Choice | Why |
| :-- | :-- | :-- |
| Framework | Next.js (React, App Router) | Single deployable with API routes + frontend |
| Styling | Tailwind CSS + Shadcn UI | Fast to implement the dark, status-driven UI |
| Database | PostgreSQL (local) via Prisma ORM | Meets hackathon rules; supports transactions and locking |
| Auth | Custom JWT (jsonwebtoken + bcrypt), httpOnly cookie session | No external auth provider needed |
| State | React state / Context or Zustand | Minimal boilerplate |
| Charts | Recharts | Fast bar/line charts |
| CSV export | papaparse | Client-side export |
| Deployment | Local (`localhost`) | App must work offline/locally |

### Suggested Folder Structure

```text
transitops/
├── prisma/
│   ├── schema.prisma
│   └── seed.ts
├── src/
│   ├── app/
│   │   ├── login/page.tsx
│   │   ├── dashboard/page.tsx
│   │   ├── fleet/page.tsx
│   │   ├── drivers/page.tsx
│   │   ├── trips/page.tsx
│   │   ├── maintenance/page.tsx
│   │   ├── fuel-expenses/page.tsx
│   │   ├── analytics/page.tsx
│   │   └── api/
│   │       ├── auth/[...]/route.ts
│   │       ├── vehicles/route.ts
│   │       ├── vehicles/[id]/retire/route.ts
│   │       ├── drivers/route.ts
│   │       ├── drivers/[id]/status/route.ts
│   │       ├── trips/route.ts
│   │       ├── trips/[id]/dispatch/route.ts
│   │       ├── trips/[id]/complete/route.ts
│   │       ├── trips/[id]/cancel/route.ts
│   │       ├── maintenance/route.ts
│   │       ├── maintenance/[id]/close/route.ts
│   │       ├── fuel-expenses/route.ts
│   │       └── reports/route.ts
│   ├── components/
│   │   ├── layout/Sidebar.tsx
│   │   ├── layout/Topbar.tsx
│   │   ├── ui/StatusBadge.tsx
│   │   ├── ui/KpiCard.tsx
│   │   ├── ui/DataTable.tsx
│   │   └── ui/ValidationError.tsx
│   ├── lib/
│   │   ├── auth.ts
│   │   ├── rbac.ts
│   │   ├── transitions.ts
│   │   ├── validation.ts
│   │   └── prisma.ts
│   └── middleware.ts
├── .env
├── package.json
└── README.md
```


***

## 12. Team Split, Timeline \& Git Workflow

### Git Workflow

- Every team member must push their own commits.
- Use branch-per-person workflow.
- Commit frequently and merge at sync points.


### Timeline

| Time | Person A | Person B | Person C | Person D |
| :-- | :-- | :-- | :-- | :-- |
| 9:00–9:30 | PostgreSQL setup, Prisma schema, migrations | Review schema, sketch transition functions | Sidebar/Topbar layout | KPI query design |
| 9:30–10:30 | Seed data + auth skeleton | Vehicle/Driver CRUD endpoints | Login screen | Dashboard KPI cards |
| 10:30–11:30 | Auth + RBAC middleware | Trip create/dispatch endpoints | Vehicle Registry page | Fuel \& Expense page |
| 11:30–13:00 | Driver API + validations | Complete/cancel trip + transitions | Drivers page | Analytics page tabs + charts |
| 13:00–13:30 | Lunch / Git sync |  |  |  |
| 13:30–15:00 | Maintenance endpoints | Live Board + dispatch errors | Trip Dispatcher UI | CSV export + ROI formula |
| 15:00–16:15 | Bug fixes | End-to-end trip cascade testing | Maintenance UI polish | Reports polish |
| 16:15–17:00 | Integration + demo prep |  |  |  |


***

## 13. Non-Functional Requirements

- NFR-1: Responsive down to a reasonable tablet width.
- NFR-2: All status writes go through centralized transition functions.
- NFR-3: Visible keyboard focus states on interactive elements.
- NFR-4: No external API dependencies for the mandatory build.
- NFR-5: App must be fully functional and demoable offline/locally.
- NFR-6: Live Board and Dashboard KPIs must use polling-based refresh every 15 seconds.
- NFR-7: Every table must support search/filter and column sort.

***

## 14. Risks \& Mitigations

| Risk | Mitigation |
| :-- | :-- |
| PostgreSQL setup fails | Pre-install before event and verify `psql` works |
| Status bugs | Centralize all transitions in `transitions.ts` |
| Too much time spent on charts | Time-box Reports to 1.5 hours |
| RBAC scope creep | Hard-code role routes only |
| CSV export gets delayed | Build it before PDF |
| One person doing all Git commits | Enforce branch-per-person from the start |
| Merge conflicts at end | Reserve final 45 minutes for integration |
| Screens 6 \& 7 look inconsistent | Follow the wireframe specs in FR-7 and FR-8 |


***

## 15. Reporting Formulas

- **Fuel Efficiency (km/L):** `Σ Distance Completed / Σ Fuel Consumed`
- **Total Operational Cost:** `Σ Fuel Cost + Σ Maintenance Cost + Σ Other Expense Cost`
- **Vehicle ROI:** `(Revenue − (Fuel + Maintenance + Other Cost)) / Acquisition Cost`


### Reference CSV Export Snippet

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
    "Total Operational Cost": vehicle.totalOperationalCost,
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


***

## 16. Stretch-Goal Reference Material

### 16.1 Optional `Document` Model

```prisma
model Document {
  id         String    @id @default(uuid())
  title      String
  fileUrl    String
  expiryDate DateTime?
  vehicleId  String?
  vehicle    Vehicle?  @relation(fields: [vehicleId], references: [id], onDelete: Cascade)
  driverId   String?
  driver     Driver?   @relation(fields: [driverId], references: [id], onDelete: Cascade)
  createdAt  DateTime  @default(now())

  @@map("documents")
}
```


### 16.2 Optional License-Expiry Email Worker

```typescript
import { PrismaClient } from "@prisma/client";
import nodemailer from "nodemailer";

const prisma = new PrismaClient();

export const checkExpiringLicenses = async () => {
  const thirtyDaysFromNow = new Date();
  thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

  const expiringDrivers = await prisma.driver.findMany({
    where: { licenseExpiry: { lte: thirtyDaysFromNow, gte: new Date() } },
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
      from: "\"TransitOps Compliance\" <compliance@transitops.co>",
      to: "safety-officer@transitops.co",
      subject: `COMPLIANCE ALERT: License Expiration for ${driver.name}`,
      text: `Driver ${driver.name} (License: ${driver.licenseNumber}) license expires on ${driver.licenseExpiry.toDateString()}.`,
    });
  }
};
```


### 16.3 Optional Concurrency Locking

```sql
BEGIN;
SELECT id, status, "maxCapacity", odometer FROM vehicles WHERE id = 'v-uuid-101' FOR UPDATE;
SELECT id, status, "licenseExpiry" FROM drivers WHERE id = 'd-uuid-202' FOR UPDATE;
INSERT INTO trips (...) VALUES (...);
COMMIT;
```


***

## Appendix A: Resolved Conflicts \& Fixes

**A.1 — Database:** SQLite was the old default. PostgreSQL (local) is now the required default.

**A.2 — Role naming:** Dispatcher is the login role; Driver is a data entity.

**A.3 — Git workflow:** Every member must commit; branch-per-person workflow added.

**A.4 — Wireframes for Screens 6 \& 7:** Added inline layout specs.

**A.5 — Filter/sort on all tables:** Added to Trips, Maintenance, Fuel/Expenses, and Reports.

**A.6 — Input validation:** Added a complete field-level validation table.

**A.7 — Live Board polling:** Added 15-second polling to satisfy dynamic-data requirement.

Would you like me to also convert this into a clean Markdown file format you can paste directly into your repo?

