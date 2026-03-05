# Decisions Log

Use this file to record important technical or product decisions.

---

## 2026-02-16 — English-first project language
**Decision**
All project files, commands, and code naming use English.

**Reason**
Improves consistency, developer collaboration, and AI coding efficiency.

**Impact**
Documentation, variables, routes, and commits use English.

---

## 2026-02-16 — Bilingual UI (EN/FR)
**Decision**
Product UI supports English and French from MVP.

**Reason**
Target users are bilingual; avoids later refactor.

**Impact**
i18n layer added early.

---

## 2026-02-16 — Theme Modes
**Decision**
Support System, Dark, and Light themes.

**Reason**
Modern UX expectation and accessibility.

**Impact**
Theme preference stored per user.

---

## 2026-02-16 — Monorepo with npm workspaces
**Decision**
Use npm workspaces to manage apps/backend, apps/frontend, services/proxy-layer, and shared packages.

**Reason**
Simplifies dependency management and allows shared types/utils across services.

**Impact**
Single `npm install` at root, shared `tsconfig` paths, unified scripts.

---

## 2026-02-16 — Express 5 + TypeScript backend
**Decision**
Backend API built with Express 5 and TypeScript, compiled with tsx.

**Reason**
Express 5 has native async error handling; TypeScript ensures type safety.

**Impact**
All backend code in `src/` with `.ts` extensions, compiled via tsx.

---

## 2026-02-16 — Prisma ORM + PostgreSQL
**Decision**
Use Prisma as ORM with PostgreSQL database.

**Reason**
Type-safe database access, auto-generated client, easy migrations.

**Impact**
Schema in `prisma/schema.prisma`, models for User, Client, ClientSite, ConnectToken, Activity, GlobalEvent, PasswordResetToken.

---

## 2026-02-16 — JWT auth with access + refresh tokens
**Decision**
Authentication uses short-lived access tokens (15m) and long-lived refresh tokens (7d).

**Reason**
Balances security (short access) with UX (long refresh).

**Impact**
`/auth/login` returns both tokens; `/auth/refresh` rotates them.

---

## 2026-02-16 — Custom UI components (no shadcn/ui)
**Decision**
Build custom Tailwind v4 UI components instead of using shadcn/ui.

**Reason**
Full control over design, fewer dependencies, smaller bundle.

**Impact**
10 components in `src/components/ui/`: Button, Input, Card, Table, Modal, Badge, Dropdown, Toast, Spinner, FormField.

---

## 2026-02-16 — WordPress connector plugin + proxy layer
**Decision**
WordPress sites communicate via a custom REST plugin; the SaaS uses a proxy layer to forward requests.

**Reason**
Avoids storing WP credentials; plugin validates bearer tokens locally. Proxy adds caching, normalization, and JWT verification.

**Impact**
PHP plugin in `wordpress-plugin/`, Express proxy service on port 4000 with Redis cache.

---

## 2026-02-16 — Zustand + React Query for state
**Decision**
Use Zustand for client state (auth, preferences) and React Query for server state.

**Reason**
Lightweight, composable stores; React Query handles caching, refetching, and mutations automatically.

**Impact**
Stores in `src/stores/`, API hooks use `useQuery`/`useMutation`.

---

## Decision Template

### YYYY-MM-DD — Title
**Decision**
Describe the decision.

**Reason**
Why this choice was made.

**Impact**
What changes in the project.

---

## 2026-03-05 — RememberMe propagation in refresh tokens
**Decision**
Encode the `rememberMe` boolean inside the JWT refresh token payload. On `authService.refresh()`, extract it from the expiring token and carry it forward into the new refresh token.

**Reason**
Previously, the refresh endpoint always issued a default 7-day token, losing the 30-day window after the first 15-minute access token expiry. Users who checked "Remember Me" were silently downgraded.

**Impact**
`auth.service.ts` updated: `generateRefreshToken` now includes `rememberMe` in the JWT payload. The `refresh()` method reads it back and preserves the correct expiry (30d or 7d). Auth tests verify end-to-end propagation.

---

## 2026-03-05 — SitesProvider for layout-level site fetching
**Decision**
Create a `<SitesProvider>` component that fetches `GET /api/sites` independently and mount it at the app layout level, wrapping all pages.

**Reason**
The site selector in the Topbar was empty on non-dashboard pages because `siteStore.sites[]` was only populated by the dashboard's `useEffect`. The `siteStore` also didn't persist the sites array — only `selectedSiteId` was persisted.

**Impact**
- `siteStore` now persists `sites` in addition to `selectedSiteId` and `sidebarCollapsed`.
- `SitesProvider` runs a `useQuery(["sites-list"])` with 2-minute stale time and refetch-on-focus.
- App layout wraps `<SitesProvider>` inside `<QueryClientProvider>`.

---

## 2026-03-05 — Proxy route ordering (static before dynamic)
**Decision**
Register `/count` routes before `/:id` routes in the proxy layer's Express router.

**Reason**
Express matches routes top-down. With `/products/:productId` registered before `/products/count`, the string `"count"` was captured as a `productId` parameter. The proxy then tried to fetch a single product with ID "count" from WordPress, which failed silently.

**Impact**
`proxy.routes.ts` reordered: all `/count` endpoints now appear before any `/:id` endpoints for products, orders, and posts.

---

## 2026-03-05 — Redis audit results
**Decision**
Keep Redis on Railway. It is actively used by the proxy layer for response caching (ioredis, 60s TTL). The backend only uses it for health-check pings; auth is purely JWT-based.

**Reason**
Audited all Redis usage across the codebase. The proxy layer's `CacheService` uses ioredis for `get`, `setex`, and `scan`+`del` (pattern invalidation). The backend's `EventBus` is in-memory (future candidate for Redis Pub/Sub).

**Impact**
No changes needed. Redis remains a production dependency for proxy-layer caching performance.

---

## 2026-03-05 — PROXY_URL default port correction
**Decision**
Change the `PROXY_URL` default in `env.ts` from `http://localhost:5001` to `http://localhost:4000` to match the actual proxy layer port.

**Reason**
The proxy layer runs on port 4000 (hardcoded in `proxy-layer/src/index.ts`). The wrong default caused local development to silently fail when the env var wasn't explicitly set.

**Impact**
`env.ts` updated. Only affects local dev (production uses the PROXY_URL env var from Railway).
