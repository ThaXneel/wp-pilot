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
