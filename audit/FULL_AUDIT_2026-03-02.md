# WP Pilot — Full Platform Audit

**Date:** March 2, 2026
**Scope:** Complete audit of all code, infrastructure, tests, and production readiness
**Previous Audit:** February 18, 2026

---

## Executive Summary

| Area | Status | Score |
|------|--------|-------|
| Authentication & Authorization | ✅ Mostly Complete | 85% |
| Backend API (11 modules, 33 endpoints) | ⚠️ Key gaps | 75% |
| Database (Prisma, 7 models) | ⚠️ Missing indexes | 80% |
| Frontend (21 pages, 12 UI components) | ⚠️ Edit pages broken | 80% |
| Proxy Layer | ⚠️ No timeouts, no error middleware | 65% |
| WordPress Plugin (12 REST routes) | ⚠️ Missing GET-by-ID, no sanitization | 70% |
| i18n (EN/FR) | ✅ Complete | 95% |
| Theme System (System/Dark/Light) | ✅ Complete | 100% |
| Tests | ❌ Broken & Minimal | 20% |
| CI/CD | ❌ CI fails, deploy ungated | 40% |
| Shared Types | ❌ Dead code | 0% |
| Security | ⚠️ Gaps remain | 65% |

### What changed since Feb 18 audit?

| Item | Feb 18 Status | March 2 Status |
|------|---------------|----------------|
| Backend→Proxy URL contract | ❌ Broken (404s) | ✅ **FIXED** |
| `GET /api/sites/:id/config` | ❌ Missing | ✅ **FIXED** |
| `GET /api/products/:id` | ❌ Missing | ❌ Still missing |
| `GET /api/posts/:id` | ❌ Missing | ❌ Still missing |
| `PATCH /users/change-password` | ❌ Missing | ❌ Still missing |
| `tenantScope` middleware mounted | ❌ Dead code | ❌ Still dead code |
| Test setup table names bug | Unknown | ❌ **NEW BUG** found |
| Admin test password mismatch | ❌ Bug | ❌ Still present |

**2 critical issues were fixed. ~20 remain.**

---

## Phase-by-Phase Production Readiness

### PHASE 1 — Foundation ✅ (90% done)

| Item | Status | Notes |
|------|--------|-------|
| Project setup (monorepo) | ✅ Done | npm workspaces: backend, frontend, proxy-layer, shared |
| Database (Prisma) | ✅ Done | 7 models, 2 migrations, seed data |
| Auth (Client + Owner) | ✅ Done | JWT access (15m) + refresh (7d), bcrypt 12 rounds |
| Role-based access | ✅ Done | `authenticate` + `authorize('OWNER'|'CLIENT')` middleware |
| Base dashboard layout | ✅ Done | Client + Admin layouts with sidebars, topbar |
| **Missing:** `typecheck` script | ❌ | Root package.json lacks it — CI fails |
| **Missing:** DB indexes on FKs | ❌ | Performance will degrade at scale |

### PHASE 2 — UX Core ✅ (95% done)

| Item | Status | Notes |
|------|--------|-------|
| Bilingual support (EN/FR) | ✅ Done | next-intl v4, 340 keys each, perfect parity |
| Theme modes (System/Dark/Light) | ✅ Done | next-themes + CSS custom properties |
| Save user preferences | ✅ Done | Zustand persisted stores + `PATCH /preferences` API |
| **Minor:** ~12 hardcoded English strings remain | ⚠️ | Placeholders like "you@example.com", "Min 8 characters" |

### PHASE 3 — WordPress Connection ⚠️ (80% done)

| Item | Status | Notes |
|------|--------|-------|
| Build connector plugin | ✅ Done | 12 REST routes, bearer auth, WP-Cron heartbeat |
| Token generation | ✅ Done | `POST /onboarding/generate-token` |
| Site connection flow | ✅ Done | 4-step onboarding wizard + handshake |
| Online/offline status | ✅ Done | Heartbeat → `processHeartbeat()` + status display |
| Plugin download endpoint | ✅ Done | `GET /onboarding/download-plugin` |
| **Missing:** Proxy has no fetch timeouts | ❌ | Slow WP sites hang the proxy forever |
| **Missing:** Proxy has no error middleware | ❌ | Unhandled errors = no logging |
| **Missing:** Site config not cached in proxy | ❌ | Every request = DB query |

### PHASE 4 — Core Features ⚠️ (70% done)

| Item | Status | Notes |
|------|--------|-------|
| Products: list | ✅ Done | Backend → Proxy → WP plugin |
| Products: create | ✅ Done | 3-step wizard frontend form |
| Products: edit | ❌ **BROKEN** | Edit page fetches `GET /products/:id` — endpoint doesn't exist at any layer |
| Products: delete | ❌ Missing | No DELETE route at any layer |
| Orders: read-only list | ✅ Done | Per PRD, read-only is sufficient |
| Posts: list | ✅ Done | Backend → Proxy → WP plugin |
| Posts: create | ✅ Done | Frontend create form |
| Posts: edit | ❌ **BROKEN** | Edit page fetches `GET /posts/:id` — endpoint doesn't exist at any layer |
| Posts: delete | ❌ Missing | No DELETE route at any layer |
| **Bug:** WP plugin product/order totals are page count, not true total | ❌ | Pagination is broken |
| **Bug:** WP plugin has no input sanitization | ❌ | XSS risk on product/post creation |

### PHASE 5 — Owner Control ✅ (95% done)

| Item | Status | Notes |
|------|--------|-------|
| Clients list | ✅ Done | Search + pagination |
| Create client | ✅ Done | Admin form + API |
| Connected sites overview | ✅ Done | Sites table with status badges |
| Activity stream | ✅ Done | Admin activity page |
| Error logs | ✅ Done | GlobalEvent table + admin page |
| **Missing:** Delete/deactivate client | ❌ | Only status change (ACTIVE/SUSPENDED) |

### PHASE 6 — MVP Validation ❌ (30% done)

| Item | Status | Notes |
|------|--------|-------|
| Tests passing | ❌ **BROKEN** | Test setup has wrong table names, admin tests have password bug |
| CI pipeline green | ❌ **BROKEN** | Missing `typecheck` script = CI always fails |
| Deploy gated on CI | ❌ Missing | Broken code can deploy to production |
| End-to-end flow tested | ❌ Missing | No E2E tests exist |

---

## Detailed Findings

### 1. CRITICAL — Must Fix Before Production (P0)

#### 1.1 Edit Product/Post Pages Are Broken
- **Frontend** calls `GET /api/products/:id` and `GET /api/posts/:id`
- **Backend** has no such routes — only `GET /` (list), `POST /`, `PUT /:id`
- **Proxy** has no GET-by-ID routes either
- **WP plugin** has no GET-by-ID either
- **Impact:** Edit pages show infinite loading spinner — core feature unusable
- **Fix:** Add `GET /:id` routes at ALL 3 layers (backend, proxy, WP plugin)

#### 1.2 Test Infrastructure Is Broken
- **Test setup** (`setup.ts`) uses PascalCase model names (`"Activity"`, `"ConnectToken"`) but Prisma `@@map()` created snake_case tables (`activities`, `connect_tokens`)
- **Every test run crashes** at cleanup with `relation "Activity" does not exist`
- **Admin tests** use password `OwnerPass123!` but seed uses `owner123!` — login fails silently
- **Impact:** Zero tests actually run. CI test step is broken.

#### 1.3 CI Pipeline Always Fails
- CI runs `npm run typecheck` but root `package.json` has no `typecheck` script
- CI doesn't seed the database before running tests
- **Impact:** CI never passes → meaningless quality gate

#### 1.4 Proxy Layer Has No Fetch Timeouts
- All `fetch()` calls to WordPress have no `AbortSignal` timeout
- A slow/unresponsive WordPress site will hang the proxy indefinitely
- Also no timeout on the backend config fetch
- **Impact:** One bad WP site can bring down the entire proxy

---

### 2. HIGH — Features Broken or Missing (P1)

#### 2.1 No Change-Password Endpoint
- Settings page calls `PATCH /api/users/change-password` but route doesn't exist
- Note: Settings page may actually use `PUT /users/profile` — **needs verification**
- Missing: validation schema, controller, service method

#### 2.2 No DELETE Endpoints Anywhere
- No `DELETE` route exists at any layer (backend, proxy, WP plugin)
- Users cannot delete products, posts, or any other resource
- At minimum need: `DELETE /products/:id`, `DELETE /posts/:id`

#### 2.3 Deploy Not Gated on CI
- `deploy.yml` triggers on `push: main` independently of CI
- Broken code can ship to production
- Fix: Add `workflow_run` trigger gated on `ci.yml` success

#### 2.4 WP Plugin Pagination Bug
- `list_products` and `list_orders` return `total: count($data)` — this is the **current page count**, not the true total
- `list_posts` correctly uses `$query->found_posts` — inconsistent
- **Impact:** Frontend pagination shows wrong page count for products and orders

#### 2.5 tenantScope Middleware Is Dead Code
- Defined in `middleware/tenantScope.ts` but never mounted on any route
- CLIENT-scoped data isolation relies on ad-hoc `req.user.clientId` checks
- **Risk:** A bug in any controller could leak data across tenants

---

### 3. MEDIUM — Quality & Safety Gaps (P2)

#### 3.1 No Frontend Form Validation
- `zod` is installed but never used in frontend source
- All 14+ forms use raw `useState` with ad-hoc `if` checks
- No `react-hook-form` or equivalent

#### 3.2 Toast System Unused
- `Toast.tsx` component exists but is **never imported**
- All user feedback is inline `<p>` elements with `setTimeout` auto-clear
- No global toast notification system

#### 3.3 WP Plugin Input Sanitization Missing
- No `sanitize_text_field()`, `wp_kses_post()`, or numeric validation
- Product titles, descriptions, and prices are passed unsanitized to WooCommerce
- **Risk:** XSS through product/post names

#### 3.4 Site Config Not Cached in Proxy
- Every proxy request calls `GET /api/sites/:id/config` on the backend
- High-traffic sites generate redundant DB lookups
- Should cache for 30-60 seconds

#### 3.5 No Express Error Middleware in Proxy
- No `(err, req, res, next)` handler registered
- Unhandled errors produce generic 500s with no logging

#### 3.6 Database Missing FK Indexes
- No indexes on: `ClientSite.clientId`, `Activity.clientId`, `Activity.siteId`, `ConnectToken.clientId`, `GlobalEvent.siteId`, `GlobalEvent.createdAt`, `Activity.createdAt`
- PostgreSQL does NOT auto-index foreign keys

#### 3.7 Auth Hardening Needed
- No per-endpoint rate limiting on auth routes (login, reset-password)
- No refresh token server-side storage → no revocation capability
- No account lockout after N failed attempts
- No email verification on registration

#### 3.8 Shared Types Package Unused
- `@wppilot/shared` exists with `ApiResponse<T>`, `Role`, `Language`, etc.
- Never imported anywhere — backend and frontend define types inline
- Missing domain types: Product, Post, Order, Site, Client, Activity

#### 3.9 .env.example Port Mismatch
- `.env.example` has `DATABASE_URL` with port `5432`
- `docker-compose.yml` maps postgres to host port `5434`
- Developers copying the example will fail to connect

#### 3.10 Missing package.json Scripts
- Backend: missing `typecheck`, missing `lint`
- Frontend: missing `typecheck`, missing `test`
- Root: missing `typecheck`

---

### 4. LOW — Production Polish (P3)

#### 4.1 Dead Frontend Code
- `preferencesStore.ts` — replaced by `next-themes` + `next-intl` routing
- `queryClient.ts` — both layouts create their own `QueryClient`
- `FormField.tsx` — duplicates `Input` behavior, never imported
- `Modal.tsx` — built but never used

#### 4.2 ~12 Hardcoded English Strings
- Placeholders: `"you@example.com"`, `"Min 8 characters"`, `"PROD-123"`
- UI text: `"Select site"`, `"Expand sidebar"`, `"Admin"`
- Alt text: `alt="Product"`

#### 4.3 Proxy Uses KEYS Instead of SCAN
- `redis.keys(pattern)` is O(N) and blocks Redis
- Should use `SCAN` cursor-based iteration for production safety

#### 4.4 No Graceful Shutdown in Proxy
- No `SIGTERM`/`SIGINT` handlers
- Redis connections and HTTP server aren't closed cleanly on container stop

#### 4.5 WP Plugin Product Fields Are Minimal
- Only supports: title, description, price, status
- Missing: SKU, sale_price, stock, categories, tags, images, weight, dimensions, variations

#### 4.6 No API Documentation
- No OpenAPI/Swagger spec
- No endpoint documentation served

#### 4.7 Plan Enforcement Not Implemented
- `Plan` enum exists (FREE, STARTER, PRO, ENTERPRISE) but no limits are enforced

#### 4.8 No Frontend Tests
- Zero `.test.tsx` files
- No vitest/jest/testing-library configured
- No E2E tests (Playwright/Cypress)

#### 4.9 Backend Test Coverage Minimal
- Only 2 of 11 modules have tests (auth, admin) — and both are broken
- Missing tests for: products, orders, posts, sites, onboarding, dashboard, users, health

#### 4.10 Accessibility
- No `aria-labels` on interactive elements
- No keyboard navigation in dropdowns/modals
- No focus management on page transitions

---

## Complete Endpoint Inventory (All Layers)

### Backend API — 33 Endpoints

| Module | Method | Path | Status |
|--------|--------|------|--------|
| health | GET | `/api/health/` | ✅ |
| health | GET | `/api/health/db` | ✅ |
| health | GET | `/api/health/redis` | ✅ |
| health | GET | `/api/health/detailed` | ✅ |
| auth | POST | `/api/auth/register` | ✅ |
| auth | POST | `/api/auth/login` | ✅ |
| auth | POST | `/api/auth/refresh` | ✅ |
| auth | POST | `/api/auth/reset-password` | ✅ |
| auth | POST | `/api/auth/reset-password/confirm` | ✅ |
| users | GET | `/api/users/profile` | ✅ |
| users | PUT | `/api/users/profile` | ✅ |
| users | PATCH | `/api/users/preferences` | ✅ |
| users | PATCH | `/api/users/change-password` | ❌ Missing |
| onboarding | GET | `/api/onboarding/download-plugin` | ✅ |
| onboarding | POST | `/api/onboarding/handshake` | ✅ |
| onboarding | GET | `/api/onboarding/status` | ✅ |
| onboarding | POST | `/api/onboarding/generate-token` | ✅ |
| onboarding | POST | `/api/onboarding/verify` | ✅ |
| sites | GET | `/api/sites/:id/config` | ✅ (New) |
| sites | GET | `/api/sites/` | ✅ |
| sites | GET | `/api/sites/:id` | ✅ |
| sites | POST | `/api/sites/heartbeat` | ✅ |
| products | GET | `/api/products/` | ✅ |
| products | GET | `/api/products/:id` | ❌ Missing |
| products | POST | `/api/products/` | ✅ |
| products | PUT | `/api/products/:id` | ✅ |
| products | DELETE | `/api/products/:id` | ❌ Missing |
| orders | GET | `/api/orders/` | ✅ |
| posts | GET | `/api/posts/` | ✅ |
| posts | GET | `/api/posts/:id` | ❌ Missing |
| posts | POST | `/api/posts/` | ✅ |
| posts | PUT | `/api/posts/:id` | ✅ |
| posts | DELETE | `/api/posts/:id` | ❌ Missing |
| dashboard | GET | `/api/dashboard/stats` | ✅ |
| activity | GET | `/api/activity/` | ✅ |
| admin | GET | `/api/admin/overview` | ✅ |
| admin | GET | `/api/admin/clients` | ✅ |
| admin | POST | `/api/admin/clients` | ✅ |
| admin | PUT | `/api/admin/clients/:id/status` | ✅ |
| admin | GET | `/api/admin/sites` | ✅ |
| admin | GET | `/api/admin/activity` | ✅ |
| admin | GET | `/api/admin/errors` | ✅ |

### Proxy Layer — 12 Routes

| Method | Path | Status |
|--------|------|--------|
| GET | `/proxy/sites/:siteId/products` | ✅ |
| GET | `/proxy/sites/:siteId/products/count` | ✅ |
| POST | `/proxy/sites/:siteId/products` | ✅ |
| PUT | `/proxy/sites/:siteId/products/:productId` | ✅ |
| GET | `/proxy/sites/:siteId/orders` | ✅ |
| GET | `/proxy/sites/:siteId/orders/count` | ✅ |
| GET | `/proxy/sites/:siteId/posts` | ✅ |
| GET | `/proxy/sites/:siteId/posts/count` | ✅ |
| POST | `/proxy/sites/:siteId/posts` | ✅ |
| PUT | `/proxy/sites/:siteId/posts/:postId` | ✅ |
| GET | `/proxy/sites/:siteId/health` | ✅ |
| POST | `/proxy/sites/:siteId/handshake` | ✅ |

### WP Plugin — 12 REST Routes

| Method | Path | Status |
|--------|------|--------|
| POST | `/wp-json/saas-connector/v1/handshake` | ✅ |
| GET | `/wp-json/saas-connector/v1/health` | ✅ |
| GET | `/wp-json/saas-connector/v1/products` | ✅ |
| GET | `/wp-json/saas-connector/v1/products/count` | ✅ |
| POST | `/wp-json/saas-connector/v1/products` | ✅ |
| PUT | `/wp-json/saas-connector/v1/products/{id}` | ✅ |
| GET | `/wp-json/saas-connector/v1/orders` | ✅ |
| GET | `/wp-json/saas-connector/v1/orders/count` | ✅ |
| GET | `/wp-json/saas-connector/v1/posts` | ✅ |
| GET | `/wp-json/saas-connector/v1/posts/count` | ✅ |
| POST | `/wp-json/saas-connector/v1/posts` | ✅ |
| PUT | `/wp-json/saas-connector/v1/posts/{id}` | ✅ |

---

## Production Readiness Work Plan

### SPRINT 1 — Fix Critical Blockers (Est. 6-8 hours)

These items must be fixed before any production deployment or real testing.

| # | Task | Effort | Files |
|---|------|--------|-------|
| 1.1 | **Add GET-by-ID for products** — WP plugin route, proxy route, backend route+controller+service | 2h | `class-products.php`, `proxy.routes.ts`, `proxy.service.ts`, `products.routes.ts`, `products.controller.ts`, `products.service.ts` |
| 1.2 | **Add GET-by-ID for posts** — same 3 layers | 1.5h | `class-posts.php`, `proxy.routes.ts`, `posts.routes.ts`, `posts.controller.ts`, `posts.service.ts` |
| 1.3 | **Fix test setup table names** — use snake_case matching `@@map()` annotations | 15min | `tests/helpers/setup.ts` |
| 1.4 | **Fix admin test password** — change `OwnerPass123!` to `owner123!` | 5min | `tests/admin.test.ts` |
| 1.5 | **Add `typecheck` script** — root + backend + proxy-layer | 10min | `package.json` (root), `apps/backend/package.json`, `services/proxy-layer/package.json` |
| 1.6 | **Add fetch timeouts in proxy** — `AbortSignal.timeout(10000)` on all fetch calls | 30min | `proxy.service.ts` |
| 1.7 | **Add seed step in CI** — run `prisma db seed` after migrations | 10min | `.github/workflows/ci.yml` |
| 1.8 | **Gate deploy on CI** — add `workflow_run` trigger | 10min | `.github/workflows/deploy.yml` |

### SPRINT 2 — Core Gaps (Est. 8-12 hours)

| # | Task | Effort | Files |
|---|------|--------|-------|
| 2.1 | **Add DELETE for products** — all 3 layers | 1.5h | WP plugin, proxy, backend |
| 2.2 | **Add DELETE for posts** — all 3 layers | 1.5h | WP plugin, proxy, backend |
| 2.3 | **Add change-password endpoint** — backend route, controller, service, Zod schema | 1h | `users.routes.ts`, `users.controller.ts`, `users.service.ts` |
| 2.4 | **Mount tenantScope middleware** — add to products, orders, posts, sites, dashboard routes | 1h | All client-scoped route files |
| 2.5 | **Fix WP plugin pagination totals** — use `wc_get_products(paginate => true)` for products, same for orders | 1h | `class-products.php`, `class-orders.php` |
| 2.6 | **Add WP plugin input sanitization** — `sanitize_text_field()`, `wp_kses_post()`, numeric validation | 1h | `class-products.php`, `class-posts.php` |
| 2.7 | **Add Express error middleware in proxy** | 30min | `proxy-layer/src/index.ts` |
| 2.8 | **Cache site config in proxy** — 30-60s TTL | 30min | `proxy.service.ts` |
| 2.9 | **Add DB indexes** — FK columns + createdAt on Activity/GlobalEvent | 30min | `schema.prisma` + new migration |
| 2.10 | **Fix .env.example** — correct port, add missing prod vars | 15min | `.env.example` |

### SPRINT 3 — Quality & Security (Est. 15-20 hours)

| # | Task | Effort | Files |
|---|------|--------|-------|
| 3.1 | **Backend test coverage** — add tests for products, orders, posts, sites, onboarding, dashboard, users, health modules | 8h | `tests/` |
| 3.2 | **Frontend form validation** — integrate `react-hook-form` + Zod schemas | 4h | All form pages |
| 3.3 | **Implement Toast system** — global `useToast()` hook, replace inline messages | 2h | Toast component + all pages |
| 3.4 | **Auth hardening** — per-route rate limiting, refresh token rotation, server-side token storage | 3h | Auth module |
| 3.5 | **Internationalize remaining strings** — move ~12 hardcoded strings to translation files | 1h | Various components |
| 3.6 | **Clean up dead frontend code** — remove `preferencesStore`, `queryClient.ts`, `FormField`, unused `Modal` | 30min | Various |

### SPRINT 4 — Production Polish (Est. 20-30 hours)

| # | Task | Effort | Files |
|---|------|--------|-------|
| 4.1 | **E2E tests** — Playwright: login → onboarding → create product → edit → delete | 6h | New test suite |
| 4.2 | **Proxy resilience** — graceful shutdown, circuit breaker, SCAN instead of KEYS | 3h | Proxy layer |
| 4.3 | **WP plugin enhancements** — more product fields, WooCommerce activation check, DELETE endpoints | 4h | PHP classes |
| 4.4 | **Integrate shared types** — import from `@wppilot/shared` in backend + frontend | 3h | All modules |
| 4.5 | **API documentation** — OpenAPI spec, Swagger UI at `/api/docs` | 4h | Backend |
| 4.6 | **Production infra** — error monitoring (Sentry), log aggregation, backup automation | 6h | Config |
| 4.7 | **Accessibility pass** — aria-labels, keyboard nav, focus management | 4h | Frontend components |

---

## Acceptance Criteria Status (from PRD)

| Criteria | Status | Blocker? |
|----------|--------|----------|
| A client can connect a WordPress site | ✅ Working | — |
| A client can create a product | ✅ Working | — |
| A client can edit a product | ❌ **BROKEN** | GET-by-ID missing |
| A client can view orders | ✅ Working | — |
| A client can manage blog posts (create) | ✅ Working | — |
| A client can manage blog posts (edit) | ❌ **BROKEN** | GET-by-ID missing |
| UI supports English and French | ✅ Working | — |
| Theme supports System / Dark / Light | ✅ Working | — |
| No wp-admin access required | ✅ Working | — |

**2 of 9 acceptance criteria are currently broken.**

---

## Estimated Total Remaining Work

| Sprint | Items | Hours | Priority |
|--------|-------|-------|----------|
| Sprint 1 — Critical Blockers | 8 | 6-8h | **Do first** |
| Sprint 2 — Core Gaps | 10 | 8-12h | **Do second** |
| Sprint 3 — Quality & Security | 6 | 15-20h | Before launch |
| Sprint 4 — Production Polish | 7 | 20-30h | Post-launch OK |
| **Total** | **31 items** | **~50-70h** | |

**Minimum viable for production: Sprints 1 + 2 (~14-20 hours)**
