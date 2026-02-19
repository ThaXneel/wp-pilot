# WP Pilot — Full Codebase Audit

**Date:** February 18, 2026  
**Scope:** Complete audit of all code, config, tests, and infrastructure

---

## Summary

| Area | Status | Notes |
|------|--------|-------|
| Authentication | ✅ Complete | JWT access+refresh, register, login, reset password |
| Backend API (11 modules) | ⚠️ Mostly Complete | Missing some single-record GET endpoints |
| Database (Prisma) | ✅ Complete | 7 models, seed data, relations |
| Frontend (28 pages) | ✅ Complete | Landing, auth, client dashboard, admin dashboard |
| WordPress Plugin | ✅ Complete | Products, orders, posts, health, heartbeat |
| Proxy Layer | ⚠️ Has Issues | URL contract mismatch with backend |
| i18n (EN/FR) | ✅ Complete | 288 keys each, perfect parity |
| Themes (System/Dark/Light) | ✅ Complete | CSS variables, next-themes, Zustand |
| Tests | ⚠️ Partial | Auth + Admin tests only (14 tests) |
| DevOps (Docker, CI/CD) | ✅ Complete | Dockerfiles, compose, GitHub Actions |
| Shared Types | ⚠️ Unused | Package exists but never imported |
| UI Components (10) | ✅ Complete | Button, Card, Input, Table, Modal, Badge, etc. |

---

## 1. Authentication & Authorization

### What's Done
- Full JWT auth: register, login, refresh, password reset via email (Resend)
- Access tokens (15m) + refresh tokens (7d)
- bcrypt hashing with 12 salt rounds
- Zod validation on all auth endpoints
- `authenticate` middleware verifies JWT Bearer tokens
- `authorize('OWNER'|'CLIENT')` role gate middleware
- `tenantScope` middleware extracts tenantClientId for row-level isolation
- Frontend `AuthGuard` component with role-based redirects
- Zustand persisted auth store (tokens, user, isAuthenticated)
- Frontend `api.ts` auto-attaches auth headers + 401 refresh retry
- Email enumeration protection on login and password reset

### Issues Found
- **No `PATCH /users/change-password` endpoint** — Settings page calls it but the backend route doesn't exist
- `tenantScope` middleware is defined but never mounted on any route group
- Refresh token not stored server-side — no revocation capability

---

## 2. Backend API — 11 Route Groups

### Endpoints Inventory

| Module | Endpoints | Status |
|--------|-----------|--------|
| **auth** | POST register, login, refresh, request-reset, reset-password | ✅ Complete |
| **users** | GET profile, PATCH profile, PATCH preferences | ⚠️ Missing change-password |
| **admin** | GET overview, clients, GET/POST client, PATCH status, sites, activity, errors | ✅ Complete |
| **sites** | GET list, GET :id, POST heartbeat | ✅ Complete |
| **dashboard** | GET stats | ✅ Complete |
| **products** | GET list, POST create, PUT update | ⚠️ Missing GET :id, DELETE |
| **orders** | GET list | ✅ Complete (read-only per PRD) |
| **posts** | GET list, POST create, PUT update | ⚠️ Missing GET :id, DELETE |
| **onboarding** | GET status, POST generate-token, POST verify-site | ✅ Complete |
| **activity** | GET list | ✅ Complete |
| **health** | GET /, /db, /redis, /detailed | ✅ Complete |

### Issues Found
- **No GET by ID for products or posts** — Edit pages fetch `/api/products/${id}` and `/api/posts/${id}` but these routes don't exist on the backend
- **No DELETE endpoints** anywhere (products, posts, clients, sites)
- Products/orders/posts controllers proxy to the proxy-layer but use **mismatched URL patterns**

---

## 3. Database — Prisma Schema

### Models (7)
| Model | Fields | Relations |
|-------|--------|-----------|
| User | id, email, passwordHash, role, language, theme, name | → Client (1:1) |
| Client | id, userId, plan, status | → User, ClientSite (1:N), ConnectToken (1:N), Activity (1:N) |
| ClientSite | id, clientId, wpUrl, apiToken, status, healthScore, lastPing | → Client |
| ConnectToken | id, clientId, token, used, expiresAt | → Client |
| Activity | id, clientId, action, details, createdAt | → Client |
| GlobalEvent | id, type, message, details, createdAt | — |
| PasswordResetToken | id, userId, token, expiresAt, used | → User |

### Enums
- Role: OWNER, CLIENT
- Language: EN, FR
- Theme: SYSTEM, DARK, LIGHT
- Plan: FREE, STARTER, PRO, ENTERPRISE
- ClientStatus: ACTIVE, SUSPENDED, PENDING
- SiteStatus: ONLINE, OFFLINE, PENDING
- EventType: ERROR, WARNING, INFO

### Seed Data
- Owner account: `owner@wppilot.com`
- 2 test clients: `client1@example.com`, `client2@example.com`

### Issues Found
- No database indexes beyond PKs and uniques — missing indexes on FK columns
- `Plan` enum exists but plan enforcement/limits are nowhere in the code
- No tracked migration files (only schema.prisma)

---

## 4. Frontend — Pages & Components

### Pages (28 total)

| Section | Pages | Status |
|---------|-------|--------|
| **Public** | Landing, Login, Register, Reset Password, 404, Error, Loading | ✅ Complete |
| **Client App** | Dashboard, Onboarding, Products (list/new/edit), Orders, Posts (list/new/edit), Settings | ✅ Complete |
| **Admin** | Dashboard, Clients (list/new), Sites, Activity, Errors | ✅ Complete |

### UI Components (10)
Button (5 variants, 3 sizes, loading), Card, Input (label+error), Spinner, Badge (5 status variants), Table, Dropdown (click-outside), Modal (ESC close), Toast (3 types, auto-dismiss), FormField

### Layout Components
- AuthGuard (role-based redirect)
- ClientSidebar + AdminSidebar (navigation)
- Topbar (theme switcher, language switcher, user menu)
- QueryProvider (React Query + devtools)
- ThemeProvider (next-themes wrapper)

### State Management
- `authStore` (Zustand, persisted) — tokens, user, login/logout
- `preferencesStore` (Zustand, persisted) — language, theme

### Issues Found
- Edit pages fetch by ID but backend lacks GET-by-ID endpoints
- No client-side form validation (relies entirely on backend Zod)
- Some error handlers use `alert()` instead of Toast

---

## 5. WordPress Plugin

### PHP Classes (7)
| Class | REST Routes | Status |
|-------|-------------|--------|
| Auth | Token validation middleware | ✅ Complete |
| Handshake | GET /handshake | ✅ Complete |
| Health | GET /health | ✅ Complete |
| Heartbeat | WP-Cron → POST to backend | ✅ Complete |
| Products | GET list, GET count, POST create, PUT update | ✅ Complete |
| Orders | GET list, GET count | ✅ Complete |
| Posts | GET list, GET count, POST create, PUT update | ✅ Complete |

### Issues Found
- No DELETE endpoints for posts or products
- No WooCommerce dependency check on plugin activation
- Product creation supports basic fields only (no categories, tags, variations)
- No nonce verification on settings page save

---

## 6. Proxy Layer

### Routes
| Route | Method | Status |
|-------|--------|--------|
| /proxy/sites/:siteId/products | GET, POST, PUT | ✅ Defined |
| /proxy/sites/:siteId/orders | GET | ✅ Defined |
| /proxy/sites/:siteId/posts | GET, POST, PUT | ✅ Defined |
| /proxy/sites/:siteId/health | GET | ✅ Defined |
| /proxy/sites/:siteId/handshake | POST | ✅ Defined |

### Features
- JWT verification for backend→proxy auth
- Redis caching (60s TTL) for GET requests
- Pattern-based cache invalidation on writes
- Response normalizer (strips metadata, camelCase conversion)

### Critical Issues Found
- **URL MISMATCH**: Proxy routes expect `/proxy/sites/:siteId/products` but backend services call `/proxy/products?clientId=X` — **all data operations through the proxy would fail with 404**
- **Missing site config endpoint**: Proxy's `getSiteConfig()` calls `GET /api/sites/${siteId}/config` but this endpoint doesn't exist on the backend — **proxy cannot resolve WP site connection details**

---

## 7. Internationalization

### What's Done
- next-intl v4 with `en` and `fr` locales
- 288 translation keys in each JSON file — **perfect parity**
- 11 namespaces: common, nav, auth, dashboard, onboarding, products, orders, posts, settings, admin, landing, errors
- Locale-aware routing with `createNavigation` (Link, redirect, usePathname, useRouter)
- Middleware matching `/(en|fr)/:path*`
- LanguageSwitcher in Topbar

### Issues Found
- Some hardcoded English strings in error callbacks
- Backend error messages are all in English (no server-side i18n)

---

## 8. Theme System

### What's Done
- next-themes ThemeProvider with system/dark/light modes
- 16 CSS custom property tokens for light and dark
- Tailwind v4 `@theme inline` bridging CSS vars to theme
- ThemeSwitcher dropdown (Sun/Moon/Monitor icons)
- Zustand `preferencesStore` for persistence

---

## 9. Testing

### What Exists
| Test File | Tests | Status |
|-----------|-------|--------|
| auth.test.ts | 9 tests (register, login, refresh, reset) | ⚠️ Uses fetch against running server |
| admin.test.ts | 5 tests (overview, clients, create, status) | ⚠️ Has password mismatch bug |

### What's Missing
- Tests for 8 modules: onboarding, sites, dashboard, products, orders, posts, users, health
- Zero frontend tests (no unit, component, or E2E)
- Zero proxy layer tests
- Zero WordPress plugin tests

---

## 10. DevOps & Infrastructure

### What's Done
- **Docker**: Multi-stage builds for backend, frontend, proxy (node:20-alpine, non-root)
- **docker-compose.yml**: PostgreSQL 15 + Redis 7 with health checks
- **docker-compose.prod.yml**: All 5 services with env-based config
- **CI** (ci.yml): lint → typecheck → test → build (with Postgres+Redis services)
- **CD** (deploy.yml): Backend webhook deploy, Frontend via Vercel CLI
- **ENV**: .env.example with all required variables
- **Monorepo**: npm workspaces (root, backend, frontend, proxy-layer, shared)

### Issues Found
- Root package.json may be missing a `typecheck` script referenced by CI
- deploy.yml not gated on CI passing — could deploy broken code
- `NEXT_PUBLIC_API_URL` in docker-compose.prod.yml is set at runtime but Next.js bakes it at build time

---

## 11. Shared Types Package

### What Exists
- `@wppilot/shared` package with `ApiResponse<T>`, `ApiError`, `PaginatedResponse<T>`, `UserProfile`, `Role`, `Language`, `Theme`

### Issues Found
- **Entirely unused** — no imports from `@wppilot/shared` anywhere in backend or frontend
- Missing domain entity types (Product, Post, Order, Site, Client, Activity)

---

## 12. Security

### What's Done
- helmet security headers
- CORS (single origin from env, credentials: true)
- Rate limiting (100 req/15min global)
- bcrypt 12 rounds
- JWT with separate access/refresh secrets
- Zod input validation on write endpoints
- WordPress plugin timing-safe token comparison
- Prisma parameterized queries (SQL injection protection)
- Non-root Docker users
- Password reset token expiry

### Issues Found
- Auth endpoints share the global rate limit (should be stricter)
- No HTTPS enforcement in app code
- Proxy layer shares JWT_SECRET with backend
- No XSS sanitization on user-generated content
