# Definition of DONE (MVP)

The MVP is DONE when all conditions below are true:

## Authentication
- [x] Client login works
- [x] Owner login works
- [x] Role protection is enforced
- [x] Password reset flow works
- [x] JWT access + refresh tokens

## WordPress Connection
- [x] Site can be connected via plugin + token
- [x] Connection status visible
- [x] WP Pilot Connector plugin (REST API)
- [x] Proxy layer with Redis caching
- [x] Heartbeat / health monitoring

## Client Actions
- [x] Create product
- [x] Edit product
- [x] View orders
- [x] Create/edit blog posts
- [x] Onboarding wizard (4 steps)
- [x] Dashboard with stats

## Internationalization
- [x] UI available in English
- [x] UI available in French
- [x] Language switch works
- [x] next-intl v4 with [locale] routing

## Theme Modes
- [x] System mode works
- [x] Dark mode works
- [x] Light mode works
- [x] User preference is saved (Zustand + localStorage)

## Owner Dashboard
- [x] View clients
- [x] View site status
- [x] Activity stream
- [x] Error logs
- [x] Create client + connect token

## Deployment
- [x] Docker multi-stage builds (backend, frontend, proxy)
- [x] docker-compose.prod.yml
- [x] GitHub Actions CI/CD (lint, typecheck, test, build, deploy)
- [x] Vercel config for frontend

## Testing
- [x] Vitest + supertest integration tests
- [x] Auth tests (register, login, refresh, reset)
- [x] Admin tests (overview, clients, sites, activity)

## Key Rule
Clients can manage their site WITHOUT opening wp-admin.
