# PulseOps

> Production-grade Incident & Service Health Management Platform built with **React 19**, **Node.js (Express)**, **TypeScript**, **Relational SQLite / PostgreSQL**, and **Docker**.

[![CI Pipeline](https://github.com/Taan1el/pulseops/actions/workflows/ci.yml/badge.svg)](https://github.com/Taan1el/pulseops/actions)
![Node.js](https://img.shields.io/badge/Node.js-v24-339933?logo=node.js)
![React](https://img.shields.io/badge/React-19-61DAFB?logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178C6?logo=typescript)
![Docker](https://img.shields.io/badge/Docker-Ready-2496ED?logo=docker)

---

## Architecture & Code Map

```
pulseops/
├── .github/workflows/ci.yml         # Automated CI test, lint & build matrix
├── client/                          # React 19 + TypeScript frontend
│   ├── src/
│   │   ├── components/              # ServiceGrid, IncidentFeed, MetricsCards, Modals
│   │   ├── services/api.ts          # Typed REST API client
│   │   ├── App.tsx                  # Dashboard layout & state coordination
│   │   ├── App.css                  # Custom design tokens, focus styles & responsive layout
│   │   └── App.test.tsx             # Component & user interaction tests
│   └── vite.config.ts               # Proxy configuration & test setup
├── server/                          # Node.js + TypeScript backend
│   ├── src/
│   │   ├── controllers/             # Service, Incident & Metrics request handlers
│   │   ├── services/                # Incident state machine (auto status transitions)
│   │   ├── repositories/            # Typed SQL queries & data access layer
│   │   ├── db/                      # Schema DDL, seed data & database connection
│   │   ├── routes/                  # Express route factories
│   │   ├── middleware/              # Error handling & logging
│   │   └── app.ts / index.ts        # App setup & graceful shutdown
│   └── test/api.test.ts             # Full API integration test suite
├── shared/types.ts                  # Shared TypeScript domain contracts & DTOs
├── docs/
│   ├── adr/                         # Architecture Decision Records (ADR-001 to 003)
│   └── api.md                       # REST API endpoint specifications
├── Dockerfile                       # Multi-stage production container
└── docker-compose.yml               # Container orchestration (Node API + PostgreSQL)
```

---

## Quickstart

### Option A: Zero-Config Local Run (Recommended)
Requires only Node.js (v22+). No Docker or external database daemon required!

```bash
# 1. Install dependencies across all workspaces
npm install

# 2. Start backend server (http://localhost:4000)
npm run dev:server

# 3. In another terminal, start frontend dashboard (http://localhost:5173)
npm run dev:client
```

Open [http://localhost:5173](http://localhost:5173) to view the live dashboard.

---

### Option B: Docker Compose
Runs the complete containerized stack:

```bash
docker compose up --build
```

Access the application at [http://localhost:4000](http://localhost:4000).

---

## Quality Checks & Automated Tests

```bash
# Run all unit and integration tests (13 tests)
npm test

# Run TypeScript typechecks across backend and frontend
npm run lint

# Compile production bundles for client and server
npm run build
```

---

## Key Features Demonstrated

1. **Automated Incident State Machine**:
   - Declaring a **P1 - Critical** incident automatically transitions the affected microservice status to `outage`.
   - Declaring a **P2 - Major** incident transitions the microservice status to `degraded`.
   - Resolving the incident automatically verifies if any remaining active incidents exist, and restores the service status to `operational`.
2. **Interactive Incident Lifecycle**:
   - Step through investigation milestones: `Investigating` &rarr; `Identified` &rarr; `Monitoring` &rarr; `Resolved`.
   - Timeline log recording public notes with relative timestamps.
3. **Live System SLA & Counters**:
   - Real-time computation of overall system uptime percentage and service distribution.
4. **Accessible Forms & Modal Dialogs**:
   - WCAG AA contrast, explicit `htmlFor`/`id` labels, `:focus-visible` styling, and screen-reader announcements.
