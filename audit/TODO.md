# WP Pilot — Remaining Work (TODO)

**Date:** February 18, 2026  
**Based on:** Full codebase audit

---

## Priority Legend

| Priority | Meaning |
|----------|---------|
| **P0 — Critical** | App is broken without this fix |
| **P1 — High** | Feature is broken or CI fails |
| **P2 — Medium** | Quality/safety gap |
| **P3 — Low** | Nice to have for production |

---

## P0 — Critical (App-Breaking)

### 1. Fix Backend ↔ Proxy URL Contract
**Problem:** Backend product/order/post services call the proxy with `?clientId=X` query params, but proxy routes expect `/proxy/sites/:siteId/` path params. Every data operation through the proxy returns 404.

**Fix:**
- [ ] Update backend product/order/post services to call `/proxy/sites/${siteId}/products` (requires resolving the siteId from the client's connected site)
- [ ] OR update proxy routes to accept `?clientId=X` and resolve siteId internally

**Files:** `apps/backend/src/modules/products/products.service.ts`, `orders.service.ts`, `posts.service.ts`, `services/proxy-layer/src/proxy.routes.ts`

---

### 2. Create `GET /api/sites/:id/config` Endpoint
**Problem:** Proxy's `getSiteConfig()` calls `GET /api/sites/${siteId}/config` to get `{ wpUrl, apiToken }` but this endpoint doesn't exist. The proxy cannot discover WordPress site connection details.

**Fix:**
- [ ] Add `GET /sites/:id/config` route to sites module
- [ ] Return `{ wpUrl, apiToken }` for the given site
- [ ] Secure it (backend-internal only or JWT-protected)

**Files:** `apps/backend/src/modules/sites/sites.routes.ts`, `sites.controller.ts`, `sites.service.ts`

---

### 3. Add GET-by-ID Endpoints for Products and Posts
**Problem:** Edit pages fetch `/api/products/${id}` and `/api/posts/${id}` but no such routes exist. Edit pages show infinite loading.

**Fix:**
- [ ] Add `GET /api/products/:id` route + controller + service (proxy to WP)
- [ ] Add `GET /api/posts/:id` route + controller + service (proxy to WP)
- [ ] Add corresponding proxy routes if missing

**Files:** `apps/backend/src/modules/products/`, `apps/backend/src/modules/posts/`

---

## P1 — High (Feature Broken / CI Fails)

### 4. Add `PATCH /api/users/change-password` Endpoint
**Problem:** Settings page calls `api('/api/users/change-password', { method: 'PATCH' })` but the route doesn't exist.

**Fix:**
- [ ] Add route in `users.routes.ts`
- [ ] Add controller method (verify old password, hash new, update)
- [ ] Add Zod validation schema

**Files:** `apps/backend/src/modules/users/`

---

### 5. Fix Admin Test Bugs
**Problem:** `admin.test.ts` uses `OwnerPass123!` but seed uses a different password. Tests assert `totalClients` but service returns `clients`. Tests will fail in CI.

**Fix:**
- [ ] Align test passwords with seed data
- [ ] Fix response field name assertions to match actual API response shape
- [ ] Run tests and verify they pass

**Files:** `apps/backend/src/tests/admin.test.ts`, `apps/backend/prisma/seed.ts`

---

### 6. Add `typecheck` Script to Root package.json
**Problem:** CI runs `npm run typecheck` but root package.json may not define this script.

**Fix:**
- [ ] Add `"typecheck": "npm run typecheck --workspaces --if-present"` to root package.json scripts
- [ ] Verify each workspace has its own `typecheck` script (`tsc --noEmit`)

**Files:** `package.json`

---

### 7. Gate deploy.yml on CI Passing
**Problem:** Deploy workflow runs on push to main regardless of CI results. Could deploy broken code.

**Fix:**
- [ ] Add `workflow_run` trigger on deploy.yml gated on ci.yml success
- [ ] OR add CI as a required status check on the `main` branch

**Files:** `.github/workflows/deploy.yml`

---

## P2 — Medium (Quality & Safety Gaps)

### 8. Add DELETE Endpoints
- [ ] `DELETE /api/products/:id` (backend → proxy → WP plugin)
- [ ] `DELETE /api/posts/:id` (backend → proxy → WP plugin)
- [ ] `DELETE /api/admin/clients/:id` (soft-delete or deactivate)
- [ ] Add corresponding proxy routes and WP plugin REST endpoints

---

### 9. Backend Test Coverage
Currently only 2 of 10 modules have tests (14 tests total).

- [ ] Products module tests
- [ ] Orders module tests
- [ ] Posts module tests
- [ ] Sites module tests
- [ ] Onboarding module tests
- [ ] Dashboard module tests
- [ ] Users module tests
- [ ] Health module tests

---

### 10. Frontend Tests
Zero frontend tests exist.

- [ ] Component tests for UI components (Vitest + React Testing Library)
- [ ] Page-level integration tests for critical flows
- [ ] E2E tests with Playwright or Cypress (login → onboarding → create product flow)

---

### 11. Use Shared Types Package
`@wppilot/shared` is defined but never imported anywhere.

- [ ] Import `ApiResponse<T>`, `Role`, `Language`, `Theme` in backend instead of duplicating
- [ ] Import shared types in frontend API layer
- [ ] Add domain entity types: Product, Post, Order, Site, Client, Activity
- [ ] Add shared Zod schemas for request validation

---

### 12. Add Database Indexes
- [ ] Index on `ClientSite.clientId`
- [ ] Index on `Activity.clientId`
- [ ] Index on `ConnectToken.clientId`
- [ ] Index on `ConnectToken.token`
- [ ] Index on `PasswordResetToken.token`
- [ ] Index on `GlobalEvent.createdAt`

---

### 13. Mount tenantScope Middleware
- [ ] Add `tenantScope` middleware to all client-scoped route groups (products, orders, posts, sites, dashboard)
- [ ] Update service queries to use `req.tenantClientId` consistently

---

### 14. Auth Hardening
- [ ] Per-endpoint rate limiting on auth routes (10 req/min for login, 3/min for password reset)
- [ ] Refresh token rotation (issue new refresh on use, revoke old)
- [ ] Store refresh tokens server-side for revocation on logout
- [ ] Account lockout after N failed login attempts
- [ ] Email verification on registration

---

### 15. Client-Side Form Validation
- [ ] Add Zod schemas for all forms (or react-hook-form + Zod)
- [ ] Validate before submitting to backend
- [ ] Show inline field errors

---

### 16. Frontend Error Handling
- [ ] Replace `alert()` calls with Toast notifications
- [ ] Add per-section error boundaries (app layout, admin layout)
- [ ] Map backend error codes to translated user-facing messages

---

## P3 — Low (Production Polish)

### 17. API Documentation
- [ ] OpenAPI/Swagger spec for all endpoints
- [ ] Auto-generate from route definitions or maintain manually
- [ ] Serve at `/api/docs` in development

---

### 18. Plan Enforcement
- [ ] Implement limits per plan (FREE: 1 site, STARTER: 3 sites, etc.)
- [ ] Block operations when plan limits are exceeded
- [ ] Show plan usage in dashboard

---

### 19. Proxy Layer Resilience
- [ ] Request timeouts for outbound WP calls (10s default)
- [ ] Circuit breaker for failing WordPress sites
- [ ] Queue/retry mechanism for failed writes
- [ ] Per-site rate limiting
- [ ] Structured logging (pino or winston)

---

### 20. WP Plugin Improvements
- [ ] WooCommerce dependency check on activation
- [ ] Nonce verification on settings page
- [ ] Support more product fields (categories, tags, images, inventory)
- [ ] DELETE REST endpoints for posts and products
- [ ] Auto-update mechanism
- [ ] Webhook support for real-time sync

---

### 21. Accessibility
- [ ] aria-labels on all interactive elements
- [ ] Keyboard navigation in dropdowns and modals
- [ ] Focus management on page transitions
- [ ] Screen reader testing
- [ ] Color contrast audit

---

### 22. Performance
- [ ] Skeleton loaders instead of spinner-only states
- [ ] Optimistic updates on mutations
- [ ] Image optimization pipeline for product images
- [ ] Bundle size analysis and code splitting review

---

### 23. Production Infrastructure
- [ ] SSL/TLS termination config
- [ ] Reverse proxy (Nginx/Caddy) config
- [ ] Health check dashboards
- [ ] Log aggregation (ELK, CloudWatch)
- [ ] Database backup automation
- [ ] Error monitoring (Sentry)
- [ ] Uptime monitoring

---

### 24. Additional Documentation
- [ ] Contributing guidelines (CONTRIBUTING.md)
- [ ] Changelog (CHANGELOG.md)
- [ ] WP plugin end-user installation guide
- [ ] Deployment guide per hosting provider
- [ ] Architecture Decision Records (ADRs) formalized

---

## Quick Win List (< 30 min each)

| # | Task | Effort |
|---|------|--------|
| 1 | Add `typecheck` script to root package.json | 5 min |
| 2 | Fix admin test password mismatch | 10 min |
| 3 | Gate deploy on CI passing | 10 min |
| 4 | Add DB indexes to Prisma schema | 10 min |
| 5 | Replace `alert()` calls with Toast | 15 min |
| 6 | Add `change-password` endpoint | 20 min |
| 7 | Fix backend→proxy URL contract | 30 min |

---

## Completion Estimate

| Category | Items | Est. Hours |
|----------|-------|------------|
| P0 Critical | 3 | 4-6h |
| P1 High | 4 | 4-6h |
| P2 Medium | 9 | 20-30h |
| P3 Low | 8 | 40-60h |
| **Total** | **24** | **~70-100h** |
