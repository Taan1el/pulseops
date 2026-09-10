# ADR-002: Relational Data Model & Automated Incident State Transitions

## Status
Accepted

## Context
An Incident & Service Health platform requires strong relational consistency. Incidents are tied to services, and timeline updates are sequentially tied to incidents. Furthermore, manual synchronization of service status (e.g. remembering to mark an affected service as "Outage" during a critical P1 incident or forgetting to mark it "Operational" after resolution) leads to inaccurate status dashboards and human error during stressful outages.

## Decision
1. **Relational Schema with Foreign Keys & Cascades**:
   - `services` &larr; `incidents` &larr; `incident_updates`.
   - SQLite `PRAGMA foreign_keys = ON;` is enforced at connection initialization.
2. **Automated State Machine in IncidentService**:
   - Creating a `p1` incident immediately transitions the associated service to `outage`.
   - Creating a `p2` incident transitions the associated service to `degraded` (if not already worse).
   - Creating a `p3` incident transitions `operational` services to `degraded`.
   - Resolving an incident queries remaining active incidents for that service. If zero active incidents remain, the service status is automatically restored to `operational`.

## Consequences
### Positive
- Prevents stale status states on public dashboards.
- Database enforces integrity: deleting or archiving a service cascades correctly without orphaned incidents.
- Predictable audit trails for incident post-mortems.

### Negative
- Multi-service incidents require future extension to a many-to-many join table (`incident_services`) if an outage spans multiple dependent clusters.
