# PulseOps REST API Specification

Base URL: `http://localhost:4000/api`

---

## Endpoints Overview

### Health & Telemetry
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/health` | Service and database health check |
| `GET` | `/metrics` | System SLA, active incident counts, and operational counters |

### Services
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/services` | List all monitored services ordered by criticality |
| `GET` | `/services/:id` | Get service details by ID |
| `POST` | `/services` | Register a new service |
| `PATCH` | `/services/:id` | Update service status, tier, or description |

### Incidents
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/incidents` | List incidents (filter by `status` or `serviceId`) |
| `GET` | `/incidents/:id` | Get incident by ID including full timeline log |
| `POST` | `/incidents` | Declare a new incident (triggers auto service downgrade) |
| `POST` | `/incidents/:id/updates` | Append timeline update (triggers auto service recovery if resolved) |

---

## Request & Response Payloads

### 1. Declare Incident (`POST /api/incidents`)
```json
{
  "title": "Stripe Webhook Gateway Timeout",
  "severity": "p1",
  "serviceId": 2,
  "summary": "Edge proxies timing out when receiving Stripe checkout event payloads."
}
```

Response (`201 Created`):
```json
{
  "success": true,
  "data": {
    "id": 14,
    "title": "Stripe Webhook Gateway Timeout",
    "status": "investigating",
    "severity": "p1",
    "serviceId": 2,
    "serviceName": "Payment Processing Gateway",
    "summary": "Edge proxies timing out when receiving Stripe checkout event payloads.",
    "createdAt": "2026-09-10T22:45:00.000Z",
    "resolvedAt": null,
    "updates": [
      {
        "id": 28,
        "incidentId": 14,
        "status": "investigating",
        "message": "Incident opened: Edge proxies timing out...",
        "createdAt": "2026-09-10T22:45:00.000Z"
      }
    ]
  }
}
```

### 2. Add Timeline Update (`POST /api/incidents/:id/updates`)
```json
{
  "status": "resolved",
  "message": "Ingress rate-limiting rules relaxed for payment gateway IP ranges. All webhooks processed."
}
```
