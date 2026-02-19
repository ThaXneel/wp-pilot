# WP Pilot — SaaS Platform

Manage your WordPress sites without wp-admin. Products, orders, blog posts — all from one dashboard.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 16, React 19, Tailwind v4, next-intl, next-themes, Zustand |
| Backend | Express 5, TypeScript, Prisma, Zod |
| Database | PostgreSQL 15 + Redis 7 |
| Auth | JWT (access + refresh tokens), bcryptjs |
| Email | Resend |
| WP Plugin | PHP REST API connector |
| Proxy | Express service with Redis caching |

## Architecture

```
ProjectNextTool/
├── .github/              → CI/CD workflows + prompt files
├── saas-platform/
│   ├── apps/
│   │   ├── frontend/     → Next.js 16 App Router (port 3000)
│   │   └── backend/      → Express 5 API (port 5000)
│   ├── services/
│   │   └── proxy-layer/  → WP Proxy Layer (port 4000)
│   ├── shared/           → Shared TypeScript types (@wppilot/shared)
│   ├── wordpress-plugin/ → PHP connector plugin
│   ├── docs/             → Architecture, PRD, decisions, roadmap
│   ├── audit/            → Codebase audit & remaining TODO
│   └── docker-compose.yml
└── package.json          → npm workspaces root
```

---

## Prerequisites

- **Node.js 20+** — [Download](https://nodejs.org/)
- **Docker Desktop** — [Download](https://www.docker.com/products/docker-desktop/) (for PostgreSQL + Redis)
- **Git** — [Download](https://git-scm.com/)

---

## Full Setup Guide (Step by Step)

### Step 1 — Clone the Repository

```bash
git clone <your-repo-url>
cd ProjectNextTool
```

### Step 2 — Start the Database & Redis

The project uses Docker containers for PostgreSQL 15 and Redis 7.

```bash
cd saas-platform
docker compose up -d
```

This starts:
- **PostgreSQL** on `localhost:5432` (user: `wppilot`, password: `wppilot_dev`, database: `wppilot`)
- **Redis** on `localhost:6379`

Verify containers are running:

```bash
docker compose ps
```

You should see both `wppilot-postgres` and `wppilot-redis` with status "healthy".

### Step 3 — Install Dependencies

From the **project root** (not saas-platform):

```bash
cd ..
npm install
```

This installs dependencies for all workspaces: frontend, backend, proxy-layer, and shared.

### Step 4 — Configure Environment Variables

```bash
cd saas-platform
cp .env.example .env
```

Edit `.env` with your values:

```dotenv
# Database (matches docker-compose.yml defaults — no change needed for local dev)
DATABASE_URL="postgresql://wppilot:wppilot_dev@localhost:5432/wppilot?schema=public"

# Redis (no change needed for local dev)
REDIS_URL="redis://localhost:6379"

# JWT — CHANGE THESE to random strings (min 32 characters)
JWT_SECRET="your-jwt-secret-change-me-min-32-chars"
JWT_REFRESH_SECRET="your-jwt-refresh-secret-change-me-min-32"

# Resend (for password reset emails) — Get a key at https://resend.com
RESEND_API_KEY="re_xxxxxxxxxxxx"

# URLs (defaults for local development)
FRONTEND_URL="http://localhost:3000"
BACKEND_URL="http://localhost:5000"
PROXY_URL="http://localhost:4000"

# Environment
NODE_ENV="development"
```

### Step 5 — Generate Prisma Client

```bash
cd apps/backend
npx prisma generate
```

### Step 6 — Run Database Migrations

```bash
npx prisma migrate dev
```

This creates all database tables: users, clients, client_sites, connect_tokens, activities, global_events, password_reset_tokens.

### Step 7 — Seed the Database

```bash
npx prisma db seed
```

This creates test accounts (see Seeded Accounts below).

### Step 8 — Start Development Servers

From the **project root**:

```bash
cd ../../..
npm run dev
```

This starts all 3 services concurrently:

| Service | URL | Description |
|---------|-----|-------------|
| Frontend | http://localhost:3000 | Next.js dashboard |
| Backend | http://localhost:5000 | Express API |
| Proxy | http://localhost:4000 | WP proxy with Redis cache |

You can also start services individually:

```bash
npm run dev:frontend    # Frontend only
npm run dev:backend     # Backend only
npm run dev:proxy       # Proxy only
```

### Step 9 — Verify Everything Works

1. Open http://localhost:3000 — you should see the landing page
2. Click "Login" and use a seeded account (see below)
3. Open http://localhost:5000/api/health — should return `{ "status": "ok" }`

---

## Seeded Accounts

| Role | Email | Password |
|------|-------|----------|
| Owner | owner@wppilot.com | owner123! |
| Client | client1@example.com | client123! |
| Client | client2@example.com | client123! |

---

## Database Management

```bash
# Open Prisma Studio (visual database browser)
npm run db:studio

# Run new migrations after schema changes
npm run db:migrate

# Re-seed the database
npm run db:seed

# Reset database completely (drop all data + re-migrate + re-seed)
cd saas-platform/apps/backend
npx prisma migrate reset
```

### Database Schema

| Table | Description |
|-------|-------------|
| users | All user accounts (owners + clients) |
| clients | Client profiles linked to users |
| client_sites | WordPress sites connected by clients |
| connect_tokens | One-time tokens for WP site connection |
| activities | Per-client activity log |
| global_events | System-wide events (errors, warnings) |
| password_reset_tokens | Time-limited password reset tokens |

---

## Scripts Reference

```bash
# Development
npm run dev              # Start all services (frontend + backend + proxy)
npm run dev:frontend     # Start frontend only
npm run dev:backend      # Start backend only
npm run dev:proxy        # Start proxy only

# Build
npm run build            # Build all packages

# Quality
npm run lint             # Lint all packages (ESLint)
npm run test             # Run all tests (Vitest)

# Database
npm run db:migrate       # Run Prisma migrations
npm run db:seed          # Seed database with test data
npm run db:studio        # Open Prisma Studio GUI
```

---

## i18n (Internationalization)

- **English (EN)** and **French (FR)** supported
- Language preference saved per user in database
- Switch via dropdown in the top bar
- 288 translation keys across 11 namespaces
- Powered by next-intl v4 with `[locale]` route segments

---

## Themes

- **System** — follows OS preference
- **Dark** — dark color scheme
- **Light** — light color scheme
- CSS custom properties design system (16 tokens per theme)
- Powered by next-themes with class-based switching
- Preference persisted in Zustand store + database

---

## WordPress Connection

### For End Users

1. Download the `wp-pilot-connector` plugin from `wordpress-plugin/wp-pilot-connector/`
2. Upload and activate it in your WordPress site (WP Admin → Plugins → Add New → Upload)
3. Go to WP Admin → Settings → WP Pilot
4. In the WP Pilot SaaS dashboard, go through the Onboarding wizard:
   - Step 1: Confirm your account
   - Step 2: Install the plugin on your WP site
   - Step 3: Paste the connection token into the plugin settings
   - Step 4: Verify the connection
5. Once connected, manage products, orders, and posts from the SaaS dashboard

### Plugin Features
- Products CRUD (via WooCommerce API)
- Orders list (via WooCommerce API)
- Posts CRUD (via WP_Query / wp_insert_post)
- Health monitoring (PHP, WP, theme, plugins, SSL)
- Heartbeat (WP-Cron every 5 minutes → reports status to backend)

---

## Deployment

### Production with Docker Compose

```bash
cd saas-platform

# Set production environment variables
export POSTGRES_USER=wppilot
export POSTGRES_PASSWORD=<strong-password>
export POSTGRES_DB=wppilot
export JWT_SECRET=<random-32-char-string>
export JWT_REFRESH_SECRET=<random-32-char-string>
export RESEND_API_KEY=re_<your-key>
export FRONTEND_URL=https://your-domain.com
export BACKEND_URL=https://api.your-domain.com

# Start all services
docker compose -f docker-compose.prod.yml up -d --build
```

This builds and runs all 5 containers: postgres, redis, backend, proxy, frontend.

### Individual Deployment

| Service | Platform | Method |
|---------|----------|--------|
| Frontend | Vercel | Auto-deploy from `main` branch |
| Backend | Railway / Render | Docker build via webhook |
| Proxy | Railway / Render | Docker build via webhook |
| Database | Managed PostgreSQL | Supabase / Railway / AWS RDS |
| Cache | Managed Redis | Upstash / Railway / AWS ElastiCache |

### CI/CD (GitHub Actions)

- **CI** (`.github/workflows/ci.yml`): Runs on every push — lint → typecheck → test → build
- **CD** (`.github/workflows/deploy.yml`): Deploys on push to `main` — backend webhook + Vercel frontend

---

## Project Documentation

| Document | Location | Description |
|----------|----------|-------------|
| Product Requirements | `docs/PRD-MVP.md` | MVP scope, user roles, features |
| Architecture | `docs/ARCHITECTURE.md` | System design, components, database |
| Technical Decisions | `docs/DECISIONS.md` | Why each technology was chosen |
| Roadmap | `docs/ROADMAP.md` | 6-phase development plan |
| Vision | `docs/VISION.md` | Product vision and principles |
| Done Checklist | `docs/DONE.md` | MVP completion criteria |
| Codebase Audit | `audit/AUDIT.md` | Full audit of what's built |
| Remaining Work | `audit/TODO.md` | Prioritized list of what's left |

---

## Troubleshooting

### Docker containers won't start
```bash
# Check if ports 5432 or 6379 are already in use
docker compose down
docker compose up -d
```

### Prisma migration fails
```bash
# Reset and recreate database
cd saas-platform/apps/backend
npx prisma migrate reset
```

### Frontend build errors
```bash
# Clear Next.js cache
cd saas-platform/apps/frontend
rm -rf .next
npm run build
```

### "Cannot find module" errors
```bash
# Reinstall from project root
cd ProjectNextTool
rm -rf node_modules
npm install
```

### Redis connection refused
```bash
# Check Redis container is running
docker compose ps
# Restart if needed
docker compose restart redis
```