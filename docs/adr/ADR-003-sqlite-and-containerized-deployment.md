# ADR-003: Zero-Config SQLite and Containerized Deployment

## Status

Accepted

## Context

Local service dashboards often become hard to run when they depend on external database daemons, unconfigured Docker engines, or cloud connection secrets. PulseOps needs a setup that works immediately for local development and still supports a containerized deployment.

## Decision

1. **Zero-config local development**:
   - The backend uses Node.js 24's built-in `node:sqlite` database engine.
   - Requires no C++ build tools and no background services. `npm install && npm run dev:server` works on any OS.
2. **Single-container deployment**:
   - The multi-stage `Dockerfile` compiles both the client and the server, then copies the client's static build into the runtime image. The Express server serves those files directly (see `server/src/app.ts`) alongside the `/api` routes, so one container serves the whole application.
   - `docker-compose.yml` runs that image with a named volume for the SQLite data file, so it survives container restarts.

## Consequences

### Positive

- Developers can run the application without configuring Docker or a database daemon.
- The container image needs no external database service, which keeps the compose file to a single container.

### Negative

- SQLite is a single-file, single-process database. It is not suitable for multiple app instances writing concurrently. A deployment that needs that would require switching to a client-server database and updating the repository layer's SQL to match its dialect.
