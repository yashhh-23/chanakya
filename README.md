# TransitOps (Chanakya)

**TransitOps** is an internal fleet and logistics management dashboard designed for an enterprise logistics company operating over 500 heavy vehicles. It serves as the central command center for dispatchers, fleet managers, safety officers, and financial analysts to track vehicles, manage drivers, monitor live trips, and analyze operational KPIs in real-time.

Built as part of an 8-hour Hackathon, this project focuses on robust business logic, a strict state machine for vehicle/driver availability, and a responsive, high-performance UI.

---

## Key Features

* **Real-time Live Board:** A 15-second auto-refreshing dashboard showing all currently active deliveries, their assigned drivers, and dispatch status.
* **Role-Based Access Control (RBAC):** Centralized permission mapping for `FLEET_MANAGER`, `DRIVER`, `SAFETY_OFFICER`, and `FINANCIAL_ANALYST` to ensure secure read/write authorization.
* **Strict State Machine:** Centralized business logic in `transitions.ts` ensures that drivers with expired licenses cannot be assigned, and vehicles that are "In Shop" or "Retired" cannot be dispatched.
* **Vehicle & Driver Registry:** Full CRUD operations for managing the fleet, with strict validation for duplicate registration and license numbers.
* **Trip Dispatcher:** A robust wizard for drafting, dispatching, completing, and canceling trips. Automatically handles vehicle and driver status transitions (Available ↔ On Trip).
* **Fuel & Maintenance Logging:** Atomic expense tracking using transactional writes. Completing a trip auto-logs fuel consumption, tying expenses directly to operational revenue.
* **Analytics & KPIs:** Dashboard widgets for Fleet Utilization, Revenue per Km, and Maintenance costs, including filtered recent trips tables.

---

## Tech Stack

* **Frontend:** Next.js (App Router), React, Vanilla CSS
* **Backend:** Next.js Route Handlers (API), Node.js
* **Database & ORM:** MySQL, Prisma ORM
* **Tooling:** ESLint, TypeScript, GitHub Actions (Automated Documentation Bot)

---

## Project Structure

```text
chanakya/
├── docs/                   # Product Requirements (PRD), API Docs, Status, Changelog
├── prisma/                 # Prisma Schema and DB Seeding scripts
├── scratch/                # Verification and API testing scripts
├── src/
│   ├── app/                # Next.js App Router (Frontend Pages & API Routes)
│   │   ├── api/            # Backend API Endpoints (Vehicles, Drivers, Trips)
│   │   ├── dashboard/      # Main KPI Dashboard
│   │   ├── fleet/          # Vehicle Registry
│   │   ├── trips/          # Trip Dispatch & Live Board
│   │   └── ...
│   ├── components/         # Reusable React UI Components
│   ├── contexts/           # React context providers (AuthContext, DataContext)
│   ├── lib/                # Core Business Logic (transitions.ts) & Services
│   │   ├── auth.ts         # Session cookie authentication parsing
│   │   ├── rbac.ts         # Role based permission matrices
│   │   ├── services/       # Vehicle & Driver service layers
│   │   └── utils/          # API response envelope and status normalization helpers
│   └── types.ts            # Type definitions
├── RULES.md                # Development guidelines and commit conventions
└── package.json            # Scripts, dependencies, and configuration
```

---

## Getting Started

### Prerequisites

* Node.js (v18+)
* MySQL (Running locally or via Docker)

### Installation

1. **Clone the repository:**

   ```bash
   git clone https://github.com/yashhh-23/chanakya.git
   cd chanakya
   ```

2. **Install dependencies:**

   ```bash
   npm install
   ```

3. **Configure Environment Variables:**
   Create a `.env` file in the root directory and add your MySQL connection string:

   ```env
   DATABASE_URL="mysql://user:password@localhost:3306/transitops"
   ```

4. **Initialize the Database:**
   Push the Prisma schema to your local database and generate the client:

   ```bash
   npx prisma db push
   npx prisma generate
   ```

5. **Seed the Database:**
   Run the seeding script to populate the database with mock logs and users:

   ```bash
   npx prisma db seed
   ```

6. **Start the Development Server:**

   ```bash
   npm run dev
   ```

7. **Open the App:**
   Navigate to [http://localhost:3000](http://localhost:3000) in your browser.

8. **Log In (Demo Credentials):**
   The application uses Role-Based Access Control (RBAC). Use any of the following accounts (all passwords are `password123`):
   * **Fleet Manager**: `manager@transitops.com` (Full Access)
   * **Financial Analyst**: `finance@transitops.com` (Reports & Analytics)
   * **Safety Officer**: `safety@transitops.com` (Safety & Maintenance)
   * **Driver/Dispatcher**: `dispatcher@transitops.com` (Limited to Dispatching)

---

## Documentation

For full details on the product requirements, database schema, and API endpoints, refer to the `/docs` folder:

* [Product Requirements Document (PRD)](./docs/TransitOps_PRD.md)
* [Backend API Documentation](./docs/API_Documentation.md)
* [Implementation Status](./docs/Implementation_Status.md)

---

## Development Rules

This repository enforces strict conventions for AI pair-programming via an automated bot. See `RULES.md` for the commit message formatting required to trigger the documentation bot.
