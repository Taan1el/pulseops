# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [1.0.0] - 2026-09-13

### Added

- Dashboard for monitoring service health, declaring incidents, and following incident timelines, with live SLA and status counters.
- Automatic service status transitions: a P1 incident forces an outage, P2 degrades a service that is not already in outage, P3 degrades an operational service, and resolving the last active incident on a service restores it to operational.
- Persistent error banner with a retry action when the dashboard fails to load. If a snapshot was already loaded, the last good data stays visible with an outdated-data notice instead of being cleared.
- In-browser demo mode for the GitHub Pages build. It reuses the same slug, status-transition, and metrics logic as the API, stores data in `localStorage`, and includes a "Reset demo data" control.
- Keyboard support for the incident, service, and update modals: Escape closes the open modal, and focus moves to its first field automatically.

### Changed

- The Express server now serves the built client and falls back to `index.html` for client-side routes, so the Docker image can run the API and the dashboard from one container.
- API endpoints validate input up front (duplicate service name, invalid tier or status, invalid severity) instead of forwarding raw database error messages to the client.
- The Vite dev server's API proxy target is now read from `VITE_API_TARGET`, defaulting to `http://localhost:4000` as before.

### Fixed

- The compiled server's `start` script and the Docker image's `CMD` pointed at `dist/index.js`, a path that never existed once the build ran; the production image could not start. Both now point at the real compiled entry point.
- The favicon referenced a file that was never part of the project and always 404ed.
