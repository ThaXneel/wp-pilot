# Definition of DONE (MVP)

The MVP is DONE when all conditions below are true:

## Authentication
- [x] Client login works
- [x] Owner login works
- [x] Role protection is enforced
- [x] Password reset flow works
- [x] JWT access + refresh tokens
- [x] Remember Me (30d) persists through token refresh cycles

## WordPress Connection
- [x] Site can be connected via plugin + token
- [x] Connection status visible
- [x] OBMAT Connector plugin (REST API)
- [x] Proxy layer with Redis caching
- [x] Heartbeat / health monitoring
- [x] Webhooks (real-time event push to dashboard via SSE)
- [x] Backend URL configurable in plugin settings (not just wp-config.php)

## Client Actions
- [x] Create product
- [x] Edit product
- [x] View orders
- [x] Create/edit blog posts
- [x] Onboarding wizard (4 steps)
- [x] Dashboard with stats
- [x] Multi-site selector works on all pages (SitesProvider)
- [x] Product/order/post counts display correctly
- [x] Site removal with confirmation modal

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
- [x] Railway deployment (backend, proxy, postgres, redis)

## Testing
- [x] Vitest + supertest integration tests
- [x] Auth tests (register, login, refresh, reset, rememberMe propagation)
- [x] Admin tests (overview, clients, sites, activity)
- [x] Sites & dashboard tests (multi-site listing, tenant isolation, config endpoint, heartbeat, stats, site deletion)

## Bug Fixes (2026-03-05)
- [x] Multi-site selector: sites now persisted in siteStore + fetched by SitesProvider at layout level
- [x] Login retention: rememberMe flag propagated through refresh token JWT payload
- [x] Product/order/post counts: proxy route ordering fixed (static `/count` before dynamic `/:id`)
- [x] Auth storage: module-level flag ensures correct localStorage/sessionStorage selection
- [x] PROXY_URL default: corrected from port 5001 to 4000
- [x] Dashboard error logging: detailed warnings with HTTP status, response body, and context

## Key Rule
Clients can manage their site WITHOUT opening wp-admin.
