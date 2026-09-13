# ADR-003: Zero-Config Local SQLite vs Containerized PostgreSQL Strategy

## Status
Accepted

## Context
Local service dashboards often become hard to run when they depend on external database daemons, unconfigured Docker engines, or cloud connection secrets. PulseOps needs a setup that works immediately for local development while still supporting a PostgreSQL-backed container runtime.

## Decision
We implemented a dual-strategy architecture:
1. **Zero-Config Local Development**:
   - The backend uses Node.js 24's built-in `node:sqlite` database engine by default.
   - Requires zero C++ compiling tools, zero native build steps, and zero background services to run locally. Running `npm install && npm run dev` works instantly on any OS.
2. **Production Containerization**:
   - Multi-stage `Dockerfile` compiles frontend assets and backend TypeScript into a minimal alpine container with automated health checks.
   - `docker-compose.yml` provides a production-style orchestration featuring a dedicated `postgres:16-alpine` database service, persistent volume management, and container health dependencies.

## Consequences
### Positive
- Developers can run the application quickly without configuring Docker or Postgres locally.
- Platform teams can deploy the same codebase via Docker Compose or Kubernetes manifests.

### Negative
- Query syntax must adhere to standard SQL supported across both SQLite and PostgreSQL dialects (e.g. standard quotes, parameterization).
