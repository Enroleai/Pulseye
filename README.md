# Pulseye

Pulseye employee monitoring application, assembled from the complete frontend and API source archives.

## Application layout

- `frontend/` — Angular 11 web application
- `api/` — Node.js/Express/Socket.IO API with MongoDB/Mongoose models
- `scripts/` — production-host deployment infrastructure

## Local development

Use Node.js 14.21.3 for the legacy Angular 11 toolchain. Install dependencies separately in `frontend/` and `api/`. The API requires the variables documented in `api/.env.example`; never commit production credentials.

## Security note

Rotate any credentials that appeared in historical repository content before production use. Production deployment also requires the host-side runtime configuration and deployment readiness described by the checked-in workflow.
