# ADR-001: Monorepo Workspace with Shared TypeScript Contracts

## Status
Accepted

## Context
When building a modern web application with a React client and a Node.js API, teams frequently face contract drift between frontend request payloads and backend response models. Separate repositories require manual synchronization, version publishing (e.g., via private npm packages), or error-prone duplication of TypeScript interfaces.

## Decision
We adopted an npm workspace monorepo structure containing:
- `client/`: React 19 + TypeScript + Vite frontend.
- `server/`: Node.js + TypeScript + Express backend.
- `shared/`: Single source of truth for domain contracts (`Service`, `Incident`, `IncidentUpdate`, DTOs).

## Consequences
### Positive
- **Single Source of Truth**: Changes to domain models or API payloads immediately cause compile-time errors in both client and server if contracts break.
- **Unified CI Pipeline**: A single test and lint step validates the entire system before merge.
- **Fast Local Feedback**: No need to link or publish packages locally during feature development.

### Negative
- Monorepos require explicit TypeScript path and workspace configuration to prevent accidental root directory leakages.
