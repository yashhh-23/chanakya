# TransitOps (Chanakya)

**TransitOps** is an internal fleet and logistics management dashboard designed for an enterprise logistics company operating over 500 heavy vehicles. It serves as the central command center for dispatchers, fleet managers, and executives to track vehicles, manage drivers, monitor live trips, and analyze operational KPIs in real-time.

Built as part of an 8-hour Hackathon, this project focuses on robust business logic, a strict state machine for vehicle/driver availability, and a responsive, high-performance UI.

---

## Key Features

* **Real-time Live Board:** A 15-second auto-refreshing dashboard showing all currently active deliveries, their assigned drivers, and dispatch status.
* **Strict State Machine:** Centralized business logic ensures that drivers with expired licenses cannot be assigned, and vehicles that are "In Shop" or "Retired" cannot be dispatched.
* **Vehicle & Driver Registry:** Full CRUD operations for managing the fleet. Includes tracking max load capacity, safety scores, and odometer readings.
* **Trip Dispatcher:** A robust wizard for drafting, dispatching, completing, and canceling trips. Automatically handles vehicle and driver status transitions (Available ↔ On Trip).
* **Fuel & Maintenance Logging:** Automatic expense tracking. Completing a trip auto-generates fuel logs based on consumption, tying expenses directly to operational revenue.
* **Analytics & KPIs:** Dashboard widgets for Fleet Utilization, Revenue per Km, and Maintenance costs.

---

## Tech Stack

* **Frontend:** Next.js (App Router), React, Tailwind CSS, Shadcn/UI (planned)
* **Backend:** Next.js Route Handlers (API), Node.js
* **Database & ORM:** PostgreSQL, Prisma ORM
* **Tooling:** ESLint, TypeScript, GitHub Actions (Automated Documentation Bot)

---

## Project Structure

```text
chanakya/
├── docs/                   # Product Requirements (PRD), API Docs, Status, Changelog
├── prisma/                 # Prisma Schema and DB Seeding scripts
├── src/
│   ├── app/                # Next.js App Router (Frontend Pages & API Routes)
│   │   ├── api/            # Backend API Endpoints (Vehicles, Drivers, Trips)
│   │   ├── dashboard/      # Main KPI Dashboard
│   │   ├── fleet/          # Vehicle Registry
│   │   ├── trips/          # Trip Dispatch & Live Board
│   │   └── ...
│   ├── components/         # Reusable React UI Components
│   └── lib/                # Core Business Logic (transitions.ts) & Utilities
├── scripts/                # Bash scripts for CI/CD and automation
└── RULES.md                # Development guidelines and commit conventions
```

---

## Getting Started

### Prerequisites

* Node.js (v18+)
* PostgreSQL (Running locally or via Docker)

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
   Create a `.env` file in the root directory and add your PostgreSQL connection string:

   ```env
   DATABASE_URL="postgresql://user:password@localhost:5432/transitops?schema=public"
   ```

4. **Initialize the Database:**
   Push the Prisma schema to your local database and generate the client:

   ```bash
   npx prisma db push
   npx prisma generate
   ```

5. **Start the Development Server:**

   ```bash
   npm run dev
   ```

6. **Open the App:**
   Navigate to [http://localhost:3000](http://localhost:3000) in your browser.

---

## Documentation

For full details on the product requirements, database schema, and API endpoints, refer to the `/docs` folder:

* [Product Requirements Document (PRD)] (./docs/TransitOps%20—%20Final%20Product%20Requirements%20Document%20(.md)
* [Backend API Documentation](./docs/API_Documentation.md)
* [Implementation Status](./docs/Implementation_Status.md)

---

## Development Rules

This repository enforces strict conventions for AI pair-programming via an automated bot. See `RULES.md` for the commit message formatting required to trigger the documentation bot.
