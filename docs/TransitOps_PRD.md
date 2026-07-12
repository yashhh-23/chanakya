# TransitOps — Product Requirements Document (PRD)

**Project:** Smart Transport Operations Platform
**Format:** Hackathon build, 9:00–17:00 (8 hours), team of 4
**Reference mockup:** Excalidraw — 6 screens (Auth, Dashboard, Vehicle Registry, Drivers & Safety, Trip Dispatcher, Maintenance)
**Document version:** 1.0

---

## 1. Overview

TransitOps is a centralized platform for logistics/transport operators to manage the full lifecycle of fleet operations — vehicle registry, driver compliance, trip dispatch, maintenance, and fuel/expense tracking — replacing manual spreadsheets and logbooks with a rule-enforced, auditable system.

The product is fundamentally a **state machine with RBAC on top**: vehicles and drivers move through defined statuses, trips and maintenance records are the triggers, and a small set of hard business rules gate every transition. Judged correctness will hinge on whether these rules are actually enforced in the running app, not just described in the UI.

## 2. Objective & Success Criteria

**Hackathon objective:** ship a working, demoable app that satisfies the Mandatory Deliverables (Section 10) end-to-end, using the example workflow (Section 9) as the acceptance test.

**Success criteria for the demo:**
- A judge can log in as each of the 4 roles and see role-scoped navigation exactly as specified.
- A judge can register a vehicle, add a driver, create and dispatch a trip, watch statuses cascade automatically, log maintenance, and see it reflected on the dashboard — without errors.
- At least one deliberately-blocked action is demonstrable live (e.g., overweight cargo, suspended driver, duplicate reg number) to prove validation is real, not cosmetic.

## 3. Explicit Non-Goals (Scope Exclusions)

The following are **out of scope**, confirmed against the organizers' own reference mockup (no map/live-tracking screen appears anywhere in the 6 reference screens or the nav):

- Live GPS / map-based vehicle tracking
- Real-time location telemetry of any kind
- Route optimization / turn-by-turn navigation
- PDF export (optional per spec — build only if time remains)
- Email reminders for license expiry (optional)
- Vehicle document management (optional)
- Dark mode (optional — note: the reference mockup is already dark-themed by default, so this may be moot)

Treat the "Live Board" on the Trip Dispatcher screen as a **static, auto-refreshing list of trip statuses** — not a map. This is explicitly in the reference mockup and is cheap to build; do not scope-creep it into live tracking.

## 4. User Roles & RBAC

Roles and their scoped access, taken directly from the reference mockup's login-screen footer (treat this as authoritative over the written problem statement, which used "Driver" instead of "Dispatcher" — confirm with organizers if time allows, otherwise proceed with **Dispatcher**):

| Role | Scoped Access | Responsibilities |
|---|---|---|
| Fleet Manager | Fleet, Maintenance | Oversees fleet assets, maintenance, vehicle lifecycle |
| Dispatcher | Dashboard, Trips | Creates trips, assigns vehicle/driver, monitors active deliveries |
| Safety Officer | Drivers, Compliance | Tracks license validity, safety scores, driver status |
| Financial Analyst | Fuel & Expenses, Analytics | Reviews costs, fuel consumption, profitability |

**RBAC implementation note:** the login screen mockup shows a role selector at sign-in — decide as a team whether role is fixed per account (set at creation, standard practice) or user-selected at login (as the mockup visually implies). Fixed-per-account is the safer, more defensible RBAC pattern for judging; recommend defaulting to that and treating the mockup's dropdown as a demo convenience, unless organizers confirm otherwise.

Every role requires authentication; unauthenticated users cannot reach any module.

## 5. Functional Requirements

### 5.1 Authentication (Screen 0)
- FR-1.1: Email + password login.
- FR-1.2: RBAC enforced on every route; nav items and page access scoped per Section 4 table.
- FR-1.3: Invalid credential error state shown inline.
- FR-1.4: Account lockout after 5 failed login attempts (explicit in mockup — implement as a counter reset on success).
- FR-1.5: "Forgot password" link present (stub acceptable for demo — full flow not required).
- FR-1.6: "Remember me" session persistence.

### 5.2 Dashboard (Screen 1)
- FR-2.1: KPI cards — Active Vehicles, Available Vehicles, Vehicles in Maintenance, Active Trips, Pending Trips, Drivers on Duty, Fleet Utilization (%).
- FR-2.2: Filters — Vehicle Type, Status, Region.
- FR-2.3: Recent Trips table — Trip ID, Vehicle, Driver, Status, ETA.
- FR-2.4: Vehicle Status breakdown bar (Available / On Trip / In Shop / Retired) as proportional bars.

### 5.3 Vehicle Registry (Screen 2)
- FR-3.1: Master list — Reg. No. (unique), Name/Model, Type, Capacity, Odometer, Acquisition Cost, Status.
- FR-3.2: Add Vehicle action; registration number uniqueness enforced with inline error.
- FR-3.3: Search by reg. no.; filter by Type and Status.
- FR-3.4: Retired/In Shop vehicles hidden from the Trip Dispatcher's vehicle picker (rule surfaced directly on this screen per mockup annotation).

### 5.4 Driver Management (Screen 3)
- FR-4.1: Profiles — Name, License No., Category, Expiry, Contact, Trip Completion %, Safety Score, Status.
- FR-4.2: Status toggle control — Available / On Trip / Off Duty / Suspended.
- FR-4.3: Expired license flagged visually inline in the table (e.g., "03/2025 EXPIRED").
- FR-4.4: Rule enforced: expired license or Suspended status blocks trip assignment (surfaced directly on-screen per mockup annotation).

### 5.5 Trip Dispatcher (Screen 4)
- FR-5.1: Visual trip lifecycle stepper — Draft → Dispatched → Completed / Cancelled.
- FR-5.2: Create Trip form — Source, Destination, Vehicle (Available only, capacity shown inline), Driver (Available only), Cargo Weight, Planned Distance.
- FR-5.3: Live capacity validation — cargo weight vs. selected vehicle's max load; Dispatch button disabled with an inline error if exceeded (mockup shows this exact state: "Capacity exceeded by 200 kg — dispatch blocked").
- FR-5.4: Live Board — static, auto-updating list of trips with route, assigned vehicle/driver, status badge, and ETA or blocking reason (e.g., "Awaiting driver," "Vehicle went to shop").
- FR-5.5: On Complete: capture odometer + fuel log → feeds Expenses → vehicle & driver revert to Available (mockup's stated flow: "On Complete: odometer → fuel log → expenses → Vehicle & Driver Available").

### 5.6 Maintenance (Screen 5)
- FR-6.1: Log Service Record form — Vehicle, Service Type, Cost, Date, Status.
- FR-6.2: Service Log table — Vehicle, Service, Cost, Status.
- FR-6.3: Creating an active record automatically transitions vehicle Available → In Shop.
- FR-6.4: Closing a record transitions vehicle In Shop → Available (unless Retired).
- FR-6.5: In Shop vehicles are removed from the dispatch pool (rule surfaced directly on-screen).

### 5.7 Fuel & Expenses (not in mockup set — build per written spec)
- FR-7.1: Fuel logs — liters, cost, date, vehicle.
- FR-7.2: Other expenses — tolls, maintenance costs.
- FR-7.3: Auto-computed total operational cost (Fuel + Maintenance) per vehicle.

### 5.8 Reports & Analytics (not in mockup set — build per written spec)
- FR-8.1: Fuel Efficiency (Distance / Fuel).
- FR-8.2: Fleet Utilization.
- FR-8.3: Operational Cost per vehicle.
- FR-8.4: Vehicle ROI = (Revenue − (Maintenance + Fuel)) / Acquisition Cost.
- FR-8.5: CSV export (mandatory); PDF export (optional, cut first if time-constrained).

## 6. Mandatory Business Rules

| ID | Rule | Source |
|---|---|---|
| BR-1 | Vehicle registration number must be unique. | Written spec + mockup |
| BR-2 | Retired or In Shop vehicles never appear in dispatch selection. | Written spec + mockup |
| BR-3 | Expired license or Suspended driver status blocks trip assignment. | Written spec + mockup |
| BR-4 | A driver or vehicle already On Trip cannot be assigned to another trip. | Written spec |
| BR-5 | Cargo weight must not exceed vehicle's max load capacity — dispatch blocked with inline error if exceeded. | Written spec + mockup |
| BR-6 | Dispatching a trip sets both vehicle and driver to On Trip. | Written spec |
| BR-7 | Completing a trip reverts both to Available (after odometer/fuel capture). | Written spec + mockup |
| BR-8 | Cancelling a dispatched trip restores both to Available. | Written spec |
| BR-9 | Creating an active maintenance record sets vehicle to In Shop. | Written spec + mockup |
| BR-10 | Closing maintenance restores vehicle to Available (unless Retired). | Written spec + mockup |
| BR-11 | Account locks after 5 failed login attempts. | Mockup only — new |

**Implementation guidance:** implement BR-4, BR-6 through BR-10 as a single centralized transition function per entity type (`transitionVehicle(id, newStatus)`, `transitionDriver(id, newStatus)`) rather than scattering status writes across endpoints. This is the single highest-risk area for inconsistent-state bugs given the time constraint.

## 7. Data Model

### Entities

- **User** — id, name, email, password_hash, role (enum: FleetManager / Dispatcher / SafetyOfficer / FinancialAnalyst), failed_login_count, locked_until
- **Vehicle** — id, registration_number (unique), name, type, max_load_capacity, odometer, acquisition_cost, status (enum: Available / OnTrip / InShop / Retired)
- **Driver** — id, name, license_number, license_category, license_expiry_date, contact_number, safety_score, trip_completion_pct, status (enum: Available / OnTrip / OffDuty / Suspended)
- **Trip** — id, source, destination, vehicle_id (nullable FK), driver_id (nullable FK), cargo_weight, planned_distance, status (enum: Draft / Dispatched / Completed / Cancelled), final_odometer (nullable), created_at
- **MaintenanceLog** — id, vehicle_id (FK), service_type, cost, date, status (enum: Open / Closed)
- **FuelLog** — id, vehicle_id (FK), liters, cost, date
- **Expense** — id, vehicle_id (FK), type (enum: Toll / Maintenance / Other), amount, date

### Relationships
- Vehicle 1—N Trip, Vehicle 1—N MaintenanceLog, Vehicle 1—N FuelLog, Vehicle 1—N Expense
- Driver 1—N Trip
- User is standalone (auth/RBAC only — not linked to operational entities for this scope)

### State Diagrams (textual)

**Vehicle:** `Available ⇄ OnTrip` (via dispatch/complete/cancel) · `Available ⇄ InShop` (via maintenance open/close) · `Available → Retired` (terminal, manual)

**Driver:** `Available ⇄ OnTrip` (via dispatch/complete/cancel) · `Available ⇄ OffDuty` (manual) · `Available/OnTrip → Suspended` (manual, Safety Officer only)

**Trip:** `Draft → Dispatched → Completed` · `Dispatched → Cancelled`

## 8. Screen Inventory

| # | Screen | Primary Role(s) | Status |
|---|---|---|---|
| 0 | Authentication | All | Mocked |
| 1 | Dashboard | Dispatcher (primary), all (view) | Mocked |
| 2 | Vehicle Registry | Fleet Manager | Mocked |
| 3 | Drivers & Safety Profiles | Safety Officer | Mocked |
| 4 | Trip Dispatcher | Dispatcher | Mocked |
| 5 | Maintenance | Fleet Manager | Mocked |
| 6 | Fuel & Expenses | Financial Analyst | Not mocked — build per written spec |
| 7 | Analytics / Reports | Financial Analyst | Not mocked — build per written spec |
| 8 | Settings | Admin/all (minimal) | Not mocked — stub only if time allows |

## 9. Example Acceptance Workflow

1. Register vehicle "Van-05," max capacity 500 kg, status = Available.
2. Register driver "Alex" with a valid license.
3. Create trip with cargo weight 450 kg → Draft.
4. System validates 450 ≤ 500 → Dispatch enabled → dispatch.
5. Vehicle and driver both flip to On Trip.
6. Complete trip; enter final odometer and fuel consumed.
7. System captures fuel log, computes expense, reverts vehicle and driver to Available.
8. Create maintenance record (Oil Change) → vehicle flips to In Shop, disappears from dispatch pool.
9. Reports update operational cost and fuel efficiency using the latest trip and fuel data.
10. (New, from mockup) Attempt to create a trip with cargo exceeding vehicle capacity → Dispatch button disabled, inline error shown, trip remains blocked.
11. (New, from mockup) Attempt 5 failed logins → account locks.

## 10. Mandatory Deliverables Checklist

- [ ] Responsive web interface
- [ ] Authentication with RBAC (role-scoped nav per Section 4)
- [ ] Login error state + 5-attempt lockout
- [ ] CRUD for Vehicles and Drivers
- [ ] Trip management with all validations (BR-1 through BR-5)
- [ ] Automatic status transitions (BR-6 through BR-10)
- [ ] Live Board (static trip status list on Trip Dispatcher screen)
- [ ] Maintenance workflow
- [ ] Fuel & expense tracking with cost aggregation
- [ ] Dashboard with KPIs and filters
- [ ] Basic charts/visual analytics
- [ ] CSV export of reports

**Stretch (only after checklist is fully green):** PDF export, license-expiry email reminders, document management, dark mode (likely redundant — reference UI is already dark).

---

## 11. Technical Stack

Recommendation optimized for a 4-person, 8-hour build with zero external API dependency risk (per earlier decision to keep this a closed system).

| Layer | Choice | Why |
|---|---|---|
| Framework | **Next.js (React, App Router)** | Single deployable — API routes + frontend in one project, removes cross-repo/cross-port coordination overhead for a 4-person team under time pressure |
| Styling | **Tailwind CSS** | Fast to hand-code the dark, status-driven UI from the mockups without a design system build-out |
| Database | **SQLite via Prisma ORM** | Zero setup (file-based, no DB server to provision), but Prisma's schema/migration workflow is identical to Postgres if you outgrow SQLite mid-event |
| Auth | **Custom JWT (jsonwebtoken + bcrypt)**, httpOnly cookie session | Avoids external auth provider integration risk; RBAC is a simple `role` field + middleware guard, not a permissions matrix |
| State (frontend) | **React state / Context**, or **Zustand** if cross-page state gets unwieldy | Keep it minimal — avoid Redux boilerplate under time pressure |
| Charts | **Recharts** | Fast to wire up bar/line charts for Reports and Dashboard utilization bars |
| CSV export | **papaparse** (client-side) or manual string-join for a simple CSV — no library strictly needed | Trivial, don't over-engineer |
| Deployment (demo) | Local (`localhost`) or **Vercel** (Next.js-native, one-command deploy) if judges need a live link | Vercel deploy is near-zero-config for Next.js |

**Alternative stack** (if the team is stronger in it): Express + React (separate frontend/backend) + Prisma/Postgres. Functionally equivalent; costs a bit more integration time (CORS, two dev servers) but decouples frontend/backend work more cleanly if two people are strictly backend-only. Choose based on team's existing familiarity — do not spend hackathon time learning a new framework.

### Suggested folder structure (Next.js option)

```
transitops/
├── prisma/
│   └── schema.prisma        # Vehicle, Driver, Trip, MaintenanceLog, FuelLog, Expense, User models
├── src/
│   ├── app/
│   │   ├── login/page.tsx
│   │   ├── dashboard/page.tsx
│   │   ├── fleet/page.tsx           # Vehicle Registry
│   │   ├── drivers/page.tsx
│   │   ├── trips/page.tsx           # Trip Dispatcher
│   │   ├── maintenance/page.tsx
│   │   ├── fuel-expenses/page.tsx
│   │   ├── analytics/page.tsx
│   │   └── api/
│   │       ├── auth/[...]/route.ts
│   │       ├── vehicles/route.ts
│   │       ├── drivers/route.ts
│   │       ├── trips/route.ts
│   │       ├── trips/[id]/dispatch/route.ts
│   │       ├── trips/[id]/complete/route.ts
│   │       ├── trips/[id]/cancel/route.ts
│   │       ├── maintenance/route.ts
│   │       ├── maintenance/[id]/close/route.ts
│   │       └── reports/route.ts
│   ├── components/
│   │   ├── layout/Sidebar.tsx
│   │   ├── layout/Topbar.tsx
│   │   ├── ui/StatusBadge.tsx
│   │   ├── ui/KpiCard.tsx
│   │   └── ui/DataTable.tsx
│   ├── lib/
│   │   ├── auth.ts               # JWT sign/verify, bcrypt helpers
│   │   ├── rbac.ts               # role → allowed routes map (Section 4 table)
│   │   ├── transitions.ts        # centralized transitionVehicle() / transitionDriver()
│   │   └── prisma.ts             # Prisma client singleton
│   └── middleware.ts             # route guard, reads JWT cookie, checks role
├── .env                          # DATABASE_URL, JWT_SECRET
├── package.json
└── README.md
```

### Core API endpoints

| Method | Route | Purpose |
|---|---|---|
| POST | `/api/auth/login` | Authenticate, set JWT cookie, track failed attempts |
| POST | `/api/auth/logout` | Clear session |
| GET/POST | `/api/vehicles` | List / register vehicles |
| PATCH | `/api/vehicles/:id/retire` | Retire a vehicle |
| GET/POST | `/api/drivers` | List / add drivers |
| PATCH | `/api/drivers/:id/status` | Toggle status (Available/OffDuty/Suspended) |
| GET/POST | `/api/trips` | List / create trip (Draft) |
| POST | `/api/trips/:id/dispatch` | Validate + dispatch (BR-1–6) |
| POST | `/api/trips/:id/complete` | Capture odometer/fuel, revert statuses |
| POST | `/api/trips/:id/cancel` | Revert statuses |
| GET/POST | `/api/maintenance` | List / log maintenance (auto sets InShop) |
| POST | `/api/maintenance/:id/close` | Close record, restore vehicle |
| GET/POST | `/api/fuel-expenses` | List / log fuel & expense entries |
| GET | `/api/reports` | Aggregated efficiency/utilization/cost/ROI data |

## 12. Team Split & Timeline (4 people, 8 hours)

| Time | Person A (Backend/Schema) | Person B (Trip Logic) | Person C (Frontend Core) | Person D (Dashboard/Reports) |
|---|---|---|---|---|
| 9:00–10:00 | Prisma schema, migrations, seed data | Trip/Maintenance model review, sketch transition functions | Sidebar/Topbar layout, Tailwind theme setup from mockup palette | KPI query design, Reports data shape |
| 10:00–11:30 | Auth (JWT, bcrypt, lockout), RBAC middleware | Vehicle/Driver CRUD endpoints | Login screen, Dashboard page (static) | Dashboard KPI cards wired to mock data |
| 11:30–13:00 | Vehicle & Driver API completion, validation | Trip create/dispatch/complete/cancel endpoints + centralized transition functions | Vehicle Registry + Drivers pages, wired to API | Fuel & Expense logging page |
| 13:00–13:30 | **Lunch / sync buffer** | | | |
| 13:30–15:00 | Maintenance endpoints, close/open logic | Wire dispatch validation errors to frontend, Live Board endpoint | Trip Dispatcher page (stepper, form, Live Board) | Reports page (charts, CSV export) |
| 15:00–16:15 | Bug fixes, edge cases (BR-4, BR-11 lockout) | Bug fixes on trip state cascade | Maintenance page, polish status badges/colors | ROI calc, polish charts |
| 16:15–17:00 | **Integration, end-to-end test against Section 9 workflow, demo prep** | | | |

Reserve the final 45 minutes strictly for integration — do not let feature work run into it.

## 13. Non-Functional Requirements

- NFR-1: Responsive down to a reasonable tablet width; mobile-perfect not required for judging.
- NFR-2: All vehicle/driver status writes go through the centralized transition functions (Section 6 guidance) — no ad-hoc status updates in route handlers.
- NFR-3: Visible keyboard focus states on interactive elements (buttons, inputs).
- NFR-4: No external API dependencies (confirmed decision — closed system over seeded/internal data only).
- NFR-5: App must be fully functional and demoable offline/locally in case venue Wi-Fi is unreliable.

## 14. Risks & Mitigations

| Risk | Mitigation |
|---|---|
| Status-cascade bugs (vehicle/driver stuck in wrong state) | Centralize all transitions in one function per entity (Section 6); unit-test the 4 trip actions early |
| Team spends too long on charts/analytics | Time-box Reports to 1.5 hrs max; Recharts default styling is acceptable, don't hand-polish |
| RBAC scope creep into a full permissions matrix | Hard-code the 4-role → route map from Section 4 table; no dynamic permission editor |
| Running out of time for CSV export | It's mandatory — start it before PDF (optional) is ever considered |
| Confusion over "Driver" vs "Dispatcher" role naming | Standardize on **Dispatcher** (per mockup) across code, DB enum, and UI now, to avoid a rename pass later |
| Integration merge conflicts at the end | Reserve last 45 min explicitly; agree on API contract (Section 11 endpoint table) before 10:00 so frontend/backend can build in parallel without blocking each other |

---

**Next suggested step:** once the team confirms the tech stack, generate the actual `schema.prisma` file and seed script so Person A can start migrations immediately at 9:00.
