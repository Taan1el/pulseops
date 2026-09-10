# ADR-003: Zero-Config Local SQLite vs Containerized PostgreSQL Strategy

## Status
Accepted

## Context
Candidates and evaluators reviewing full-stack repositories frequently encounter broken setups due to hard dependencies on external database daemons, unconfigured Docker engines, or complex cloud connection secrets. At the same time, enterprise job descriptions require demonstrable experience with production relational databases (PostgreSQL) and containerization (Docker, Kubernetes).

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
- Reviewers can evaluate the application in under 2 minutes without configuring Docker or Postgres locally.
- DevOps / Cloud reviewers can deploy the exact same repository via Docker Compose or Kubernetes manifests.

### Negative
- Query syntax must adhere to standard SQL supported across both SQLite and PostgreSQL dialects (e.g. standard quotes, parameterization).
